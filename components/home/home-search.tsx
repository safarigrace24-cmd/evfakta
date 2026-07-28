"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type HomeSearchProps = {
  className?: string;
};

export default function HomeSearch({ className = "" }: HomeSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    const href = q ? `/modeller?q=${encodeURIComponent(q)}` : "/modeller";
    router.push(href);
  }

  return (
    <form
      className={`homeSearch ${className}`.trim()}
      onSubmit={onSubmit}
      role="search"
    >
      <label htmlFor="home-search" className="visuallyHidden">
        Søk etter elbilmodell eller merke
      </label>
      <input
        id="home-search"
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Søk modell, merke eller behov…"
        autoComplete="off"
        enterKeyHint="search"
      />
      <button type="submit" className="button primary homeSearchSubmit">
        Søk
      </button>
    </form>
  );
}
