import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export default function Container({ children, className = "", narrow }: ContainerProps) {
  return (
    <div className={`container${narrow ? " containerNarrow" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
