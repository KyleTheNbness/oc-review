'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

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
    supabase.from('categories').select('*').eq('slug', slug).single()
      .then(({ data }) => { if (data) setCategory(data) })
  }, [slug])

  async function submit() {
    if (!name.trim()) { setError('请填写条目名称'); return }
    if (!category) return
    setSubmitting(true)
    setError('')

    const { data, error: err } = await supabase
      .from('items')
      .insert({
        category_id: category.id,
        name: name.trim(),
        description: description.trim() || null,
        created_by: 'anonymous',
      })
      .select()
      .single()

    if (err || !data) {
      setError('提交失败，请重试')
      setSubmitting(false)
      return
    }
    router.push(`/${slug}/${data.id}`)
  }

  return (
    <div>
      <Link href={`/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>
      <h1 className="text-xl font-bold mt-4 mb-6">
        添加新条目 {category ? `· ${category.name}` : ''}
      </h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">条目名称 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例如：Murdy Hall 或 ECON 101"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">简短描述（可选）</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="一句话介绍"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 self-start"
        >
          {submitting ? '提交中…' : '提交'}
        </button>
      </div>
    </div>
  )
}
