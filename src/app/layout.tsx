import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoC Assistenzsystem",
  description: "Webbasiertes Assistenzsystem zur Analyse von Ausschreibungsunterlagen",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <div className="app-layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              Assistenzsystem PoC
            </div>
            <nav className="sidebar-nav">
              <Link href="/" className="nav-link">Startseite</Link>
              <Link href="/cases" className="nav-link">Analysefälle</Link>
            </nav>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
