import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Layout() {
  const { pathname } = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try { localStorage.setItem("theme", darkMode ? "dark" : "light"); } catch {}
  }, [darkMode]);

  const isNested = (prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/");

  const toggleDark = () => setDarkMode((d) => !d);

  return (
    <div className={`app${darkMode ? " dark" : ""}`}>
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2.5" fill="#2563eb" stroke="none"/>
              <circle cx="5" cy="17" r="2.5" fill="#7c3aed" stroke="none"/>
              <circle cx="19" cy="17" r="2.5" fill="#0891b2" stroke="none"/>
              <line x1="12" y1="7.5" x2="5" y2="14.5" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="12" y1="7.5" x2="19" y2="14.5" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="7.5" y1="17" x2="16.5" y2="17" stroke="#94a3b8" strokeWidth="1.5"/>
            </svg>
          </span>
          API Impact Graph
        </div>
        <div className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/apis" className={() => isNested("/apis") ? "active" : undefined}>
            APIs
          </NavLink>
          <NavLink to="/services" className={() => isNested("/services") ? "active" : undefined}>
            Services
          </NavLink>
          <NavLink to="/teams" className={() => isNested("/teams") ? "active" : undefined}>
            Teams
          </NavLink>
        </div>
        <button
          className="nav-theme-toggle"
          onClick={toggleDark}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </nav>
      <main className="main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>API Impact Graph &bull; Understand dependencies. Assess impact. Make better decisions.</span>
        <span>Powered by cognodb + Neo4j</span>
      </footer>
    </div>
  );
}

export default Layout;
