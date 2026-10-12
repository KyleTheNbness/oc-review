'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchCategory, getCachedCategory } from '@/lib/categoryCache'
import { getUserToken } from '@/lib/userToken'
import type { Category } from '@/types'

const MY_ITEMS_KEY = 'oc_my_items'

export default function NewItemPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.category as string

  const [category, setCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const cached = getCachedCategory(slug)
    if (cached) setCategory(cached)
    fetchCategory(slug).then(data => { if (data) setCategory(data) })
  }, [slug])

  async function submit() {
    if (!name.trim()) { setError('请填写条目名称'); return }
    if (!category) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: category.id,
        name: name.trim(),
        description: description.trim() || null,
        user_token: getUserToken(),
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || '提交失败，请重试')
      setSubmitting(false)
      return
    }

    try {
      const arr = JSON.parse(localStorage.getItem(MY_ITEMS_KEY) || '[]')
      localStorage.setItem(MY_ITEMS_KEY, JSON.stringify([json.id, ...arr]))
    } catch {}
    router.push(`/${slug}/${json.id}`)
  }

  return (
    <div className="fade-in">
      <Link href={`/${slug}`} className="back-link">← 返回</Link>
      <h1 className="page-title mt-4 mb-6">
        添加新条目 {category ? `· ${category.name}` : ''}
      </h1>

      <div className="card p-5 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">条目名称 <span className="text-rose-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例如：Murdy Hall 或 ECON 101"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">简短描述（可选）</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="一句话介绍"
            className="input"
          />
        </div>
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary px-5 py-2.5 self-start"
        >
          {submitting ? '提交中…' : '提交'}
        </button>
      </div>
    </div>
  )
}
