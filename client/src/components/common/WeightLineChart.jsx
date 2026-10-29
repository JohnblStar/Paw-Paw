import { useId } from 'react'

const VIEW_WIDTH = 560
const VIEW_HEIGHT = 200
const PADDING = { top: 24, right: 16, bottom: 45, left: 32 }

// standardRange: 품종 적정 체중 범위 {min, max} — 품종 가이드에 값이 있을 때만 배경 띠로 표시한다.
export default function WeightLineChart({ points, standardRange = null }) {
  // SVG url(#id) 참조에 안전한 문자만 남긴다 (useId 결과에는 콜론 등 특수문자가 들어간다)
  const gradientId = `weight-area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  if (!points || points.length === 0) {
    return <p className="rounded-2xl bg-surface-muted/70 px-4 py-5 text-center text-sm text-ink-secondary">체중 기록이 없어요</p>
  }

  const weights = points.map((point) => point.weight)
  // 적정 범위 띠가 화면 밖으로 잘리지 않도록 축 범위에 함께 포함한다.
  const domainValues = standardRange ? [...weights, standardRange.min, standardRange.max] : weights
  const min = Math.min(...domainValues)
  const max = Math.max(...domainValues)
  const range = max - min || 1

  const chartWidth = VIEW_WIDTH - PADDING.left - PADDING.right
  const chartHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom

  const toY = (value) => PADDING.top + (1 - (value - min) / range) * chartHeight

  const coords = points.map((point, index) => {
    const x = PADDING.left + (index / Math.max(points.length - 1, 1)) * chartWidth
    return { x, y: toY(point.weight), point }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const chartBottom = PADDING.top + chartHeight
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${chartBottom} L ${coords[0].x} ${chartBottom} Z`
  const labelStep = Math.max(Math.ceil(points.length / 6), 1)

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="w-full" role="img" aria-label="체중 변화 그래프">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary-mint-dark)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-primary-mint-dark)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((ratio) => (
        <line
          key={ratio}
          x1={PADDING.left}
          x2={VIEW_WIDTH - PADDING.right}
          y1={PADDING.top + ratio * chartHeight}
          y2={PADDING.top + ratio * chartHeight}
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray={ratio === 1 ? undefined : '3 4'}
        />
      ))}

      {standardRange && (
        <g>
          <rect
            x={PADDING.left}
            width={chartWidth}
            y={toY(standardRange.max)}
            height={Math.max(toY(standardRange.min) - toY(standardRange.max), 1)}
            fill="var(--color-primary-mint)"
            opacity="0.18"
          />
          <text x={PADDING.left + 4} y={toY(standardRange.max) + 11} textAnchor="start" className="fill-primary-mint-deep text-[9px] font-semibold">
            품종 적정 {standardRange.min}~{standardRange.max}kg
          </text>
        </g>
      )}

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="var(--color-primary-mint-deep)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {coords.map((c, index) => {
        const prev = coords[index - 1]
        const next = coords[index + 1]
        const isAbove =
          (!prev || prev.point.weight < c.point.weight) && (!next || next.point.weight <= c.point.weight)
        const labelY = isAbove ? c.y - 10 : Math.min(c.y + 16, VIEW_HEIGHT - 20)

        return (
          <g key={c.point.date}>
            <circle cx={c.x} cy={c.y} r="4.5" fill="var(--color-surface)" stroke="var(--color-primary-mint-deep)" strokeWidth="2.5" />
            <text
              x={c.x}
              y={labelY}
              textAnchor="middle"
              className="fill-ink text-[10px] font-bold tabular-nums"
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
            className="fill-muted text-[9px] font-medium tabular-nums"
          >
            {c.point.date.slice(5).replace('-', '/')}
          </text>
        ) : null,
      )}
    </svg>
  )
}