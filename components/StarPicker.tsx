'use client'

import { useState } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

const LABELS = ['', '很差', '较差', '一般', '不错', '很好']

export default function StarPicker({ value, onChange }: Props) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-colors ${i <= display ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
      {display > 0 && (
        <span className="text-sm text-gray-500 ml-1">{LABELS[display]}</span>
      )}
    </div>
  )
}
