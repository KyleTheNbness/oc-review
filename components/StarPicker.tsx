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
            className="relative text-2xl w-7 h-7 flex items-center justify-center"
          >
            <span className="text-gray-200">★</span>
            {(full || half) && (
              <span
                className="absolute inset-0 flex items-center justify-center text-amber-400 overflow-hidden"
                style={{ width: full ? '100%' : '50%' }}
              >
                ★
              </span>
            )}
          </button>
        )
      })}
      {display > 0 && (
        <span className="text-sm text-gray-500 ml-1">{LABELS[display] || ''}</span>
      )}
    </div>
  )
}
