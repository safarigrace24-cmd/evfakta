type Fact = {
  label: string;
  value: string;
  highlight?: boolean;
};

type FactGridProps = {
  facts: Fact[];
};

export default function FactGrid({ facts }: FactGridProps) {
  return (
    <div className="facts">
      {facts.map((fact) => (
        <div className={`fact${fact.highlight ? " factHighlight" : ""}`} key={fact.label}>
          <span>{fact.label}</span>
          <strong>{fact.value}</strong>
        </div>
      ))}
    </div>
  );
}
