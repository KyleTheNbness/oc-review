'use client'

import { useState, useRef } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

const LABELS: Record<number, string> = {
  0.5: '极差', 1: '很差', 1.5: '差', 2: '较差', 2.5: '一般偏低',
  3: '一般', 3.5: '还不错', 4: '不错', 4.5: '很好', 5: '极好'
}

export default function StarPicker({ value, onChange }: Props) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  function getValueFromMouse(e: React.MouseEvent<HTMLButtonElement>, i: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    return x < rect.width / 2 ? i - 0.5 : i
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => {
        const full = display >= i
        const half = !full && display >= i - 0.5

        return (
          <button
            key={i}
            type="button"
            onClick={e => onChange(getValueFromMouse(e, i))}
            onMouseMove={e => setHovered(getValueFromMouse(e, i))}
            onMouseLeave={() => setHovered(0)}
            className="relative text-2xl w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
            <span className="text-slate-200">★</span>
            {(full || half) && (
              <span
                className="absolute inset-0 flex items-center justify-center text-gold-400 overflow-hidden"
                style={{ width: full ? '100%' : '50%' }}
              >
                ★
              </span>
            )}
          </button>
        )
      })}
      {display > 0 && (
        <span className="ml-2 rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-gold-600">{LABELS[display] || ''}</span>
      )}
    </div>
  )
}
