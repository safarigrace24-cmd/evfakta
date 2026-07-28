import type { ReactNode } from "react";
import Eyebrow from "./eyebrow";

type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function EmptyState({
  eyebrow,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="emptyState">
      <div className="emptyStateIcon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      <p>{description}</p>
      {children ? <div className="emptyStateActions">{children}</div> : null}
    </div>
  );
}

