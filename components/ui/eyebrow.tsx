type EyebrowProps = {
  children: React.ReactNode;
};

export default function Eyebrow({ children }: EyebrowProps) {
  return <span className="eyebrow">{children}</span>;
}
