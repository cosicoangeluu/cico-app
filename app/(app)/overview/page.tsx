import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Banknote,
  BookOpen,
  Calculator,
  Camera,
  ChartColumn,
  CircleQuestionMark,
  CircleDollarSign,
  Clock,
  House,
  LayoutGrid,
  Link as LinkIcon,
  ListChecks,
  Lock,
  ReceiptText,
  Route,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { demoAvailable } from "@/lib/demo/mode";
import { stagger } from "@/components/stagger";
import { tones, type Tone } from "@/components/tones";
import { FaqList } from "./faq-list";
import { WorkflowTabs } from "./workflow-tabs";

export const metadata: Metadata = { title: "Overview" };

const sections: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "about", label: "About", icon: BookOpen },
  { id: "features", label: "Features", icon: LayoutGrid },
  { id: "workflows", label: "Workflows", icon: Route },
  { id: "guide", label: "Operator guide", icon: ListChecks },
  { id: "faq", label: "Questions", icon: CircleQuestionMark },
];

/**
 * A plain-language guide the owner can show to the operator. Everything here
 * must match what the screens actually do; say so when something isn't built.
 */
export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header
        className={`rise flex min-h-80 flex-col justify-between gap-10 rounded-ui p-6 sm:p-10 ${tones.night}`}
      >
        <div>
          <p className="text-small text-night-ink/75">Overview</p>
          <h1 className="font-display text-giant font-light leading-[0.85] tracking-[-0.05em]">
            CICO
          </h1>
        </div>
        <p className="max-w-[32ch] text-lead">
          A simple notebook for your cash-in and cash-out counter. You move the
          money; CICO keeps the record straight.
        </p>
      </header>

      <nav aria-label="On this page" className="rise mt-3 flex flex-wrap gap-2" style={stagger(1)}>
        {sections.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="pressable inline-flex h-12 items-center gap-2 rounded-full bg-surface px-5 font-medium"
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </a>
        ))}
      </nav>

      <section
        aria-labelledby="status-title"
        className={`rise mt-3 rounded-ui p-6 sm:p-8 ${tones.pending}`}
        style={stagger(2)}
      >
        <h2 id="status-title" className="text-lead font-medium">
          What works today
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <p className="font-medium">Ready</p>
            <p>
              Cash-in, cash-out, pending cash-outs, the sender&apos;s
              receipt-upload link, receipt scanning, history, reports and fee
              rules.
            </p>
          </div>
          <div>
            <p className="font-medium">Not yet</p>
            <p>
              QR codes for the sender link. Scanning can misread a blurry or
              glary photo, so always check what it filled in.
            </p>
          </div>
        </div>
        <p className="mt-4 text-small">
          {demoAvailable
            ? "CICO is in demo mode: records stay in this browser only, and the yellow bar at the top says so."
            : "Records are saved in CICO's online database, so they're there on any phone or computer where you sign in."}
        </p>
      </section>

      {/* 1. About */}
      <Section id="about" number="01" label="About" title="What CICO is for">
        <p className="text-lead">
          CICO helps the operator of a cash-in / cash-out counter record every
          transaction, its separate fee and its receipt, then look back at
          history and totals.
        </p>
      </Section>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Benefit icon={Users} title="Made for the operator">
          The person behind the counter signs in and uses CICO. Customers
          don&apos;t need an account.
        </Benefit>
        <Benefit icon={CircleDollarSign} title="Fees are never guessed">
          CICO works out the fee from your own fee table and always keeps it
          apart from the amount.
        </Benefit>
        <Benefit icon={ShieldCheck} title="Each transfer pays out once">
          A transfer reference already used on another cash-out is blocked, so
          cash can&apos;t go out twice.
        </Benefit>
      </div>
      <div className={`mt-3 flex items-start gap-4 rounded-ui p-6 sm:p-8 ${tones.night}`}>
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bg text-ink">
          <Wallet aria-hidden className="size-7" />
        </span>
        <p className="text-lead">
          CICO <strong className="font-medium">records</strong> transactions. It
          does not send or receive money. You still do every transfer in your
          own wallet app.
        </p>
      </div>

      {/* 2. Features */}
      <Section id="features" number="02" label="Features" title="What you can do">
        <p>
          Each colour means one thing everywhere in CICO, so you can tell what
          you&apos;re looking at before reading a word.
        </p>
      </Section>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Swatch tone="cash-in" icon={Wallet} name="Green" meaning="Cash-in" />
        <Swatch tone="cash-out" icon={Banknote} name="Coral" meaning="Cash-out" />
        <Swatch tone="pending" icon={Clock} name="Yellow" meaning="Pending, waiting for money" />
        <Swatch tone="night" icon={House} name="Night" meaning="Menus and general screens" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Feature icon={ReceiptText} title="Transaction history" ready>
          Every cash-in and cash-out, with amount, fee, names, reference,
          transfer time and the fee rule used. Pending and completed are clearly
          marked.
        </Feature>
        <Feature icon={ChartColumn} title="Reports" ready>
          Totals for today, this week, this month or dates you choose. Money
          moved and fees earned are shown separately.
        </Feature>
        <Feature icon={Calculator} title="Fee rules" ready>
          Set your own amount ranges and fees. Change them when rates change.
          Past records keep their fee.
        </Feature>
        <Feature icon={Camera} title="Receipt scanning and manual entry" ready>
          Take a photo or upload a picture of the receipt. CICO reads the
          masked name, reference number, date and time on your phone, fills in
          the empty boxes, and warns if the amount looks different. Every box stays
          editable. No receipt? Type the details from your wallet history.
        </Feature>
        <Feature icon={LinkIcon} title="Sender upload link" status="QR code not yet">
          When someone else sends the money, give them a link to upload their
          receipt. They see nothing else in CICO.
        </Feature>
        <Feature icon={Smartphone} title="Phone and PC" ready>
          A sidebar on a computer, a bottom bar on a phone. Big buttons, large
          text, and every step works with a keyboard.
        </Feature>
      </div>

      {/* 3. Workflows */}
      <Section id="workflows" number="03" label="Workflows" title="Step by step">
        <p>The three ways money moves through your counter. Pick one to see each step.</p>
      </Section>
      <WorkflowTabs />
      <div className="mt-3 rounded-ui bg-field p-6 sm:p-8">
        <h3 className="text-lead font-medium">The fee is always on top</h3>
        <p className="mt-1 text-muted">
          Example amounts only. Your real fees come from your own fee rules.
        </p>
        <dl className="mt-5 grid gap-3 md:grid-cols-2">
          <ExampleRow
            tone="cash-in"
            type="Cash-in"
            pays="₱1,000 cash plus a separate ₱10 fee"
            gets="₱1,000 in their wallet"
          />
          <ExampleRow
            tone="cash-out"
            type="Cash-out"
            pays="₱1,000 wallet transfer plus a separate ₱10 fee"
            gets="₱1,000 cash"
          />
        </dl>
      </div>

      {/* 4. Operator guide */}
      <Section id="guide" number="04" label="Operator guide" title="Good habits">
        <p>The few rules that keep your records and your cash drawer right.</p>
      </Section>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Guide icon={House} title="Recording a transaction">
          <li>
            Start from Home: <B>Cash-in</B> or <B>Cash-out</B>.
          </li>
          <li>Type the amount first. The rest of the form appears once CICO has found the fee.</li>
          <li>After saving, you can start the next one straight away.</li>
        </Guide>
        <Guide icon={Calculator} title="The separate fee">
          <li>One fee table covers both cash-in and cash-out.</li>
          <li>
            Each range starts just above the one before and charges a fixed fee,
            so there are no gaps.
          </li>
          <li>The fee is paid on top. Never take it out of the amount.</li>
          <li>
            Above your highest range, or with no ranges yet, CICO won&apos;t
            record it. Add a range in <B>Fee rules</B> first.
          </li>
        </Guide>
        <Guide icon={Camera} title="Receipt review">
          <li>
            <B>Take a photo</B> or <B>Upload a picture</B>. It stays beside the
            form.
          </li>
          <li>
            Type the reference number exactly, including any zeroes at the
            start. CICO keeps every character.
          </li>
          <li>Check the name, amount, date and time against the picture before you save.</li>
        </Guide>
        <Guide icon={ReceiptText} title="Manual entry">
          <li>A photo is never required.</li>
          <li>No receipt? Open your wallet history and type the details from there.</li>
        </Guide>
        <Guide icon={Wallet} title="Checking the money arrived" tone="pending">
          <li className="list-none -ml-6 border-l-4 border-ink pl-4 font-medium">
            Before you hand over any cash, find the transfer in your own wallet
            history.
          </li>
          <li>The reference number and the amount must match.</li>
          <li>A receipt, a screenshot or an upload is not proof on its own.</li>
          <li>CICO never asks for wallet PINs, passwords or one-time codes. Nobody needs them.</li>
        </Guide>
        <Guide icon={Clock} title="Pending and completed">
          <li>
            <B>Pending</B>: a cash-out waiting for money. No cash has been
            handed over. Find these on the <B>Pending</B> screen.
          </li>
          <li>
            <B>Completed</B>: the money is checked, the fee is collected and the
            cash is handed over. It can&apos;t be paid out again.
          </li>
          <li>Cash-ins are saved as completed straight away.</li>
        </Guide>
        <Guide icon={ChartColumn} title="Reading reports">
          <li>
            Pick <B>Today</B>, <B>This week</B>, <B>This month</B> or{" "}
            <B>Choose dates</B>.
          </li>
          <li>
            Cash-in: cash you received and the same amount sent from your
            wallet. Cash-out: money received in your wallet and the cash you
            handed out.
          </li>
          <li>
            <B>Fees earned</B> is your income. The amounts themselves are the
            customers&apos; money passing through.
          </li>
        </Guide>
        <Guide icon={Lock} title="The sender's link">
          <li>Each link belongs to one pending cash-out only.</li>
          <li>The sender sees just the amount and the receiver&apos;s first name.</li>
          <li>Once the cash-out is completed, the link stops working.</li>
        </Guide>
      </div>

      {/* 5. FAQ */}
      <Section id="faq" number="05" label="Questions" title="Common questions">
        <p>Tap a question to open it.</p>
      </Section>
      <FaqList />

      <div className={`mt-16 rounded-ui p-6 sm:p-10 ${tones.night}`}>
        <h2 className="text-head font-medium">Three rules</h2>
        <ol className="mt-6 list-decimal space-y-2 pl-7 text-lead">
          <li>The fee is always on top.</li>
          <li>Check your own wallet before cash goes out.</li>
          <li>Never share a PIN, password or one-time code.</li>
        </ol>
      </div>
    </div>
  );
}

