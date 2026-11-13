export function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = 112
  const height = 32
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width
      const y = height - ((value - min) / (max - min || 1)) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline className="spark" fill="none" stroke={positive ? '#1a7a4c' : '#c44838'} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  )
}
