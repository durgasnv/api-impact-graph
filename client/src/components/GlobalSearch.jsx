import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllApis, fetchAllServices, fetchAllTeams } from "../api";

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      Promise.all([fetchAllApis(), fetchAllServices(), fetchAllTeams()])
        .then(([apis, services, teams]) => {
          if (cancelled) return;
          const q = query.toLowerCase();
          const matched = [];
          apis.filter((a) => a.name.toLowerCase().includes(q)).forEach((a) =>
            matched.push({ type: "API", name: a.name, to: `/apis/${a.id}` })
          );
          services.filter((s) => s.name.toLowerCase().includes(q)).forEach((s) =>
            matched.push({ type: "Service", name: s.name, to: `/services/${s.id}` })
          );
          teams.filter((t) => t.name.toLowerCase().includes(q)).forEach((t) =>
            matched.push({ type: "Team", name: t.name, to: `/teams/${t.id}` })
          );
          setResults(matched.slice(0, 8));
          setLoading(false);
        })
        .catch(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (to) => {
    navigate(to);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="global-search" ref={wrapRef}>
      <input
        className="global-search-input"
        type="text"
        placeholder="Search APIs, services, teams..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim() && (
        <div className="global-search-dropdown">
          {loading && <div className="global-search-loading">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="global-search-empty">No results found</div>
          )}
          {!loading && results.map((r, i) => (
            <button
              key={i}
              className="global-search-item"
              onClick={() => handleSelect(r.to)}
            >
              <span className={`global-search-type global-search-type-${r.type.toLowerCase()}`}>
                {r.type}
              </span>
              <span className="global-search-name">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
