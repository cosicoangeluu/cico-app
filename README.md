# CICO

A simple Cash In / Cash Out web app for recording transactions, fees and receipts. The project brief is in [CICO_GENERAL_INSTRUCTIONS.md](CICO_GENERAL_INSTRUCTIONS.md).

Built with Next.js 16, Tailwind CSS 4 and Supabase (database and sign-in).

## First-time setup

1. Install Node.js 22 or newer.
2. Install the packages:

   ```bash
   npm install
   ```

3. Create the Supabase project, the operator login and the database tables by following [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Until then, CICO only shows a "not connected yet" notice on the sign-in page.

## Running CICO

```bash
npm run dev
```

Open <http://localhost:3000> and sign in with the operator email and password.

## Checks

```bash
npm test          # unit tests (money and time helpers)
npm run lint
npm run build
```

## Demo mode (before the database exists)

While Supabase isn't connected and you're running `npm run dev`, the sign-in page shows **Try the demo**. Demo mode lets you go through the whole process: fee rules, cash-in, cash-out, pending cash-outs with a sender upload link, history and reports.

- Demo records are saved **only in that browser** (localStorage). Each device and browser has its own demo data. **Reset demo data** in the yellow banner clears it.
- Receipt photos are shown next to the form, but scanning (OCR) isn't available yet, so details are typed by hand.
- The sender upload link only works in the same browser in demo mode. Open it there to play the sender.
- Demo mode switches itself off once Supabase is connected, and it never appears in a production build.

## What works so far

- Operator sign-in and sign-out. Every page needs a signed-in operator, and nobody can create their own account.
- Navigation for PC (sidebar) and phone (bottom bar and "More" sheet).
- Fee rules, cash-in, cash-out, pending cash-outs, the sender's upload page, history, reports and the Overview page. They work in demo mode and against Supabase.
- With Supabase, the database itself enforces the rules ([the migration](supabase/migrations/20261017000000_foundation.sql)): the fee is taken from the fee table and locked in, a reference can be paid out on only one cash-out, a cash-out completes once, the sender's page sees only its own request, and receipt photos are private. The app can only write through those database functions.
- The same rules in `lib/cico/` give instant feedback on screen, with unit tests.

Not yet: receipt scanning (OCR), QR codes, and editing, cancelling or deleting saved records.

## Where the code is

- `lib/cico/`: CICO's rules (fees, references, completion, reports).
- `lib/data/`: the data layer. `supabase.ts` talks to the database; `demo.ts` keeps records in the browser.
- `supabase/migrations/`: the database setup to run in Supabase.

## Design

Colours mean the same thing on every screen: **green** is cash-in, **coral** is cash-out, **yellow** is pending, and **dark** is navigation. Tokens are in [app/globals.css](app/globals.css). The art direction came from the design skills in `.agents/skills`; the dealt direction sheet is saved in `.taste-skill/direction.json`.
