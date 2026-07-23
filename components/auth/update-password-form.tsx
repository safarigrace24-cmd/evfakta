"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError, validatePassword } from "@/lib/auth/messages";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
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
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(mapAuthError(updateError));
        return;
      }

      setSuccess("Passordet er oppdatert. Du sendes videre til Min side.");
      setTimeout(() => {
        router.push("/min-side");
        router.refresh();
      }, 1200);
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
        <span>Nytt passord</span>
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
        <span>Bekreft nytt passord</span>
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
        {pending ? "Lagrer…" : "Oppdater passord"}
      </button>

      <p className="authSwitch">
        <Link href="/login">Tilbake til innlogging</Link>
      </p>
    </form>
  );
}
