-- CICO database: run once in the Supabase SQL Editor (see SUPABASE_SETUP.md).
--
-- Rules enforced here, not only on screen:
--   * principal and fee are separate whole-centavo amounts
--   * the fee comes from the operator's fee table when a record is created and
--     is never recalculated
--   * a transfer reference can be used on only one cash-out (spaces and letter
--     case ignored)
--   * a cash-out is completed at most once, only after the operator confirms
--     the money is in their wallet and the cash was handed over
--   * a sender's upload attaches a receipt to its one pending request; it never
--     verifies or completes anything
--   * saved records can't be edited, cancelled or deleted (not decided yet)
--
-- All writes go through the functions below. Tables are read-only to the app.

------------------------------------------------------------------------------
-- Types and tables
------------------------------------------------------------------------------

create type public.transaction_type as enum ('cash_in', 'cash_out');
create type public.transaction_status as enum ('pending', 'completed');

-- One shared fee table for cash-in and cash-out. Each row covers the amounts
-- above the previous row's limit up to and including its own limit.
create table public.fee_tiers (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  up_to_centavos bigint not null check (up_to_centavos > 0),
  fee_centavos bigint not null check (fee_centavos >= 0),
  created_at timestamptz not null default now(),
  unique (operator_id, up_to_centavos)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null default auth.uid()
    references auth.users (id) on delete restrict,
  type public.transaction_type not null,
  status public.transaction_status not null default 'pending',

  principal_centavos bigint not null check (principal_centavos > 0),
  fee_centavos bigint not null check (fee_centavos >= 0),
  -- The fee rule that applied when the record was created.
  fee_from_centavos bigint not null,
  fee_up_to_centavos bigint not null,

  -- Text, so leading zeroes and every character are kept exactly.
  reference_number text not null default '' check (char_length(reference_number) <= 64),
  -- How references are compared: spaces removed, letters upper-cased.
  reference_key text generated always as
    (upper(regexp_replace(reference_number, '\s', '', 'g'))) stored,
  sender_name text not null default '' check (char_length(sender_name) <= 120),
  receiver_name text not null default '' check (char_length(receiver_name) <= 120),
  transferred_at timestamptz,

  -- Receipt photo in the private "receipts" storage bucket.
  receipt_path text,
  receipt_uploaded_by text check (receipt_uploaded_by in ('operator', 'sender')),
  receipt_uploaded_at timestamptz,
  -- What a remote sender typed. Kept apart from what the operator saves.
  sender_note_name text check (char_length(sender_note_name) <= 120),
  sender_note_reference text check (char_length(sender_note_reference) <= 64),

  -- Unguessable token for the sender's upload page (pending cash-outs only).
  upload_token text unique,

  -- Set only when the operator confirmed the money in their own wallet.
  funds_verified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint completed_has_completed_at
    check ((status = 'completed') = (completed_at is not null)),
  constraint completed_has_reference
    check (status <> 'completed' or reference_key <> ''),
  constraint completed_cash_out_is_verified
    check (type <> 'cash_out' or status <> 'completed' or funds_verified_at is not null)
);

comment on table public.transactions is
  'Cash-in and cash-out records. Principal and fee are separate amounts in centavos.';

-- Each transfer reference can be paid out on only one cash-out.
create unique index transactions_cash_out_reference_once
  on public.transactions (operator_id, reference_key)
  where type = 'cash_out' and reference_key <> '';

