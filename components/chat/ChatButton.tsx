"use client";

type ChatButtonProps = {
  open: boolean;
  onClick: () => void;
};

export default function ChatButton({ open, onClick }: ChatButtonProps) {
  return (
    <button
      type="button"
      className="evChatButton"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="evfakta-chat-panel"
      aria-label={open ? "Lukk EVFAKTA-chat" : "Åpne EVFAKTA-chat"}
    >
      <span className="evChatButtonLabel">Spør EVFAKTA</span>
    </button>
  );
}
