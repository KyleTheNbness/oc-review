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
    <div>
      <Link href="/forum" className="text-sm text-gray-400 hover:text-gray-600">← 返回论坛</Link>
      <h1 className="text-xl font-bold mt-4 mb-6">发新帖</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">标题 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="一句话概括你想说的"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">正文（可选）</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="详细描述…"
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 self-start"
        >
          {submitting ? '发布中…' : '发布'}
        </button>
      </div>
    </div>
  )
}
