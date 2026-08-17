import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard } from "../api";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard data. Is the server running?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="dashboard">
      <section className="hero">
        <h1>API Impact Graph</h1>
        <p>
          Understand the impact of API changes across your system.
          <br />
          Explore dependencies, trace affected services, and identify
          the teams responsible for them.
        </p>
        <div className="hero-actions">
          <Link to="/apis" className="btn btn-primary">Explore APIs</Link>
          <Link to="/services" className="btn btn-secondary">Explore Services</Link>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard label="APIs" value={data.apis} />
        <StatCard label="Services" value={data.services} />
        <StatCard label="Teams" value={data.teams} />
        <StatCard label="Deprecated Versions" value={data.deprecatedVersions} />
      </div>
    </div>
  );
}

export default Dashboard;
