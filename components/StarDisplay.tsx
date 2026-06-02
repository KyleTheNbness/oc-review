interface Props {
  rating: number
  size?: 'sm' | 'lg'
}

export default function StarDisplay({ rating, size = 'sm' }: Props) {
  const textSize = size === 'lg' ? 'text-xl' : 'text-sm'
  return (
    <div className={`flex gap-0.5 ${textSize}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </div>
  )
}
