function StatCard({ label, value, loading }) {
  return (
    <div className="stat-card">
      <div className="stat-value">
        {loading ? <span className="stat-skeleton" /> : value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default StatCard;
