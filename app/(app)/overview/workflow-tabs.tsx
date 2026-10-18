"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Banknote, Users, Wallet, type LucideIcon } from "lucide-react";
import { stagger } from "@/components/stagger";
import { tones, type Tone } from "@/components/tones";

type Step = {
  who: string;
  /** "check" marks a stop-and-verify step, "done" the final save. */
  kind?: "check" | "done";
  body: ReactNode;
  note?: ReactNode;
};

type Workflow = {
  id: string;
  label: string;
  tone: Tone;
  icon: LucideIcon;
  title: string;
  summary: string;
  money: { caption: string; rows: [string, string][] };
  steps: Step[];
  /** Other ways the same workflow can go. */
  paths?: { title: string; body: string }[];
};

function B({ children }: { children: ReactNode }) {
  return <strong className="font-medium">{children}</strong>;
}

const workflows: Workflow[] = [
  {
    id: "cash-in",
    label: "Cash-in",
    tone: "cash-in",
    icon: Wallet,
    title: "Cash-in",
    summary: "Customer gives you cash. You send it to their wallet.",
    money: {
      caption: "Example only: ₱1,000 with a ₱10 fee",
      rows: [
        ["Customer gives you", "₱1,000 + ₱10 fee"],
        ["You send to their wallet", "₱1,000"],
      ],
    },
    steps: [
      { who: "Customer", body: "Asks for a cash-in and tells you the amount and their wallet details." },
      { who: "You", body: <>Tap <B>Cash-in</B> on Home and type the amount.</> },
      {
        who: "CICO",
        body: "Shows the fee from your fee rules, plus what the customer pays in total. Tell the customer the amount and the separate fee.",
      },
      { who: "Customer", body: "Agrees and pays you the amount plus the fee." },
      {
        who: "You",
        body: "Send the full amount to the customer's wallet from your wallet app, and check that it went through.",
      },
      {
        who: "You",
        body: "Take a photo of the receipt or upload it (optional), then type the reference number, the customer's name, and the date and time of the transfer.",
      },
      { who: "You", body: "Tick both boxes: the customer paid, and your transfer went through." },
      {
        who: "Done",
        kind: "done",
        body: <>Tap <B>Save cash-in</B>. It&apos;s saved as completed and shows in History and Reports.</>,
      },
    ],
  },
  {
    id: "cash-out",
    label: "Cash-out",
    tone: "cash-out",
    icon: Banknote,
    title: "Cash-out",
    summary: "Customer sends to your wallet. You give them cash.",
    money: {
      caption: "Example only: ₱1,000 with a ₱10 fee",
      rows: [
        ["Customer sends to your wallet", "₱1,000"],
        ["Customer pays you the fee", "₱10"],
        ["You give the customer", "₱1,000 cash"],
      ],
    },
    steps: [
      { who: "Customer", body: "Asks for a cash-out." },
      {
        who: "You",
        body: <>Tap <B>Cash-out</B> and type the amount. CICO shows the separate fee. Explain both; the customer agrees.</>,
      },
      {
        who: "You",
        body: <>Under &ldquo;Who is sending the money?&rdquo; choose <B>The customer here</B> and type their name.</>,
      },
      { who: "Customer", body: "Sends the full amount to your wallet." },
      {
        who: "Check first",
        kind: "check",
        body: <>Open <em>your own</em> wallet history and find the transfer. The reference number and amount must match.</>,
        note: <>Money not there yet? Choose <B>Not yet</B> to save it as pending. Don&apos;t hand over any cash.</>,
      },
      {
        who: "You",
        body: <>Choose <B>Yes, I can see it</B>. Add the receipt photo if there is one, then type the reference number and the date and time of the transfer.</>,
      },
      { who: "You", body: "Collect the separate fee and hand over the full cash amount. Tick both boxes." },
      { who: "Done", kind: "done", body: <>Tap <B>Complete cash-out</B>. History and Reports update.</> },
    ],
  },
  {
    id: "separate",
    label: "Someone else sends",
    tone: "pending",
    icon: Users,
    title: "Someone else sends",
    summary:
      "The person collecting the cash is with you. Someone else sends the money from somewhere else.",
    money: {
      caption: "Two people, two names on the record",
      rows: [
        ["Sender (remote)", "sends to your wallet"],
        ["Receiver (at your counter)", "pays fee, gets cash"],
      ],
    },
    steps: [
      { who: "Receiver", body: "Asks for a cash-out and tells you who will send the money." },
      {
        who: "You",
        body: <>Tap <B>Cash-out</B>, type the amount, and choose <B>Someone else</B>. Type the receiver&apos;s name, and the sender&apos;s name if you know it.</>,
      },
      {
        who: "You",
        body: <>Choose <B>Not yet</B> and leave &ldquo;Make a link the sender can use&rdquo; ticked. Tap <B>Save as pending</B>. The fee is fixed now.</>,
      },
      {
        who: "You",
        body: <>Open the pending cash-out and tap <B>Copy link</B>. The receiver shares it with the sender.</>,
      },
      {
        who: "Sender",
        body: "Transfers the money to your wallet, opens the link and uploads a photo of the receipt with their name (and the reference, if they like).",
      },
      {
        who: "You",
        body: "The receipt appears on the pending cash-out. Copy what the sender typed into the form, or type it yourself. Check both names.",
      },
      {
        who: "Check first",
        kind: "check",
        body: <>Find the money in <em>your own</em> wallet history. A receipt alone isn&apos;t proof. CICO also blocks a reference already used on another cash-out.</>,
      },
      { who: "You", body: "Collect the fee from the receiver and hand over the full cash amount. Tick both boxes." },
      {
        who: "Done",
        kind: "done",
        body: <>Tap <B>Complete cash-out</B>. The sender&apos;s link stops working, and History and Reports update.</>,
      },
    ],
    paths: [
      {
        title: "Receipt shown in person",
        body: "The receiver shows the receipt on their phone. Take a photo or upload it on the pending cash-out yourself.",
      },
      {
        title: "No receipt at all",
        body: "Find the transfer in your wallet history, check it, and type the details by hand.",
      },
      {
        title: "Uploaded, but no money yet",
        body: "It stays pending. An upload never completes a cash-out or allows a payout.",
      },
    ],
  },
];

