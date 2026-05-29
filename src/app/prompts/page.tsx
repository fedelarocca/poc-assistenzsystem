import Link from "next/link";

export default function PromptsPage() {
  return (
    <div style={{ maxWidth: "600px", margin: "40px auto" }}>
      <div className="card" style={{ padding: "30px", borderLeft: "4px solid var(--primary-color)" }}>
        <h1>Prompts & Analysen</h1>
        <p style={{ lineHeight: "1.6", marginBottom: "20px" }}>
          Analysen und Prompts werden innerhalb eines Analysefalls ausgeführt. Öffnen Sie einen Analysefall, um eine Analyse vorzubereiten.
        </p>
        <Link href="/cases" className="btn-primary">
          Zu den Analysefällen
        </Link>
      </div>
    </div>
  );
}
