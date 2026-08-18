import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard, fetchHealth } from "../api";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import DashboardGraph from "../components/DashboardGraph";
import GlobalSearch from "../components/GlobalSearch";
import { GRAPH_COLORS } from "../graphColors";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchDashboard(), fetchHealth()])
      .then(([dash, health]) => {
        if (!cancelled) { setData(dash); setDbStatus(health); }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard data. Is the server running?");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setTimeout(() => setVisible(true), 100);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className={`dashboard ${visible ? "dashboard--visible" : ""}`}>
      <section className="hero">
        <div className="hero-badge">Powered by cognodb</div>
        <h1 className="hero-title">
          <span className="hero-title-line">API Impact</span>
          <span className="hero-title-accent">Graph</span>
        </h1>
        <p className="hero-subtitle">
          Understand the impact of API changes across your system.
          Explore dependencies, trace affected services, and identify
          the teams responsible for them.
        </p>
        <div className="hero-actions">
          <Link to="/apis" className="btn btn-primary btn-lg">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Explore APIs
          </Link>
          <Link to="/services" className="btn btn-secondary btn-lg">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
            Explore Services
          </Link>
        </div>
        <GlobalSearch />
        {dbStatus && (
          <div className={`db-health db-health--${dbStatus.database === "connected" ? "ok" : "err"}`}>
            <span className="db-health-dot" />
            Database: {dbStatus.database}
          </div>
        )}
      </section>

      <div className="stat-grid">
        <StatCard
          label="APIs"
          value={data.apis}
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>}
          color="#6366f1"
          delay={0}
        />
        <StatCard
          label="Services"
          value={data.services}
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" /></svg>}
          color="#0891b2"
          delay={100}
        />
        <StatCard
          label="Teams"
          value={data.teams}
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
          color="#7c3aed"
          delay={200}
        />
        <StatCard
          label="Deprecated"
          value={data.deprecatedVersions}
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          color="#f97316"
          delay={300}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-graph-section">
          <div className="dashboard-section-header">
            <h2>Dependency Overview</h2>
            <Link to="/apis" className="dashboard-section-link">View all →</Link>
          </div>
          <div className="dashboard-graph-card">
            <DashboardGraph graph={data.graph} />
            <div className="dashboard-graph-legend">
              <span className="dashboard-legend-item">
                <span className="dashboard-legend-dot" style={{ background: GRAPH_COLORS.api.fill }} />
                API
              </span>
              <span className="dashboard-legend-item">
                <span className="dashboard-legend-dot" style={{ background: GRAPH_COLORS.service.fill }} />
                Service
              </span>
              <span className="dashboard-legend-item dashboard-legend-edge">
                <span className="dashboard-legend-line dashboard-legend-line--solid" />
                CALLS
              </span>
              <span className="dashboard-legend-item dashboard-legend-edge">
                <span className="dashboard-legend-line dashboard-legend-line--dashed" />
                DEPENDS_ON
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-quick-actions">
          <div className="dashboard-section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="dashboard-action-cards">
            <Link to="/apis" className="dashboard-action-card">
              <div className="dashboard-action-icon" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <div className="dashboard-action-content">
                <h3>Browse APIs</h3>
                <p>View all APIs and their versions</p>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="dashboard-action-arrow">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link to="/services" className="dashboard-action-card">
              <div className="dashboard-action-icon" style={{ background: "rgba(8,145,178,0.1)", color: "#0891b2" }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <div className="dashboard-action-content">
                <h3>Browse Services</h3>
                <p>View all services and dependencies</p>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="dashboard-action-arrow">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link to="/teams" className="dashboard-action-card">
              <div className="dashboard-action-icon" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="dashboard-action-content">
                <h3>Browse Teams</h3>
                <p>View team ownership and services</p>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="dashboard-action-arrow">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