const markerClass: Record<NonNullable<Step["kind"]> | "plain", string> = {
  plain: tones.night,
  check: tones.pending,
  done: tones["cash-in"],
};

/** The three workflows as tabs; arrow keys move between them. */
export function WorkflowTabs() {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + workflows.length) % workflows.length;
    setSelected(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mt-3">
      <div role="tablist" aria-label="Workflow" className="flex flex-wrap gap-2">
        {workflows.map(({ id, label, tone, icon: Icon }, index) => {
          const active = index === selected;
          return (
            <button
              key={id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-controls={`panel-${id}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`pressable inline-flex h-14 items-center gap-2 rounded-full px-5 font-medium ${
                active ? tones[tone] : "bg-surface"
              }`}
            >
              <Icon aria-hidden className="size-6" />
              {label}
            </button>
          );
        })}
      </div>

      {workflows.map((workflow, index) => (
        <div
          key={workflow.id}
          role="tabpanel"
          id={`panel-${workflow.id}`}
          aria-labelledby={`tab-${workflow.id}`}
          tabIndex={0}
          hidden={index !== selected}
          className="mt-3"
        >
          <Panel workflow={workflow} />
        </div>
      ))}
    </div>
  );
}

function Panel({ workflow }: { workflow: Workflow }) {
  return (
    <>
      <div
        className={`rise grid gap-6 rounded-ui p-6 sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-end ${tones[workflow.tone]}`}
      >
        <div>
          <h3 className="text-head font-medium">{workflow.title}</h3>
          <p className="mt-3 max-w-[40ch] text-lead">{workflow.summary}</p>
        </div>
        <div className="rounded-ui bg-field px-5 py-4 text-ink">
          <p className="text-small text-muted">{workflow.money.caption}</p>
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
            {workflow.money.rows.map(([label, value], index) => {
              const last = index === workflow.money.rows.length - 1;
              const rule = last ? "border-t-2 border-surface-strong pt-1.5" : "";
              return (
                <div key={label} className="contents">
                  <dt className={`text-muted ${rule}`}>{label}</dt>
                  <dd className={`text-right font-medium ${rule}`}>{value}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      <ol className="rise mt-3 rounded-ui bg-field p-6 sm:p-10" style={stagger(1)}>
        {workflow.steps.map((step, index) => {
          const last = index === workflow.steps.length - 1;
          return (
            <li key={index} className={`relative grid grid-cols-[3rem_1fr] gap-4 ${last ? "" : "pb-6"}`}>
              <span
                aria-hidden
                className={`flex size-12 items-center justify-center rounded-full font-display text-lg font-medium ${
                  markerClass[step.kind ?? "plain"]
                }`}
              >
                {index + 1}
              </span>
              {!last && (
                <span aria-hidden className="absolute top-13 bottom-1 left-[calc(1.5rem-1px)] w-0.5 bg-surface-strong" />
              )}
              <div className="pt-1">
                <span className="block text-small font-medium tracking-[0.04em] text-muted uppercase">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.who}
                </span>
                <p className="mt-0.5">{step.body}</p>
                {step.note && <p className="mt-1.5 text-small text-muted">{step.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {workflow.paths && (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {workflow.paths.map((path) => (
            <div key={path.title} className="rounded-ui bg-surface p-5 sm:p-6">
              <h4 className="mb-2 font-display text-lg font-medium">{path.title}</h4>
              <p>{path.body}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
