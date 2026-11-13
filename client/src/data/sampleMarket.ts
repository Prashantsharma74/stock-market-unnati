export const sampleIndices = [
  { id: 'index-sample50', name: 'SAMPLE 50', value: '22,480.00', change: 78.6, pct: 0.35 },
  { id: 'index-samplebank', name: 'SAMPLE BANK', value: '49,810.00', change: 287.4, pct: 0.58 },
  { id: 'index-samplemid', name: 'SAMPLE MID', value: '51,220.00', change: -112.8, pct: -0.22 },
  { id: 'index-sampleit', name: 'SAMPLE IT', value: '38,140.00', change: 95.2, pct: 0.25 },
  { id: 'index-sampleauto', name: 'SAMPLE AUTO', value: '18,920.00', change: -39.7, pct: -0.21 },
]

export function sketchSeries(seed: number, changePct: number) {
  return Array.from({ length: 18 }, (_, index) => {
    const progress = index / 17
    const wave = Math.sin(seed * 1.7 + index * 0.85) * 0.35
    return progress * changePct + wave
  })
}
