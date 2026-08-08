"use client";

import Link from "next/link";
import { useEffect, useRef, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/chat/types";

export type ChatUiMessage = ChatMessage & {
  id: string;
};

export type ChatSuggestionCar = {
  slug: string;
  brand: string;
  model: string;
  url: string;
};

type ChatPanelProps = {
  open: boolean;
  messages: ChatUiMessage[];
  input: string;
  loading: boolean;
  error: string | null;
  suggestions: ChatSuggestionCar[];
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ChatPanel({
  open,
  messages,
  input,
  loading,
  error,
  suggestions,
  onClose,
  onInputChange,
  onSubmit,
}: ChatPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <section
      id="evfakta-chat-panel"
      className="evChatPanel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="evfakta-chat-title"
    >
      <header className="evChatPanelHeader">
        <div>
          <h2 id="evfakta-chat-title">EVFAKTA-assistenten</h2>
          <p>Spør om elbiler, rekkevidde, lading og modeller.</p>
        </div>
        <button
          type="button"
          className="button ghost buttonSm evChatClose"
          onClick={onClose}
          aria-label="Lukk chat"
        >
          Lukk
        </button>
      </header>

      <div className="evChatMessages" ref={listRef}>
        {messages.length === 0 && (
          <div className="evChatBubble evChatBubbleAssistant">
            <p>
              Hei! Jeg er EVFAKTA-assistenten. Spør for eksempel om rekkevidde,
              familiebiler eller sammenligning av modeller. Jeg bruker kun
              publiserte EVFAKTA-data.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "evChatBubble evChatBubbleUser"
                : "evChatBubble evChatBubbleAssistant"
            }
          >
            <p>{message.content}</p>
          </div>
        ))}
        {loading && (
          <div className="evChatBubble evChatBubbleAssistant evChatLoading">
            <p>Tenker…</p>
          </div>
        )}
        {error && (
          <div className="evChatError" role="alert">
            {error}
          </div>
        )}
        {suggestions.length > 0 && !loading && (
          <div className="evChatSuggestions">
            <span>Relevante modeller</span>
            <ul>
              {suggestions.slice(0, 4).map((car) => (
                <li key={car.slug}>
                  <Link href={car.url}>
                    {car.brand} {car.model}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form className="evChatForm" onSubmit={onSubmit}>
        <label className="visuallyHidden" htmlFor="evfakta-chat-input">
          Spørsmål om elbil
        </label>
        <textarea
          id="evfakta-chat-input"
          ref={inputRef}
          className="evChatInput"
          rows={2}
          maxLength={1000}
          value={input}
          disabled={loading}
          placeholder="F.eks. Hvilken elbil har lengst rekkevidde?"
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          className="button primary buttonSm"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}
