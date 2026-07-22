type SpecItem = {
  value: string;
  label: string;
};

type SpecRowProps = {
  items: SpecItem[];
};

export default function SpecRow({ items }: SpecRowProps) {
  return (
    <div className="specRow">
      {items.map((item) => (
        <span key={item.label}>
          <b>{item.value}</b>
          <small>{item.label}</small>
        </span>
      ))}
    </div>
  );
}
