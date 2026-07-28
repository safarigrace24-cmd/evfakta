type SpecItem = {
  value: string;
  label: string;
};

type SpecRowProps = {
  items: SpecItem[];
};

export default function SpecRow({ items }: SpecRowProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="specRow"
      data-count={items.length}
      role="list"
      aria-label="Nøkkeltall"
    >
      {items.map((item) => (
        <span key={item.label} role="listitem">
          <b>{item.value}</b>
          <small>{item.label}</small>
        </span>
      ))}
    </div>
  );
}
