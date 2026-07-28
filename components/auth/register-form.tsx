"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  mapAuthError,
  validateEmail,
  validatePassword,
} from "@/lib/auth/messages";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setError(emailError ?? passwordError);
      setSuccess(null);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passordene er ikke like.");
      setSuccess(null);
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/min-side`;

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(mapAuthError(signUpError));
        return;
      }

      setSuccess(
        "Kontoen er opprettet. Sjekk e-posten din for å bekrefte adressen før du logger inn.",
      );
      setPassword("");
      setConfirmPassword("");
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

      <label className="authField">
        <span>Passord</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={pending}
        />
      </label>

      <label className="authField">
        <span>Bekreft passord</span>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={pending}
        />
      </label>

      <button type="submit" className="button primary authSubmit" disabled={pending}>
        {pending ? "Oppretter konto…" : "Opprett konto"}
      </button>

      <p className="authSwitch">
        Har du allerede konto? <Link href="/login">Logg inn</Link>
      </p>
    </form>
  );
}
