'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUserToken } from '@/lib/userToken'

interface Notification {
  id: number
  type: string
  post_id: number
  comment_id: number | null
  created_at: string
  is_read: boolean
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = getUserToken()
    setToken(t)
    if (!t) return
    fetch(`/api/notifications?token=${t}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data) })
  }, [])

  async function markOneRead(id: number) {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, id }),
    })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function markAllRead() {
    if (!token || notifications.length === 0) return
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    setNotifications([])
  }

  const count = notifications.length

  function label(n: Notification) {
    return n.type === 'reply_to_post' ? '有人回复了你的帖子' : '有人回复了你的评论'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
        aria-label="消息通知"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-rose-500 ring-2 ring-white text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fade-in absolute right-0 top-11 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold">消息通知</span>
            <div className="flex items-center gap-3">
              {count > 0 && <button onClick={markAllRead} className="text-slate-400 hover:text-slate-600 text-xs">全部已读</button>}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">关闭</button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">暂无新消息</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {notifications.map(n => (
                <Link
                  key={n.id}
                  href={`/forum/${n.post_id}`}
                  onClick={() => { setOpen(false); markOneRead(n.id) }}
                  className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm text-slate-700">{label(n)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
