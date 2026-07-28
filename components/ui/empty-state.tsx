import type { ElementType, ReactNode } from "react";
import Eyebrow from "./eyebrow";

type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  /** Use a lower heading when embedded under a page that already has an h1. */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
};

export default function EmptyState({
  eyebrow,
  title,
  description,
  children,
  titleAs = "h1",
  className = "",
}: EmptyStateProps) {
  const Title = titleAs as ElementType;

  return (
    <div className={`emptyState ${className}`.trim()}>
      <div className="emptyStateIcon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Title>{title}</Title>
      <p>{description}</p>
      {children ? <div className="emptyStateActions">{children}</div> : null}
    </div>
  );
}
