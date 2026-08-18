function SortControls({ sortBy, onSortChange, options }) {
  return (
    <div className="sort-controls">
      <label className="sort-label">Sort by</label>
      <select
        className="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default SortControls;