/** A section heading: a folder tab sitting on a surface band. */
function Section({
  id,
  number,
  label,
  title,
  children,
}: {
  id: string;
  number: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-16 scroll-mt-6">
      <span
        className={`folder-tab ml-3 flex w-fit px-7 pt-2 pb-1.5 text-small font-medium tracking-[0.04em] uppercase ${tones.night}`}
      >
        {number} · {label}
      </span>
      <div className="rounded-ui bg-surface p-6 sm:px-10 sm:py-8">
        <h2 id={`${id}-title`} className="text-head font-medium">
          {title}
        </h2>
        <div className="mt-3 max-w-[52ch]">{children}</div>
      </div>
    </section>
  );
}

function Benefit({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="flex min-h-52 flex-col justify-between gap-8 rounded-ui bg-field p-6 sm:p-8">
      <div>
        <h3 className="text-lead font-medium">{title}</h3>
        <p className="mt-3">{children}</p>
      </div>
      <Icon aria-hidden className="size-12" strokeWidth={1.5} />
    </article>
  );
}

function Swatch({
  tone,
  icon: Icon,
  name,
  meaning,
}: {
  tone: Tone;
  icon: LucideIcon;
  name: string;
  meaning: string;
}) {
  return (
    <div className={`flex min-h-28 flex-col justify-between gap-2 rounded-ui px-5 py-4 ${tones[tone]}`}>
      <Icon aria-hidden className="size-6" />
      <span className="font-display text-lead font-medium">{name}</span>
      <span className="text-small">{meaning}</span>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  ready = false,
  status,
  children,
}: {
  icon: LucideIcon;
  title: string;
  ready?: boolean;
  status?: string;
  children: ReactNode;
}) {
  return (
    <article className="liftable flex min-h-60 flex-col justify-between gap-8 rounded-ui bg-field p-6 sm:p-8">
      <div>
        <h3 className="text-lead font-medium">{title}</h3>
        <p className="mt-2">{children}</p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <Icon aria-hidden className="size-12" strokeWidth={1.5} />
        <span
          className={`inline-flex h-7 items-center rounded-full px-3 text-small font-medium whitespace-nowrap ${
            ready ? tones["cash-in"] : tones.pending
          }`}
        >
          {ready ? "Ready" : status}
        </span>
      </div>
    </article>
  );
}

