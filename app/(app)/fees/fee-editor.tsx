"use client";

import { useState } from "react";
import { CircleCheck, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { findFee, validateTiers, type FeeTier } from "@/lib/cico/fees";
import { centavosToInput, formatPesos, parsePesos } from "@/lib/money";
import { formatManilaDateTime } from "@/lib/time";
import { cico, useCicoData } from "@/lib/data";
import { FeeBreakdown } from "@/components/fee-breakdown";
import { MoneyInput, useMoney } from "@/components/money-input";
import { buttonClass, Field, Panel, Problem, ScreenHeader } from "@/components/ui";

type Row = { key: number; upTo: string; fee: string };

let nextKey = 1;
const toRows = (tiers: FeeTier[]): Row[] =>
  tiers.map((tier) => ({
    key: nextKey++,
    upTo: centavosToInput(tier.upToCentavos),
    fee: centavosToInput(tier.feeCentavos),
  }));

const toTiers = (rows: Row[]): FeeTier[] =>
  rows.map((row) => ({
    upToCentavos: parsePesos(row.upTo) ?? 0,
    // "0" is a valid fee; parsePesos("0") is 0.
    feeCentavos: row.fee.trim() === "" ? -1 : (parsePesos(row.fee) ?? -1),
  }));

export function FeeEditor() {
  const data = useCicoData();
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Row[]>(() =>
    data.feeTiers.length > 0 ? toRows(data.feeTiers) : [{ key: nextKey++, upTo: "", fee: "" }],
  );
  const [problems, setProblems] = useState<Map<number, string>>(new Map());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const check = useMoney();

  const dirty =
    JSON.stringify(toTiers(rows).sort((a, b) => a.upToCentavos - b.upToCentavos)) !==
    JSON.stringify(data.feeTiers);

  function update(key: number, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    setSavedNotice(false);
  }

  async function save() {
    const tiers = toTiers(rows);
    const found = validateTiers(tiers);
    setProblems(found);
    setSaveError(null);
    if (found.size > 0) return;

    setSaving(true);
    const result = await cico.saveFeeTiers(tiers);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setRows(toRows([...tiers].sort((a, b) => a.upToCentavos - b.upToCentavos)));
    setSavedNotice(true);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader title="Fee rules" tone="surface">
        One fee table for both cash-in and cash-out. Each row covers the
        amounts above the row before it, up to its own limit, and charges a
        fixed fee.
      </ScreenHeader>

      <Panel title="Your fee ranges" order={1}>
        <ol className="space-y-3">
          {rows.map((row, index) => {
            const previous = parsePesos(rows[index - 1]?.upTo ?? "");
            const from = index === 0 ? 1 : previous !== null ? previous + 1 : null;
            const problem = problems.get(index);
            return (
              <li key={row.key} className="rise rounded-ui bg-bg p-4 sm:p-5">
                <p className="mb-3 font-medium">
                  {from !== null ? `From ${formatPesos(from)}` : `Range ${index + 1}`}
                </p>
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Field id={`upto-${row.key}`} label="Up to">
                    <MoneyInput
                      id={`upto-${row.key}`}
                      value={row.upTo}
                      invalid={Boolean(problem)}
                      onChange={(text) => update(row.key, { upTo: text })}
                    />
                  </Field>
                  <Field id={`fee-${row.key}`} label="Fee">
                    <MoneyInput
                      id={`fee-${row.key}`}
                      value={row.fee}
                      invalid={Boolean(problem)}
                      onChange={(text) => update(row.key, { fee: text })}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => {
                      setRows((current) => current.filter((r) => r.key !== row.key));
                      setProblems(new Map());
                      setSavedNotice(false);
                    }}
                    aria-label={`Remove range ${index + 1}`}
                    className="pressable flex h-14 items-center justify-center gap-2 rounded-full bg-surface px-5 font-medium"
                  >
                    <Trash2 aria-hidden className="size-5" />
                    <span className="sm:sr-only">Remove</span>
                  </button>
                </div>
                {problem && (
                  <p className="mt-3 font-medium text-danger">{problem}</p>
                )}
              </li>
            );
          })}
        </ol>

        {rows.length === 0 && (
          <p className="rounded-ui bg-bg p-5">
            No ranges. Without fee rules, CICO can&apos;t record transactions.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setRows((current) => [...current, { key: nextKey++, upTo: "", fee: "" }]);
              setSavedNotice(false);
            }}
            className={buttonClass("surface", "bg-bg!")}
          >
            <Plus aria-hidden className="size-5" />
            Add a range
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className={buttonClass("cash-in")}
          >
            {saving && <LoaderCircle aria-hidden className="spin size-5" />}
            {saving ? "Saving…" : "Save fee rules"}
          </button>
        </div>

        <div className="mt-5 space-y-3" aria-live="polite">
          {problems.size > 0 && <Problem>Fix the highlighted ranges, then save again.</Problem>}
          {saveError && <Problem>{saveError}</Problem>}
          {savedNotice && (
            <p className="rise flex items-start gap-3 rounded-ui bg-cash-in p-4 font-medium text-cash-in-ink">
              <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0" />
              Saved. The new fees apply to new transactions only. Records you
              already saved keep the fee they were charged.
            </p>
          )}
          {dirty && !savedNotice && (
            <p className="text-muted">You have changes that aren&apos;t saved yet.</p>
          )}
        </div>

        <p className="mt-5 text-small text-muted">
          {data.feeTiersSavedAt
            ? `Last saved ${formatManilaDateTime(data.feeTiersSavedAt)}.`
            : "Not saved yet."}{" "}
          Amounts above the last range can&apos;t be recorded until you add a
          range for them.
        </p>
      </Panel>

      <Panel title="Check a fee" order={2}>
        <Field
          id="check-amount"
          label="Amount"
          hint="Uses the saved fee rules."
          error={check.error}
        >
          <MoneyInput
            id="check-amount"
            value={check.text}
            onChange={check.set}
            invalid={Boolean(check.error)}
          />
        </Field>
        {check.centavos !== null && (
          <div className="mt-4">
            <FeeBreakdown
              type="cash_in"
              principalCentavos={check.centavos}
              match={findFee(data.feeTiers, check.centavos)}
            />
          </div>
        )}
      </Panel>
    </div>
  );
}
