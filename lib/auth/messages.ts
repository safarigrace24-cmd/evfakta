const AUTH_ERROR_MAP: Array<{ match: RegExp; message: string }> = [
  {
    match: /invalid login credentials/i,
    message: "Feil e-post eller passord.",
  },
  {
    match: /email not confirmed/i,
    message: "E-postadressen er ikke bekreftet ennå. Sjekk innboksen din.",
  },
  {
    match: /user already registered/i,
    message: "Det finnes allerede en konto med denne e-postadressen.",
  },
  {
    match: /password should be at least/i,
    message: "Passordet er for kort. Bruk minst 6 tegn.",
  },
  {
    match: /same password/i,
    message: "Det nye passordet må være forskjellig fra det gamle.",
  },
  {
    match: /rate limit|too many requests/i,
    message: "For mange forsøk. Vent litt og prøv igjen.",
  },
  {
    match: /network|fetch/i,
    message: "Kunne ikke kontakte serveren. Sjekk nettforbindelsen og prøv igjen.",
  },
];

export function mapAuthError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message) {
    return "Noe gikk galt. Prøv igjen.";
  }

  for (const entry of AUTH_ERROR_MAP) {
    if (entry.match.test(message)) {
      return entry.message;
    }
  }

  return "Noe gikk galt. Prøv igjen.";
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Skriv inn e-postadressen din.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Skriv inn en gyldig e-postadresse.";
  }
  return null;
}

export function validatePassword(password: string, { min = 6 } = {}): string | null {
  if (!password) {
    return "Skriv inn et passord.";
  }
  if (password.length < min) {
    return `Passordet må være minst ${min} tegn.`;
  }
  return null;
}
