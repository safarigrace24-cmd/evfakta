"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError, validateEmail } from "@/lib/auth/messages";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setSuccess(null);
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/oppdater-passord`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo },
      );

      if (resetError) {
        setError(mapAuthError(resetError));
        return;
      }

      setSuccess(
        "Hvis det finnes en konto med denne e-postadressen, har vi sendt en lenke for å tilbakestille passordet.",
      );
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="authForm" onSubmit={onSubmit} noValidate>
      {error && (
        <p className="authAlert authAlertError" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="authAlert authAlertSuccess" role="status">
          {success}
        </p>
      )}

      <label className="authField">
        <span>E-post</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={pending}
        />
      </label>

      <button type="submit" className="button primary authSubmit" disabled={pending}>
        {pending ? "Sender…" : "Send tilbakestillingslenke"}
      </button>

      <p className="authSwitch">
        <Link href="/login">Tilbake til innlogging</Link>
      </p>
    </form>
  );
}
