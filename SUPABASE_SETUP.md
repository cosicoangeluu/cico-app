# Setting up Supabase for CICO

Supabase stores CICO's records online, so you can reach them from any device. The free plan is enough to start. This takes about 10 minutes.

> The Supabase dashboard changes from time to time. If a button has a slightly different name, look for the closest match.

## 1. Create your account and project

1. Go to <https://supabase.com> and click **Start your project**.
2. Sign up with your email (or GitHub) and confirm your email address.
3. Click **New project** and fill in:
   - **Organization:** your personal one is fine.
   - **Project name:** `cico`
   - **Database password:** click **Generate a password**, then save it somewhere safe, like a password manager. CICO doesn't need it day to day, but you'll want it if you ever need to recover the database.
   - **Region:** **Southeast Asia (Singapore)**. It's the closest to the Philippines, so CICO will be faster.
   - **Plan:** Free.
4. Click **Create new project** and wait 1–2 minutes while it gets ready.

## 2. Stop strangers from creating accounts

CICO has one operator, so nobody else should be able to sign up.

1. In the left menu, open **Authentication** → **Sign In / Providers**.
2. Turn **off** **Allow new users to sign up**, then click **Save**.

## 3. Create your operator login

1. Open **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter the email and password you'll use to sign in to CICO.
4. Tick **Auto Confirm User**, then click **Create user**.

## 4. Create CICO's database

1. Open **SQL Editor** in the left menu and click **New query**.
2. In this project, open `supabase/migrations/20261017000000_foundation.sql`, copy everything in it, and paste it into the editor.
3. Click **Run**. You should see **Success. No rows returned**.

This creates CICO's tables (`fee_tiers` and `transactions`), the rules that protect them, and a private storage area called **receipts** for receipt photos.

To check it worked:

- **Table Editor** lists `fee_tiers` and `transactions`.
- **Storage** lists a bucket called `receipts`, marked private.

Run this file only once. If you run it a second time you'll get "already exists" errors; that's harmless, and it means everything is already there.

## 5. Connect CICO to your project

1. In the project folder, make a copy of `.env.example` and name the copy `.env.local`.
2. In Supabase, click **Project Settings** (the gear icon at the bottom left).
3. Open **Data API** and copy the **Project URL**. Paste it after `NEXT_PUBLIC_SUPABASE_URL=` in `.env.local`. Keep only the part up to `.supabase.co`; if it ends in `/rest/v1/`, delete that part.
4. Open **API Keys** and copy the **Publishable key** (it starts with `sb_publishable_`). Paste it after `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`.
5. Save `.env.local`.

It should look like this, with your own values:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

**Never put the secret key (`sb_secret_…`) or your database password in this file, and never share them.** The publishable key is safe to use here, because the database only lets your signed-in account see your records.

## 6. Start CICO

```bash
npm run dev
```

Open <http://localhost:3000> and sign in with the email and password from step 3. If CICO was already running, stop it (Ctrl+C) and start it again so it picks up `.env.local`.

Demo mode switches off once CICO is connected. Demo records stay in the browser where you made them; they aren't copied into the database. Start by adding your fee ranges in **Fee rules**.

## Good to know

- **Free projects pause after about a week with no activity.** If CICO stops loading, open your Supabase dashboard and click **Restore project**.
- `.env.local` stays on your computer and is never shared. When CICO is put online later, the same two values get entered in the hosting provider's settings.
