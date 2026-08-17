import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ApisList from "./pages/ApisList";
import ApiDetail from "./pages/ApiDetail";
import BlastRadius from "./pages/BlastRadius";
import ServicesList from "./pages/ServicesList";
import ServiceDetail from "./pages/ServiceDetail";
import TeamsList from "./pages/TeamsList";
import TeamDetail from "./pages/TeamDetail";

function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>404</h1>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>Page not found</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/apis" element={<ApisList />} />
        <Route path="/apis/:id" element={<ApiDetail />} />
        <Route path="/apis/:id/blast-radius" element={<BlastRadius />} />
        <Route path="/services" element={<ServicesList />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/teams" element={<TeamsList />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
