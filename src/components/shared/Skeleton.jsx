export function SkeletonRow({ cols = 10 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="table-td">
          <div className="skeleton h-4 rounded" style={{ width: `${50 + Math.random() * 50}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton h-3 w-20 rounded mb-2" />
      <div className="skeleton h-7 w-12 rounded" />
    </div>
  )
}
