'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserToken } from '@/lib/userToken'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!title.trim()) { setError('请填写标题'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, user_token: getUserToken() }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || '发布失败')
      setSubmitting(false)
    } else {
      router.push(`/forum/${json.id}`)
    }
  }

  return (
    <div className="fade-in">
      <Link href="/forum" className="back-link">← 返回论坛</Link>
      <h1 className="page-title mt-4 mb-6">发新帖</h1>

      <div className="card p-5 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">标题 <span className="text-rose-400">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="一句话概括你想说的"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">正文（可选）</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="详细描述…"
            rows={5}
            className="input resize-none"
          />
        </div>
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary px-5 py-2.5 self-start"
        >
          {submitting ? '发布中…' : '发布'}
        </button>
      </div>
    </div>
  )
}
