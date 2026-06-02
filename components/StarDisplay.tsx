interface Props {
  rating: number
  size?: 'sm' | 'lg'
}

export default function StarDisplay({ rating, size = 'sm' }: Props) {
  const textSize = size === 'lg' ? 'text-xl' : 'text-sm'

  return (
    <div className={`flex gap-0.5 ${textSize}`} style={{ lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const full = rating >= i
        const half = !full && rating >= i - 0.5

        return (
          <span key={i} className="relative inline-block">
            {/* 底层灰色星 */}
            <span className="text-gray-200">★</span>
            {/* 覆盖层：全星或半星 */}
            {(full || half) && (
              <span
                className="absolute inset-0 text-amber-400 overflow-hidden"
                style={{ width: full ? '100%' : '50%' }}
              >
                ★
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
