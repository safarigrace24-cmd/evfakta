import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

const metrics = [
  {
    title: "WLTP-rekkevidde",
    body: "Laboratoriemålt rekkevidde under standardiserte forhold. Brukes til sammenligning, ikke som garantert vinterrekkevidde.",
  },
  {
    title: "Forbruk",
    body: "Energiforbruk oppgitt som kWh/100 km. Lavere forbruk betyr typisk lavere ladekostnad over tid.",
  },
  {
    title: "DC-ladeeffekt",
    body: "Maksimal hurtigladeeffekt i kW. Høyere effekt kan gi kortere stopp, men avhenger av bil, batteri og ladeinfrastruktur.",
  },
  {
    title: "Batteristørrelse",
    body: "Kapasitet i kWh. Skill mellom totalt og brukbart batteri når begge tall finnes i kilden.",
  },
];

export default function KeyMetricsSection() {
  return (
    <section
      className="section sectionAlt homeSection"
      aria-labelledby="key-metrics-heading"
    >
      <Container>
        <div className="featuresHeader homeSectionHeader">
          <Eyebrow>Fire nøkkeltall</Eyebrow>
          <h2 id="key-metrics-heading">Dette bør du sammenligne</h2>
          <p className="lead narrow">
            Tallene kommer fra publiserte modelldata med kilder. Mangler en verdi, viser vi det —
            vi fyller ikke inn med gjetting.
          </p>
        </div>
        <div className="metricsGrid">
          {metrics.map((metric) => (
            <article key={metric.title} className="metricCard">
              <h3>{metric.title}</h3>
              <p>{metric.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
