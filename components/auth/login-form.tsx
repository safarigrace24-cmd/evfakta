"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  mapAuthError,
  validateEmail,
  validatePassword,
} from "@/lib/auth/messages";

type LoginFormProps = {
  nextPath?: string;
  initialError?: string | null;
};

export default function LoginForm({ nextPath = "/min-side", initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setError(emailError ?? passwordError);
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapAuthError(signInError));
        return;
      }

      router.push(nextPath);
      router.refresh();
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={pending}
        />
      </label>

      <div className="authFormMeta">
        <Link href="/glemt-passord">Glemt passord?</Link>
      </div>

      <button type="submit" className="button primary authSubmit" disabled={pending}>
        {pending ? "Logger inn…" : "Logg inn"}
      </button>

      <p className="authSwitch">
        Har du ikke konto? <Link href="/registrer">Registrer deg</Link>
      </p>
    </form>
  );
}
