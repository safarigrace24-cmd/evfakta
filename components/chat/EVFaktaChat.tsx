"use client";

import { useCallback, useId, useState, type FormEvent } from "react";
import ChatButton from "@/components/chat/ChatButton";
import ChatPanel, {
  type ChatSuggestionCar,
  type ChatUiMessage,
} from "@/components/chat/ChatPanel";
import { isChatbotPubliclyEnabled } from "@/lib/public/feature-flags";

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function EVFaktaChat() {
  const enabled = isChatbotPubliclyEnabled();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [suggestions, setSuggestions] = useState<ChatSuggestionCar[]>([]);
  const reactId = useId();

  const toggle = useCallback(() => {
    setOpen((current) => !current);
    setError(null);
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = input.trim();
      if (!text || loading) return;

      const userMessage: ChatUiMessage = {
        id: makeId(`${reactId}_u`),
        role: "user",
        content: text,
      };
      const history = messages.map(({ role, content }) => ({ role, content }));

      setMessages((current) => [...current, userMessage]);
      setInput("");
      setLoading(true);
      setError(null);
      setSuggestions([]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history,
          }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          reply?: string;
          error?: string;
          cars?: ChatSuggestionCar[];
        };

        if (!response.ok || !data.ok || !data.reply) {
          setError(data.error || "Kunne ikke hente svar. Prøv igjen.");
          return;
        }

        setMessages((current) => [
          ...current,
          {
            id: makeId(`${reactId}_a`),
            role: "assistant",
            content: data.reply as string,
          },
        ]);
        setSuggestions(Array.isArray(data.cars) ? data.cars : []);
      } catch {
        setError("Nettverksfeil. Sjekk tilkoblingen og prøv igjen.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, reactId],
  );

  if (!enabled) return null;

  return (
    <div className="evChatRoot" data-open={open ? "true" : "false"}>
      <ChatPanel
        open={open}
        messages={messages}
        input={input}
        loading={loading}
        error={error}
        suggestions={suggestions}
        onClose={() => setOpen(false)}
        onInputChange={setInput}
        onSubmit={onSubmit}
      />
      <ChatButton open={open} onClick={toggle} />
    </div>
  );
}
