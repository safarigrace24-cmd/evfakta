import type { AdminCar } from "@/lib/admin/types";

type AdminCarHistoryPanelProps = {
  car: AdminCar;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("nb-NO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminCarHistoryPanel({ car }: AdminCarHistoryPanelProps) {
  const fieldSources = car.field_sources
    ? Object.entries(car.field_sources).map(([field, meta]) => ({
        field,
        source: meta.source_name || meta.source_url || "—",
        retrieved: meta.retrieved_at || meta.imported_at || meta.data_last_checked_at,
        review: meta.review_status || "—",
        confidence:
          typeof meta.confidence === "number"
            ? `${Math.round(meta.confidence * 100)}%`
            : "—",
      }))
    : [];

  const events = [
    { label: "Created", at: car.created_at },
    { label: "Updated", at: car.updated_at },
    { label: "Imported", at: car.imported_at },
    { label: "Source updated", at: car.source_updated_at },
    { label: "Last checked", at: car.data_last_checked_at },
  ].filter((event) => event.at);

  return (
    <section className="adminEditorPanel" aria-labelledby="history-heading">
      <h2 id="history-heading">History</h2>
      <p className="adminHint">
        Read-only timeline from existing car metadata. No separate audit log backend.
      </p>

      <table className="adminEditorTable">
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">When</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={2}>No timestamps recorded yet.</td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={`${event.label}-${event.at}`}>
                <th scope="row">{event.label}</th>
                <td>{formatDateTime(event.at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {car.import_notes?.trim() ? (
        <div className="adminEditorNotesBlock">
          <h3>Import notes</h3>
          <p>{car.import_notes}</p>
        </div>
      ) : null}

      <h3 className="adminEditorSubheading">Field source activity</h3>
      <table className="adminEditorTable">
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Source</th>
            <th scope="col">Confidence</th>
            <th scope="col">Review</th>
            <th scope="col">Retrieved</th>
          </tr>
        </thead>
        <tbody>
          {fieldSources.length === 0 ? (
            <tr>
              <td colSpan={5}>No per-field provenance stored yet.</td>
            </tr>
          ) : (
            fieldSources.map((row) => (
              <tr key={row.field}>
                <th scope="row">
                  <code>{row.field}</code>
                </th>
                <td>{row.source}</td>
                <td>{row.confidence}</td>
                <td>{row.review}</td>
                <td>{formatDateTime(row.retrieved)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
