interface Props {
  liked: boolean
  count: number
  onClick: () => void
  showLabel?: boolean
}

export default function LikeButton({ liked, count, onClick, showLabel = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? '取消点赞' : '点赞'}
      className={`group inline-flex items-center gap-1 rounded-full px-2 py-1 -ml-2 text-xs transition-colors ${
        liked ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 transition-transform group-active:scale-125 ${liked ? 'fill-current' : 'fill-none'}`}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5s-7.5-4.6-9.3-9.1C1.5 8.3 3.4 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.7 0 5.6 3.8 4.4 6.9-1.8 4.5-9.3 9.1-9.3 9.1Z" />
      </svg>
      {count > 0 ? <span className="tabular-nums">{count}</span> : showLabel && <span>点赞</span>}
    </button>
  )
}
