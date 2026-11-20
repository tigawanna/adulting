import { createRootRoute, Link, Outlet, useSearch } from "@tanstack/react-router";
import { CalendarRange, ExternalLink, Plus } from "lucide-react";
import { defaultSearch, makeSearch } from "@/lib/search";
import "../styles.css";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const view = (useSearch({ strict: false }) as { view?: string }).view ?? "month";

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/calendar" search={defaultSearch()} className="brand">
          <span className="brand-mark">
            <CalendarRange size={20} />
          </span>
          <span className="brand-text">
            <strong>Kenya Tools</strong>
            <small>Calendar</small>
          </span>
        </Link>

        <nav className="site-nav">
          <Link
            to="/calendar"
            search={(prev) => makeSearch(prev, { view: "month" })}
            className={view === "month" ? "active" : ""}
          >
            Month
          </Link>
          <Link
            to="/calendar"
            search={(prev) => makeSearch(prev, { view: "term" })}
            className={view === "term" ? "active" : ""}
          >
            Terms
          </Link>
          <Link
            to="/calendar"
            search={(prev) => makeSearch(prev, { view: "list" })}
            className={view === "list" ? "active" : ""}
          >
            Search
          </Link>
        </nav>

        <a className="header-cta" href="https://www.kra.go.ke/" target="_blank" rel="noreferrer">
          <ExternalLink size={15} /> <span>KRA source</span>
        </a>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>Kenya Tools · a public-interest date registry</span>
        <span>
          <Plus size={12} /> dates are community-maintained — verify against official sources
        </span>
      </footer>
    </div>
  );
}
