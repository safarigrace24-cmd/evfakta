type Fact = {
  label: string;
  value: string;
  highlight?: boolean;
};

type FactGridProps = {
  facts: Fact[];
  labelledBy?: string;
};

export default function FactGrid({ facts, labelledBy }: FactGridProps) {
  if (facts.length === 0) return null;

  return (
    <dl className="facts" aria-labelledby={labelledBy}>
      {facts.map((fact) => (
        <div
          className={`fact${fact.highlight ? " factHighlight" : ""}`}
          key={fact.label}
        >
          <dt>{fact.label}</dt>
          <dd>
            <strong>{fact.value}</strong>
          </dd>
        </div>
      ))}
    </dl>
  );
}