create index transactions_operator_created_idx
  on public.transactions (operator_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------
-- Row level security: the operator reads only their own rows. No direct
-- writes at all; the functions below do every write after checking the rules.
------------------------------------------------------------------------------

alter table public.fee_tiers enable row level security;
alter table public.transactions enable row level security;

create policy "Operator reads own fee tiers"
  on public.fee_tiers for select to authenticated
  using (operator_id = (select auth.uid()));

create policy "Operator reads own transactions"
  on public.transactions for select to authenticated
  using (operator_id = (select auth.uid()));

revoke insert, update, delete, truncate on public.fee_tiers from anon, authenticated;
revoke insert, update, delete, truncate on public.transactions from anon, authenticated;
revoke select on public.fee_tiers, public.transactions from anon;

------------------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------------------

-- The signed-in operator, or an error.
create function public.cico_operator()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Please sign in again.';
  end if;
  return actor;
end;
$$;

-- The fee rule covering an amount for an operator, or an explained error.
create function public.cico_find_fee(actor uuid, amount bigint)
returns table (fee_centavos bigint, from_centavos bigint, up_to_centavos bigint)
language plpgsql
stable
set search_path = ''
as $$
declare
  tier record;
  previous_limit bigint;
  top_limit bigint;
begin
  select t.up_to_centavos, t.fee_centavos into tier
  from public.fee_tiers t
  where t.operator_id = actor and t.up_to_centavos >= amount
  order by t.up_to_centavos
  limit 1;

  if not found then
    select max(t.up_to_centavos) into top_limit
    from public.fee_tiers t where t.operator_id = actor;
    if top_limit is null then
      raise exception 'There are no fee rules yet. Add them in Fee rules first.';
    end if;
    raise exception 'No fee rule covers this amount. Add a range for it in Fee rules first.';
  end if;

  select max(t.up_to_centavos) into previous_limit
  from public.fee_tiers t
  where t.operator_id = actor and t.up_to_centavos < tier.up_to_centavos;

  fee_centavos := tier.fee_centavos;
  from_centavos := coalesce(previous_limit, 0) + 1;
  up_to_centavos := tier.up_to_centavos;
  return next;
end;
$$;

-- A friendly message when a reference is already on another cash-out.
create function public.cico_reference_taken(actor uuid, reference text, except_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.transactions t
    where t.operator_id = actor
      and t.type = 'cash_out'
      and t.reference_key = upper(regexp_replace(reference, '\s', '', 'g'))
      and t.reference_key <> ''
      and t.id is distinct from except_id
  );
$$;

------------------------------------------------------------------------------
-- Operator actions (signed-in operator only)
------------------------------------------------------------------------------

-- Replaces the fee table. New fees apply to new records only.
create function public.save_fee_tiers(tiers jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := public.cico_operator();
  tier jsonb;
begin
  if jsonb_typeof(tiers) <> 'array' then
    raise exception 'Fee rules must be a list.';
  end if;

  for tier in select * from jsonb_array_elements(tiers) loop
    if (tier->>'up_to_centavos')::bigint is null or (tier->>'up_to_centavos')::bigint <= 0 then
      raise exception 'Every range needs the highest amount it covers.';
    end if;
    if (tier->>'fee_centavos')::bigint is null or (tier->>'fee_centavos')::bigint < 0 then
      raise exception 'Every range needs a fee (0 if free).';
    end if;
  end loop;

  if (select count(distinct (t->>'up_to_centavos')::bigint) from jsonb_array_elements(tiers) t)
     <> jsonb_array_length(tiers) then
    raise exception 'Two ranges end at the same amount.';
  end if;

  delete from public.fee_tiers where operator_id = actor;
  insert into public.fee_tiers (operator_id, up_to_centavos, fee_centavos)
  select actor, (t->>'up_to_centavos')::bigint, (t->>'fee_centavos')::bigint
  from jsonb_array_elements(tiers) t;
end;
$$;

-- Records a completed cash-in: the operator has been paid and sent the money.
create function public.create_cash_in(
  principal_centavos bigint,
  reference_number text,
  customer_name text,
  transferred_at timestamptz,
  receipt_path text,
  customer_paid boolean,
  transfer_sent boolean
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := public.cico_operator();
  fee record;
  saved public.transactions;
begin
  if principal_centavos is null or principal_centavos <= 0 then
    raise exception 'Enter the amount.';
  end if;
  if coalesce(btrim(reference_number), '') = '' then
    raise exception 'Enter the reference number of your transfer.';
  end if;
  if coalesce(btrim(customer_name), '') = '' then
    raise exception 'Enter the name of the wallet owner.';
  end if;
  if transferred_at is null then
    raise exception 'Enter the date and time of the transfer.';
  end if;
  if not coalesce(customer_paid, false) or not coalesce(transfer_sent, false) then
    raise exception 'Confirm the customer paid and your transfer went through.';
  end if;
  if receipt_path is not null and receipt_path not like 'operator/' || actor::text || '/%' then
    raise exception 'That receipt photo belongs to someone else.';
  end if;

  select * into fee from public.cico_find_fee(actor, principal_centavos);

  insert into public.transactions (
    operator_id, type, status, principal_centavos, fee_centavos,
    fee_from_centavos, fee_up_to_centavos, reference_number, sender_name,
    receiver_name, transferred_at, receipt_path, receipt_uploaded_by,
    receipt_uploaded_at, completed_at
  ) values (
    actor, 'cash_in', 'completed', principal_centavos, fee.fee_centavos,
    fee.from_centavos, fee.up_to_centavos, btrim(reference_number), 'Operator',
    btrim(customer_name), transferred_at, receipt_path,
    case when receipt_path is null then null else 'operator' end,
    case when receipt_path is null then null else now() end, now()
  )
  returning * into saved;
  return saved;
end;
$$;

-- Records a cash-out: completed now (money checked, cash handed over) or pending.
create function public.create_cash_out(
  principal_centavos bigint,
  sender_name text,
  receiver_name text,
  complete_now boolean,
  reference_number text,
  transferred_at timestamptz,
  receipt_path text,
  funds_verified boolean,
  cash_released boolean,
  with_upload_link boolean
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := public.cico_operator();
  fee record;
  saved public.transactions;
  reference text := btrim(coalesce(reference_number, ''));
begin
  if principal_centavos is null or principal_centavos <= 0 then
    raise exception 'Enter the amount.';
  end if;
  if coalesce(btrim(receiver_name), '') = '' then
    raise exception 'Enter the name of the person collecting the cash.';
  end if;
  if receipt_path is not null and receipt_path not like 'operator/' || actor::text || '/%' then
    raise exception 'That receipt photo belongs to someone else.';
  end if;

  if complete_now then
    if reference = '' then
      raise exception 'Enter the reference number of the transfer.';
    end if;
    if coalesce(btrim(sender_name), '') = '' then
      raise exception 'Enter the sender''s name.';
    end if;
    if transferred_at is null then
      raise exception 'Enter the date and time of the transfer.';
    end if;
    if not coalesce(funds_verified, false) then
      raise exception 'Confirm you found the money in your own wallet history.';
    end if;
    if not coalesce(cash_released, false) then
      raise exception 'Confirm you collected the fee and handed over the full cash amount.';
    end if;
    if public.cico_reference_taken(actor, reference, null) then
      raise exception 'Reference % is already recorded on another cash-out. Each transfer can only be paid out once.', reference;
    end if;
  else
    reference := '';
  end if;

  select * into fee from public.cico_find_fee(actor, principal_centavos);

  insert into public.transactions (
    operator_id, type, status, principal_centavos, fee_centavos,
    fee_from_centavos, fee_up_to_centavos, reference_number, sender_name,
    receiver_name, transferred_at, receipt_path, receipt_uploaded_by,
    receipt_uploaded_at, upload_token, funds_verified_at, completed_at
  ) values (
    actor, 'cash_out',
    case when complete_now then 'completed' else 'pending' end::public.transaction_status,
    principal_centavos, fee.fee_centavos, fee.from_centavos, fee.up_to_centavos,
    reference, btrim(coalesce(sender_name, '')), btrim(receiver_name),
    case when complete_now then transferred_at end, receipt_path,
    case when receipt_path is null then null else 'operator' end,
    case when receipt_path is null then null else now() end,
    case when not complete_now and with_upload_link
      then replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    end,
    case when complete_now then now() end,
    case when complete_now then now() end
  )
  returning * into saved;
  return saved;
exception
  when unique_violation then
    raise exception 'Reference % is already recorded on another cash-out. Each transfer can only be paid out once.', reference;
end;
$$;

-- Completes a pending cash-out. The row is locked, so two devices can't both
-- complete it; the second sees it is already completed.
create function public.complete_cash_out(
  transaction_id uuid,
  reference_number text,
  sender_name text,
  receiver_name text,
  transferred_at timestamptz,
  funds_verified boolean,
  cash_released boolean
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := public.cico_operator();
  existing public.transactions;
  saved public.transactions;
  reference text := btrim(coalesce(reference_number, ''));
begin
  select * into existing from public.transactions t
  where t.id = transaction_id and t.operator_id = actor
  for update;

  if not found then
    raise exception 'This cash-out no longer exists.';
  end if;
  if existing.type <> 'cash_out' then
    raise exception 'Only cash-outs can be completed here.';
  end if;
  if existing.status <> 'pending' then
    raise exception 'This cash-out is already completed. It can''t be paid out twice.';
  end if;
  if reference = '' then
    raise exception 'Enter the reference number of the transfer.';
  end if;
  if coalesce(btrim(sender_name), '') = '' then
    raise exception 'Enter the sender''s name.';
  end if;
  if coalesce(btrim(receiver_name), '') = '' then
    raise exception 'Enter the name of the person collecting the cash.';
  end if;
  if transferred_at is null then
    raise exception 'Enter the date and time of the transfer.';
  end if;
  if not coalesce(funds_verified, false) then
    raise exception 'Confirm you found the money in your own wallet history.';
  end if;
  if not coalesce(cash_released, false) then
    raise exception 'Confirm you collected the fee and handed over the full cash amount.';
  end if;
  if public.cico_reference_taken(actor, reference, transaction_id) then
    raise exception 'Reference % is already recorded on another cash-out. Each transfer can only be paid out once.', reference;
  end if;

  update public.transactions t set
    status = 'completed',
    reference_number = reference,
    sender_name = btrim(complete_cash_out.sender_name),
    receiver_name = btrim(complete_cash_out.receiver_name),
    transferred_at = complete_cash_out.transferred_at,
    funds_verified_at = now(),
    completed_at = now()
  where t.id = transaction_id
  returning * into saved;
  return saved;
exception
  when unique_violation then
    raise exception 'Reference % is already recorded on another cash-out. Each transfer can only be paid out once.', reference;
end;
$$;

-- Attaches (or removes) the operator's own receipt photo on a pending cash-out.
create function public.set_operator_receipt(transaction_id uuid, receipt_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := public.cico_operator();
begin
  if receipt_path is not null and receipt_path not like 'operator/' || actor::text || '/%' then
    raise exception 'That receipt photo belongs to someone else.';
  end if;

  update public.transactions t set
    receipt_path = set_operator_receipt.receipt_path,
    receipt_uploaded_by = case when set_operator_receipt.receipt_path is null then null else 'operator' end,
    receipt_uploaded_at = case when set_operator_receipt.receipt_path is null then null else now() end,
    sender_note_name = null,
    sender_note_reference = null
  where t.id = transaction_id and t.operator_id = actor and t.status = 'pending';

  if not found then
    raise exception 'Only a pending cash-out can get a new receipt.';
  end if;
end;
$$;

------------------------------------------------------------------------------
-- The sender's public upload page (no sign-in). It can learn only the amount
-- and the receiver's first name, and can only attach a receipt.
------------------------------------------------------------------------------

create function public.cico_upload_open(token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.transactions t
    where t.upload_token = token and t.status = 'pending'
  );
$$;

create function public.get_upload_request(token text)
returns table (amount_centavos bigint, receiver_first_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select t.principal_centavos, split_part(btrim(t.receiver_name), ' ', 1)
  from public.transactions t
  where t.upload_token = token and t.status = 'pending';
$$;

create function public.submit_sender_receipt(
  token text,
  receipt_path text,
  sender_name text,
  sender_reference text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if receipt_path is null or receipt_path not like 'sender/' || token || '/%' then
    raise exception 'Upload the receipt picture first.';
  end if;
  if coalesce(btrim(submit_sender_receipt.sender_name), '') = '' then
    raise exception 'Enter your name.';
  end if;

  update public.transactions t set
    receipt_path = submit_sender_receipt.receipt_path,
    receipt_uploaded_by = 'sender',
    receipt_uploaded_at = now(),
    sender_note_name = left(btrim(submit_sender_receipt.sender_name), 120),
    sender_note_reference = left(btrim(coalesce(submit_sender_receipt.sender_reference, '')), 64)
  where t.upload_token = token and t.status = 'pending';

  if not found then
    raise exception 'This link is no longer active.';
  end if;
end;
$$;

------------------------------------------------------------------------------
-- Who may call what. Supabase lets everyone call new functions by default.
------------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.save_fee_tiers(jsonb),
  public.create_cash_in(bigint, text, text, timestamptz, text, boolean, boolean),
  public.create_cash_out(bigint, text, text, boolean, text, timestamptz, text, boolean, boolean, boolean),
  public.complete_cash_out(uuid, text, text, text, timestamptz, boolean, boolean),
  public.set_operator_receipt(uuid, text)
to authenticated;

grant execute on function
  public.get_upload_request(text),
  public.submit_sender_receipt(text, text, text, text)
to anon, authenticated;

------------------------------------------------------------------------------
-- Receipt photos: a private bucket.
--   operator/<operator id>/<file>  uploaded by the signed-in operator
--   sender/<upload token>/<file>   uploaded from the sender's page
-- Nobody can overwrite or delete files; the operator can view only photos in
-- their own folder or attached to their own records.
------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Operator uploads own receipts"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = 'operator'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "Sender uploads to an open request"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = 'sender'
    and public.cico_upload_open((storage.foldername(name))[2])
  );

create policy "Operator views own receipts"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (
      (
        (storage.foldername(name))[1] = 'operator'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
      or exists (
        select 1 from public.transactions t
        where t.receipt_path = storage.objects.name
          and t.operator_id = (select auth.uid())
      )
    )
  );

grant execute on function public.cico_upload_open(text) to anon, authenticated;
