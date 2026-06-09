"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DocumentsPage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("poc_demo_token");
    if (!token) {
      router.push("/");
      setHasToken(false);
    } else {
      setHasToken(true);
    }
  }, [router]);

  if (hasToken === null || hasToken === false) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Prüfe Demo-Zugangsschlüssel...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto" }}>
      <div className="card" style={{ padding: "30px", borderLeft: "4px solid var(--primary-color)" }}>
        <h1>Dokumente</h1>
        <p style={{ lineHeight: "1.6", marginBottom: "20px" }}>
          Dokumente werden innerhalb eines Analysefalls zugeordnet. Öffnen Sie einen Analysefall, um Dokumente hinzuzufügen.
        </p>
        <Link href="/cases" className="btn-primary">
          Zu den Analysefällen
        </Link>
      </div>
    </div>
  );
}