function ExampleRow({
  tone,
  type,
  pays,
  gets,
}: {
  tone: Tone;
  type: string;
  pays: string;
  gets: string;
}) {
  return (
    <div className="rounded-ui bg-surface p-5">
      <dt className="flex items-center gap-2 font-medium">
        <span aria-hidden className={`size-3 rounded-full ${tones[tone]}`} />
        {type}
      </dt>
      <dd className="mt-3 grid gap-2">
        <span>
          <span className="block text-small text-muted">Customer pays or sends</span>
          {pays}
        </span>
        <span>
          <span className="block text-small text-muted">Customer receives</span>
          {gets}
        </span>
      </dd>
    </div>
  );
}

function Guide({
  icon: Icon,
  title,
  tone = "surface",
  children,
}: {
  icon: LucideIcon;
  title: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <article
      className={`flex flex-col gap-4 rounded-ui p-6 sm:p-8 ${tone === "surface" ? "bg-field" : tones[tone]}`}
    >
      <h3 className="flex items-center gap-3 text-lead font-medium">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-ui ${tones.night}`}>
          <Icon aria-hidden className="size-6" />
        </span>
        {title}
      </h3>
      <ul className="list-disc space-y-2 pl-6 marker:text-muted">{children}</ul>
    </article>
  );
}

function B({ children }: { children: ReactNode }) {
  return <strong className="font-medium">{children}</strong>;
}
