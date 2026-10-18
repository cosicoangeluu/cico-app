"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { signIn, type SignInState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: SignInState = { error: null, email: "" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <p
          role="alert"
          className="rise flex items-start gap-3 rounded-ui bg-cash-out p-4 font-medium text-cash-out-ink"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-6 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          className="field"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="pressable absolute inset-y-0 right-1 my-auto flex size-12 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-6" />
            ) : (
              <Eye aria-hidden className="size-6" />
            )}
          </button>
        </div>
      </div>

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
