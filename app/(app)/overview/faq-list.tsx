"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { buttonClass } from "@/components/ui";

const questions: { q: string; a: ReactNode }[] = [
  {
    q: "Who uses CICO?",
    a: (
      <p>
        The operator: the person running the cash-in / cash-out counter.
        Customers don&apos;t sign in. The only other person who ever opens a
        CICO page is a remote sender, and only to upload a receipt through a
        link you give them.
      </p>
    ),
  },
  {
    q: "Does CICO transfer money, or record transactions done in the wallet?",
    a: (
      <p>
        It only records them. You send and receive money in your own wallet app
        as usual. CICO keeps the amount, the fee, the names, the reference and
        the receipt photo together.
      </p>
    ),
  },
  {
    q: "How are fees calculated and paid?",
    a: (
      <>
        <p>
          You set them in <strong>Fee rules</strong>: a list of amount ranges,
          each with a fixed fee. The same table is used for cash-in and
          cash-out. When you type an amount, CICO finds the matching range and
          shows the fee.
        </p>
        <p>
          The fee is always paid separately, on top of the amount. It is never
          taken out of what the customer sends or receives. If an amount is
          above your highest range, or there are no ranges yet, CICO won&apos;t
          record it until you add one.
        </p>
      </>
    ),
  },
  {
    q: "Do changed fees affect past records?",
    a: (
      <p>
        No. Every record keeps the fee it was saved with, and History shows the
        fee range that was used. A pending cash-out also keeps the fee agreed
        when it was created. New fees apply only to new transactions.
      </p>
    ),
  },
  {
    q: "What if receipt scanning reads the details incorrectly?",
    a: (
      <p>
        Scanning isn&apos;t available yet, so CICO doesn&apos;t read the
        receipt for you. You type the details while looking at the photo, and
        every field can be corrected before you save. When scanning arrives,
        its results will be just as editable.
      </p>
    ),
  },
  {
    q: "What if there is no receipt?",
    a: (
      <p>
        That&apos;s fine. A photo is never required. Find the transfer in your
        wallet history and type the reference number, name, and date and time
        from there.
      </p>
    ),
  },
  {
    q: "Can someone else send money for the person collecting cash?",
    a: (
      <p>
        Yes. In Cash-out, choose <strong>Someone else</strong> under &ldquo;Who
        is sending the money?&rdquo;. CICO keeps both names: the sender and the
        person collecting the cash. See the &ldquo;Someone else sends&rdquo;
        workflow above.
      </p>
    ),
  },
  {
    q: "How do receipt-upload links and QR codes work?",
    a: (
      <>
        <p>
          When you save a &ldquo;someone else&rdquo; cash-out as pending, CICO
          can make a link for that one cash-out. Copy it from the pending
          cash-out and have the receiver pass it to the sender.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>The sender sees only the amount and the receiver&apos;s first name.</li>
          <li>They upload a photo of the receipt, their name and, if they like, the reference.</li>
          <li>They can&apos;t see anything else in CICO.</li>
          <li>Once the cash-out is completed, the link stops working.</li>
        </ul>
        <p>
          QR codes aren&apos;t available yet. In demo mode, the link only works
          in the same browser on the same computer.
        </p>
      </>
    ),
  },
  {
    q: "Does an uploaded receipt prove payment arrived?",
    a: (
      <p>
        No. A receipt can be wrong, old or fake. An upload never completes a
        cash-out on its own. Always find the money in your own wallet history
        first.
      </p>
    ),
  },
  {
    q: "When should the operator release cash?",
    a: (
      <p>
        Only after you have found the transfer in your own wallet history and
        the reference number and amount match. Then collect the separate fee,
        hand over the full cash amount, tick both boxes and tap{" "}
        <strong>Complete cash-out</strong>.
      </p>
    ),
  },
  {
    q: "What happens if a reference has already been used?",
    a: (
      <p>
        CICO won&apos;t let you complete the cash-out. It tells you which
        cash-out already has that reference, so you can check your wallet
        history. References are compared ignoring spaces and capital letters, so
        &ldquo;ab 123&rdquo; and &ldquo;AB123&rdquo; count as the same. Each
        transfer can only be paid out once.
      </p>
    ),
  },
  {
    q: "What is the difference between pending and completed?",
    a: (
      <p>
        <strong>Pending</strong> (yellow) is a cash-out still waiting for the
        money to arrive. No cash should have been handed over.{" "}
        <strong>Completed</strong> means the money was checked, the fee was
        collected and the cash was handed over, or for cash-in, your transfer
        went through. A completed cash-out can&apos;t be paid out again.
      </p>
    ),
  },
  {
    q: "Which transactions count in reports?",
    a: (
      <p>
        Only completed ones, counted on the day they were completed (Philippine
        time). Pending cash-outs are shown as a number only and never added to
        the totals or to fees earned. Amounts and fees are always shown
        separately, and only the fees are your income.
      </p>
    ),
  },
];

/** The FAQ as native disclosures, with a search box and open/close all. */
export function FaqList() {
  const itemRefs = useRef<(HTMLDetailsElement | null)[]>([]);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<boolean[]>(() => questions.map(() => true));
  const [allOpen, setAllOpen] = useState(false);

  function search(value: string) {
    setQuery(value);
    const words = value.trim().toLowerCase();
    // Search the rendered text, so the answers don't need a second copy.
    setMatches(
      itemRefs.current.map(
        (node) => !words || (node?.textContent ?? "").toLowerCase().includes(words),
      ),
    );
  }

  function syncAllOpen() {
    setAllOpen(itemRefs.current.every((node) => node?.open));
  }

  function toggleAll() {
    const open = !allOpen;
    itemRefs.current.forEach((node) => {
      if (node) node.open = open;
    });
    setAllOpen(open);
  }

  const shown = matches.filter(Boolean).length;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-[1_1_18rem]">
          <label htmlFor="faq-search" className="sr-only">
            Search questions
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            id="faq-search"
            type="search"
            autoComplete="off"
            placeholder="Search, e.g. fee, receipt, link"
            value={query}
            onChange={(event) => search(event.target.value)}
            className="field pl-12!"
          />
        </div>
        <button type="button" onClick={toggleAll} className={buttonClass("night")}>
          {allOpen ? "Close all" : "Open all"}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {questions.map(({ q, a }, index) => (
          <details
            key={q}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            hidden={!matches[index]}
            onToggle={syncAllOpen}
            className="group rounded-ui bg-surface open:bg-field"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                aria-hidden
                className="size-6 shrink-0 transition-transform duration-200 ease-(--ease-out) group-open:rotate-180"
              />
            </summary>
            <div className="max-w-[62ch] space-y-2.5 px-5 pb-5">{a}</div>
          </details>
        ))}
      </div>

      {shown === 0 && (
        <p role="status" className="mt-3 rounded-ui bg-surface p-5">
          No question matches that. Try a shorter word.
        </p>
      )}
    </div>
  );
}
