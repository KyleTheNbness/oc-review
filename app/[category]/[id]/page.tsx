'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Item, Review } from '@/types'
import StarDisplay from '@/components/StarDisplay'
import StarPicker from '@/components/StarPicker'

export default function ItemPage() {
  const params = useParams()
  const slug = params.category as string
  const id = Number(params.id)

  const [item, setItem] = useState<Item | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  async function loadReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('item_id', id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }

  useEffect(() => {
    async function load() {
      const { data: itemData } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .eq('is_hidden', false)
        .single()
      setItem(itemData)
      await loadReviews()
      setLoading(false)
    }
    load()
  }, [id])

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  async function submitReview() {
    if (rating === 0) { setSubmitMsg('请选择星级评分'); return }
    setSubmitting(true)
    setSubmitMsg('')

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: id, rating, body: body.trim() || null }),
    })
    const json = await res.json()

    if (!res.ok) {
      setSubmitMsg(json.error || '提交失败，请重试')
    } else {
      setSubmitMsg('评价已提交！')
      setRating(0)
      setBody('')
      await loadReviews()
    }
    setSubmitting(false)
  }

  if (loading) return <div className="text-gray-400 text-sm py-16 text-center">加载中…</div>
  if (!item) return <div className="text-center py-16 text-gray-400 text-sm">条目不存在</div>

  return (
    <div>
      <Link href={`/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">{item.name}</h1>
        {item.description && <p className="text-gray-500 text-sm mt-1">{item.description}</p>}
        <div className="mt-4 flex items-center gap-3">
          {avgRating !== null ? (
            <>
              <span className="text-4xl font-bold text-amber-500">{avgRating.toFixed(1)}</span>
              <div>
                <StarDisplay rating={avgRating} size="lg" />
                <div className="text-xs text-gray-400 mt-1">{reviews.length} 条评价</div>
              </div>
            </>
          ) : (
            <span className="text-gray-400 text-sm">暂无评价</span>
          )}
        </div>
      </div>

      {/* 写评价 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4">写评价</h2>
        <div className="mb-3">
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <textarea
          placeholder="写下你的感受（可选）"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
        />
        {submitMsg && (
          <p className={`text-sm mt-2 ${submitMsg.includes('已提交') ? 'text-green-600' : 'text-red-500'}`}>
            {submitMsg}
          </p>
        )}
        <button
          onClick={submitReview}
          disabled={submitting}
          className="mt-3 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {submitting ? '提交中…' : '提交评价'}
        </button>
      </div>

      {/* 评价列表 */}
      <div>
        <h2 className="font-semibold mb-3">全部评价（{reviews.length}）</h2>
        {reviews.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">暂无评价，成为第一个！</div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <StarDisplay rating={review.rating} size="sm" />
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {review.body && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
