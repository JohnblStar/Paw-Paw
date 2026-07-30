const VIEW_WIDTH = 560
const VIEW_HEIGHT = 200
const PADDING = { top: 24, right: 16, bottom: 24, left: 32 }

export default function WeightLineChart({ points }) {
  if (!points || points.length === 0) {
    return <p className="text-sm text-ink-secondary">체중 기록이 없어요</p>
  }

  const weights = points.map((point) => point.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  const chartWidth = VIEW_WIDTH - PADDING.left - PADDING.right
  const chartHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom

  const coords = points.map((point, index) => {
    const x = PADDING.left + (index / Math.max(points.length - 1, 1)) * chartWidth
    const y = PADDING.top + (1 - (point.weight - min) / range) * chartHeight
    return { x, y, point }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const labelStep = Math.max(Math.ceil(points.length / 6), 1)
  const last = coords[coords.length - 1]

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="w-full" role="img" aria-label="체중 변화 그래프">
      {[0, 0.5, 1].map((ratio) => (
        <line
          key={ratio}
          x1={PADDING.left}
          x2={VIEW_WIDTH - PADDING.right}
          y1={PADDING.top + ratio * chartHeight}
          y2={PADDING.top + ratio * chartHeight}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      ))}

      <path d={linePath} fill="none" stroke="var(--color-primary-mint-dark)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {coords.map((c, index) => {
        const prev = coords[index - 1]
        const next = coords[index + 1]
        const isValley = prev && next && c.y > prev.y && c.y > next.y
        const labelY = isValley ? c.y - 20 : c.y - 10
        return (
          <g key={c.point.date}>
            <circle cx={c.x} cy={c.y} r="4" fill="var(--color-primary-mint-dark)" />
            <text
              x={c.x}
              y={labelY}
              textAnchor="middle"
              className="fill-ink text-[10px] font-semibold"
            >
              {c.point.weight}kg
            </text>
          </g>
        )
      })}

      {coords.map((c, index) =>
        index % labelStep === 0 ? (
          <text
            key={c.point.date}
            x={c.x}
            y={VIEW_HEIGHT - 6}
            textAnchor="middle"
            className="fill-ink-secondary text-[9px]"
          >
            {c.point.date.slice(5).replace('-', '/')}
          </text>
        ) : null,
      )}
    </svg>
  )
}
