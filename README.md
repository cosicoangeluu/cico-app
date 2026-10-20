# CICO

**A record book for cash-in / cash-out counters.**

CICO (short for *Cash In, Cash Out*) is a web app for small shops that run a cash-in / cash-out service for e-wallet users. A customer hands over cash and the operator sends it to their wallet (cash-in), or a customer sends money to the operator's wallet and gets cash back (cash-out). The operator charges a fee for each one.

CICO doesn't move any money. The operator still does every transfer in their own wallet app. CICO keeps the books: what was moved, which fee was charged, who sent it, the receipt, and the totals at the end of the day. It also has safeguards that stop the most common and expensive mistake at a counter, which is paying out the same transfer twice.

![CICO home screen on desktop](docs/screenshots/desktop-01-home.png)

---

## Contents

- [Why CICO exists](#why-cico-exists)
- [Features](#features)
- [How it works](#how-it-works)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Security and data integrity](#security-and-data-integrity)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)

---

## Why CICO exists

Many cash-in / cash-out counters keep their records in a paper notebook or a chat thread. That leads to the same few problems:

- **Fees get mixed into the amount.** The operator's earnings and the customer's money end up in one number, so it's hard to know what the counter actually made.
- **Cash gets handed out twice.** A customer shows a screenshot of a transfer that was already paid out, or one that never arrived.
- **Remote senders are messy.** The person collecting the cash is often not the person sending the money, so receipts arrive through chat and get lost.
- **Daily totals take time.** Adding up a day, week or month by hand is slow and easy to get wrong.

CICO handles each of these: the fee always stays separate, each transfer reference can be paid out only once, remote senders get their own upload link, and reports add themselves up.

---

## Features

### Cash-in
The customer gives cash and the operator sends it to the customer's wallet. The operator types the amount, CICO looks up the fee from the fee table and shows the total the customer pays (amount + fee). The operator then sends the transfer, adds an optional receipt photo, types the reference number, the customer's name and the transfer time, and saves. Cash-ins are saved as **completed** right away.

### Cash-out
The customer sends money to the operator's wallet and gets cash. Before any cash goes out, CICO asks the operator to confirm they can see the transfer in **their own** wallet history. If the money hasn't arrived yet, the cash-out is saved as **pending** and no cash changes hands.

### Pending cash-outs and the sender upload link
When someone other than the receiver sends the money (for example, a relative in another city), the operator saves the cash-out as pending and copies a private **upload link**. The sender opens the link on their phone, sees only the amount and the receiver's first name, and uploads a photo of their receipt with their name and, if they like, the reference number. The receipt then appears on the pending cash-out. After the operator checks the money in their wallet, they complete it. The link stops working as soon as the cash-out is completed.

### Fee rules
The operator sets up their own fee table as amount ranges, each with a fixed fee (e.g. up to ₱500 → ₱10, up to ₱1,000 → ₱20). One table covers both cash-in and cash-out, and each range starts right above the previous one, so there are no gaps. When rates change, the operator edits the table. **Past records keep the fee they were saved with**, because each transaction stores the fee and the range that applied at the time. CICO refuses to record an amount above the highest range instead of guessing.

### Transaction history
A full list of every cash-in and cash-out with amount, fee, names, reference number, transfer time, the fee rule used and the receipt photo. Pending and completed records are clearly marked.

### Reports
Totals for **Today**, **This week**, **This month** or a custom date range. Money moved (the customers' money passing through) and **fees earned** (the operator's income) are shown separately for cash-in and cash-out. All dates follow Philippine time (Asia/Manila).

### Receipt photos and manual entry
The operator can take a photo or upload a picture of a receipt, and it stays next to the form while they type the details. Photos are shrunk in the browser before upload. A photo is never required: with no receipt, the details can be typed from the wallet history.

### Built-in operator guide
An **Overview** page inside the app explains CICO in plain language: the three workflows step by step, worked fee examples, good habits for the counter, and a FAQ. An owner can hand it to a new operator as training.

### Works on phone and PC
On a computer there's a sidebar. On a phone there's a bottom bar with a "More" sheet. Buttons and text are large, colours have fixed meanings (**green** = cash-in, **coral** = cash-out, **yellow** = pending, **dark** = navigation), and every step can be done with a keyboard.

### Demo mode
If no database is connected and the app runs in development, the sign-in page offers **Try the demo**. Every feature works, with records saved only in that browser (localStorage). A yellow banner shows that demo mode is on and has a **Reset demo data** button. Demo mode turns itself off once Supabase is connected and never appears in a production build.

---

## How it works

The fee is **always paid on top** of the amount, never taken out of it.

| | Customer pays | Customer gets |
|---|---|---|
| **Cash-in** (₱1,000, ₱10 fee) | ₱1,000 cash + ₱10 fee | ₱1,000 in their wallet |
| **Cash-out** (₱1,000, ₱10 fee) | ₱1,000 wallet transfer + ₱10 fee | ₱1,000 cash |

*Example amounts only. Real fees come from the operator's fee table.*

### The three workflows

1. **Cash-in:** type the amount → CICO shows the fee → collect amount + fee → send from your wallet → add receipt and reference → save (completed).
2. **Cash-out, customer sends:** type the amount → customer sends to your wallet → **check your own wallet history** → add reference → collect fee, hand over cash → complete.
3. **Cash-out, someone else sends:** type the amount and both names → save as pending → share the upload link → sender transfers and uploads the receipt → **check your own wallet history** → collect fee from the receiver, hand over cash → complete.

### Three rules CICO is built around

1. The fee is always on top.
2. Check your own wallet before cash goes out. A receipt or screenshot alone isn't proof.
3. Never share a PIN, password or one-time code. CICO never asks for them.

---

## Screenshots

| Desktop | |
|---|---|
| ![Cash-in with fee](docs/screenshots/desktop-02-cash-in-fee.png) Cash-in: fee looked up from the fee table | ![Cash-in receipt](docs/screenshots/desktop-03-cash-in-receipt.png) Receipt photo next to the form |
| ![Cash-out, separate sender](docs/screenshots/desktop-04-cash-out-separate-sender.png) Cash-out with a separate sender | ![Pending list](docs/screenshots/desktop-05-pending-list.png) Pending cash-outs |
| ![Pending verify](docs/screenshots/desktop-06-pending-verify.png) Checking and completing a pending cash-out | ![History](docs/screenshots/desktop-07-history.png) Transaction history |
| ![Reports](docs/screenshots/desktop-08-reports.png) Reports | ![Fee rules](docs/screenshots/desktop-09-fee-rules.png) Fee rules |
| ![Overview](docs/screenshots/desktop-10-overview.png) Built-in operator guide | ![Sign in](docs/screenshots/desktop-11-sign-in.png) Sign-in |

| Phone | | |
|---|---|---|
| ![Home](docs/screenshots/phone-01-home.png) Home | ![Cash-in](docs/screenshots/phone-02-cash-in-fee.png) Cash-in | ![Pending](docs/screenshots/phone-03-pending.png) Pending |
| ![History](docs/screenshots/phone-04-history.png) History | ![Reports](docs/screenshots/phone-05-reports.png) Reports | ![More menu](docs/screenshots/phone-06-more-menu.png) "More" menu |
| ![Sender upload](docs/screenshots/phone-07-sender-upload.png) Sender's upload page | ![Sender sent](docs/screenshots/phone-08-sender-sent.png) Receipt sent | ![Sign in](docs/screenshots/phone-09-sign-in.png) Sign-in |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack, Cache Components, partial prefetching) |
| UI | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), [Lucide](https://lucide.dev) icons |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Database | [Supabase](https://supabase.com) Postgres with row-level security and `security definer` SQL functions |
| Auth | Supabase Auth (email + password) through [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side) with cookie sessions |
| File storage | Supabase Storage (private `receipts` bucket) |
| Testing | [Vitest 5](https://vitest.dev) |
| Linting | ESLint 9 with `eslint-config-next` |
| Hosting | [Vercel](https://vercel.com), Singapore region (`sin1`), close to users in the Philippines |

---

## Architecture

```
┌────────────────────────────── Browser ──────────────────────────────┐
│  Next.js pages (app/)                                               │
│     │                                                               │
│     ▼                                                               │
│  Business rules (lib/cico/)  ── instant feedback: fee lookup,       │
│     │                           reference checks, report totals     │
│     ▼                                                               │
│  Data layer (lib/data/)  ── one interface, two sources:             │
│     ├── demo.ts      → localStorage (demo mode only)                │
│     └── supabase.ts  → Supabase ───────────────────────┐            │
└────────────────────────────────────────────────────────┼────────────┘
                                                         ▼
                              ┌──────────── Supabase ────────────────┐
                              │  Postgres functions (all writes)     │
                              │  Row-level security (read own rows)  │
                              │  Private "receipts" storage bucket   │
                              │  Auth (operator sign-in)             │
                              └──────────────────────────────────────┘
```

- **Rules in two places, on purpose.** The same business rules exist in TypeScript (`lib/cico/`) for instant on-screen feedback and in SQL (`supabase/migrations/`) as the real enforcement. A buggy or tampered client still can't break them.
- **Swappable data source.** Every screen talks to a single `CicoSource` interface (`lib/data/types.ts`). Demo mode and Supabase each implement it, so the screens don't know which one they're using.
- **Money as whole centavos.** Amounts are stored and calculated as integers (`bigint` centavos), never floating-point pesos, so ₱0.10 + ₱0.20 is always exactly ₱0.30.
- **References stored as text.** Leading zeroes and every character are kept exactly. For duplicate checks, references are compared with spaces removed and letters upper-cased.
- **One business timezone.** All dates and report ranges use Asia/Manila (UTC+8).
- **Session handling** runs in Next.js's `proxy.ts` (the successor to middleware), which refreshes the Supabase session cookie on each request.

---

## Security and data integrity

The database itself enforces the rules, not just the screens:

- **No direct writes.** Tables are read-only to the app. Every insert and update goes through a SQL function that checks the rules first (`create_cash_in`, `create_cash_out`, `complete_cash_out`, `save_fee_tiers`, `submit_sender_receipt`, …).
- **The fee is decided by the database.** It's looked up from the operator's fee table when the record is created, saved with the range it came from, and never recalculated.
- **Each transfer pays out once.** A unique index makes it impossible to use the same reference number on two cash-outs (spaces and letter case ignored).
- **A cash-out completes once,** and only after the operator confirms the money is in their wallet and the cash was handed over. Database constraints check that a completed record has a completion time, a reference and, for cash-outs, a funds-verified time.
- **Operators see only their own data** (row-level security on every table).
- **No public sign-up.** Operator accounts are created by the owner in Supabase. The app has no registration screen.
- **The sender link reveals almost nothing.** It uses an unguessable token tied to one pending cash-out, shows only the amount and the receiver's first name, can attach a receipt but can never verify or complete anything, and stops working once the cash-out is completed. What the sender types is kept apart from what the operator saves.
- **Receipts are private.** Photos live in a private storage bucket with size and file-type limits. Operators can read only their own receipts. Senders can upload only to an open request.
- **Saved records can't be edited, cancelled or deleted,** so history can't be rewritten after the fact.

---

## Getting started

### Requirements
- Node.js 22 or newer
- A Supabase project (optional, since demo mode works without one)

### 1. Install

```bash
npm install
```

### 2. Try it without a database (demo mode)

```bash
npm run dev
```

Open <http://localhost:3000> and click **Try the demo**. Records stay in that browser only.

### 3. Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/migrations/20261017000000_foundation.sql`](supabase/migrations/20261017000000_foundation.sql). It creates the tables, rules, functions, security policies and the `receipts` storage bucket.
3. Under **Authentication → Users**, create the operator's email and password. It's a good idea to turn off new user sign-ups as well.
4. Create `.env.local` in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

5. Restart `npm run dev` and sign in with the operator account.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Unit tests (fees, transactions, reports, money, time) |
| `npm run lint` | ESLint |

### Deploying
The project is set up for Vercel (`vercel.json` pins the Singapore region). Add the two environment variables above in the Vercel project settings and deploy.

---

## Project structure

```
app/
  (app)/            Signed-in screens
    page.tsx          Home: choose cash-in or cash-out
    cash-in/          Cash-in form
    cash-out/         Cash-out form
    pending/          Pending cash-outs and their detail/complete page
    history/          Transaction history
    reports/          Totals by period
    fees/             Fee rules editor
    overview/         Built-in operator guide and FAQ
  login/            Operator sign-in (and "Try the demo")
  send/[token]/     Public sender receipt-upload page
components/         Shared UI: navigation, money input, receipt picker, fee breakdown, …
lib/
  cico/             Business rules: fees, transactions, reports (with tests)
  data/             Data layer: one interface, demo + Supabase implementations
  demo/             Demo-mode switch, browser store, image handling
  supabase/         Supabase clients (browser, server, proxy)
  money.ts          Centavo math and peso formatting
  time.ts           Asia/Manila date helpers
supabase/
  migrations/       Database schema, rules, functions and policies
docs/screenshots/   Screenshots used in this README
proxy.ts            Session refresh on every request
```

---

## Roadmap

Working today: sign-in, cash-in, cash-out, pending cash-outs, the sender upload link, history, reports, fee rules, the Overview guide, phone and PC layouts, and demo mode.

Not built yet:
- **Receipt scanning (OCR)** to read the reference, amount and time off a photo automatically. For now, details are typed while looking at the photo.
- **QR codes** for the sender upload link.
- **Editing, cancelling or deleting** saved records. These are blocked on purpose until the right rules are decided.
