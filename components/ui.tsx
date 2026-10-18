import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { stagger } from "@/components/stagger";
import { tones, type Tone } from "@/components/tones";

/** Classes for a full-round button in one of CICO's tones. */
export function buttonClass(tone: Tone, extra = "") {
  return `pressable inline-flex h-14 items-center justify-center gap-3 rounded-full px-6 font-medium disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${extra}`;
}

/** The coloured band at the top of a screen. */
export function ScreenHeader({
  title,
  tone,
  children,
}: {
  title: string;
  tone: Tone;
  children?: ReactNode;
}) {
  return (
    <header className={`rise rounded-ui p-6 sm:p-10 ${tones[tone]}`}>
      <h1 className="text-head font-medium">{title}</h1>
      {children && <div className="mt-4 max-w-[52ch] text-lead">{children}</div>}
    </header>
  );
}

/** A filled block one step off the page ground, used to group a step. */
export function Panel({
  title,
  order = 1,
  children,
}: {
  title?: string;
  order?: number;
  children: ReactNode;
}) {
  return (
    <section className="rise mt-3 rounded-ui bg-surface p-5 sm:p-8" style={stagger(order)}>
      {title && <h2 className="mb-5 text-lead font-medium">{title}</h2>}
      {children}
    </section>
  );
}

/** A label, its input, and an optional hint or error underneath. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-2 font-medium text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-small text-muted">{hint}</p>
      )}
    </div>
  );
}

/** A large, easy-to-tap confirmation checkbox. */
export function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`pressable flex cursor-pointer items-start gap-4 rounded-ui p-4 ${
        checked ? "bg-cash-in text-cash-in-ink" : "bg-field"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-6 shrink-0 accent-[#1a1a1a]"
      />
      <span>{children}</span>
    </label>
  );
}

/** A message that stops the operator, with what to do next. */
export function Problem({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rise flex items-start gap-3 rounded-ui bg-cash-out p-4 font-medium text-cash-out-ink"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-6 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
