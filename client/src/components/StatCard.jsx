function StatCard({ label, value, icon, color = "#6366f1", delay = 0 }) {
  return (
    <div
      className="stat-card"
      style={{ "--card-color": color, animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default StatCard;
