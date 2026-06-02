'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserToken } from '@/lib/userToken'
import type { Item, Review } from '@/types'
import StarDisplay from '@/components/StarDisplay'
import StarPicker from '@/components/StarPicker'

export default function ItemPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.category as string
  const id = Number(params.id)

  const [item, setItem] = useState<Item | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [myToken, setMyToken] = useState('')
  const [loading, setLoading] = useState(true)

  // 点赞
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({})
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())

  // 写评价
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  // 编辑评价
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editBody, setEditBody] = useState('')

  // 编辑条目
  const [editingItem, setEditingItem] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  async function loadReviews(token?: string) {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('item_id', id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
    const list = data || []
    setReviews(list)

    if (list.length === 0) return
    const ids = list.map(r => r.id)

    // Fetch like counts
    const { data: likesData } = await supabase
      .from('likes')
      .select('target_id')
      .eq('target_type', 'review')
      .in('target_id', ids)

    const counts: Record<number, number> = {}
    ids.forEach(i => { counts[i] = 0 })
    ;(likesData || []).forEach(l => { counts[l.target_id] = (counts[l.target_id] || 0) + 1 })
    setLikeCounts(counts)

    // Fetch my likes
    const t = token || myToken
    if (t) {
      const { data: myLikes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'review')
        .eq('user_token', t)
        .in('target_id', ids)
      setLikedIds(new Set((myLikes || []).map(l => l.target_id)))
    }
  }

  useEffect(() => {
    const t = getUserToken()
    setMyToken(t)
    async function load() {
      const { data: itemData } = await supabase
        .from('items').select('*').eq('id', id).eq('is_hidden', false).single()
      setItem(itemData)
      await loadReviews(t)
      setLoading(false)
    }
    load()
  }, [id])

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  async function toggleLike(reviewId: number) {
    if (!myToken) return
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_token: myToken, target_type: 'review', target_id: reviewId }),
    })
    const json = await res.json()
    setLikeCounts(prev => ({ ...prev, [reviewId]: json.count }))
    setLikedIds(prev => {
      const next = new Set(prev)
      json.liked ? next.add(reviewId) : next.delete(reviewId)
      return next
    })
  }

  async function submitReview() {
    if (rating === 0) { setSubmitMsg('请选择星级评分'); return }
    if (!body.trim()) { setSubmitMsg('请填写评价内容'); return }
    setSubmitting(true)
    setSubmitMsg('')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: id, rating, body: body.trim(), user_token: myToken }),
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

  async function deleteReview(reviewId: number) {
    if (!confirm('确定删除这条评价吗？')) return
    await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_token: myToken }),
    })
    await loadReviews()
  }

  async function saveEdit(reviewId: number) {
    await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: editRating, body: editBody, user_token: myToken }),
    })
    setEditingId(null)
    await loadReviews()
  }

  async function deleteItem() {
    if (!confirm('确定删除这个条目吗？（同时会删除所有相关评价）')) return
    await fetch(`/api/items/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_token: myToken }),
    })
    router.push(`/${slug}`)
  }

  async function saveItem() {
    if (!editName.trim()) return
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc, user_token: myToken }),
    })
    setItem(p => p ? { ...p, name: editName, description: editDesc || null } : p)
    setEditingItem(false)
  }

  if (loading) return <div className="text-gray-400 text-sm py-16 text-center">加载中…</div>
  if (!item) return <div className="text-center py-16 text-gray-400 text-sm">条目不存在</div>

  const isMineItem = myToken && item.user_token === myToken

  return (
    <div>
      <Link href={`/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>

      <div className="mt-4 mb-6">
        {editingItem ? (
          <div className="flex flex-col gap-3">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 font-bold text-xl"
            />
            <input
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="简短描述（可选）"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 text-gray-500"
            />
            <div className="flex gap-2">
              <button onClick={saveItem} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">保存</button>
              <button onClick={() => setEditingItem(false)} className="text-sm text-gray-500 px-4 py-2">取消</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold">{item.name}</h1>
              {isMineItem && (
                <div className="flex gap-2 shrink-0 mt-1">
                  <button
                    onClick={() => { setEditingItem(true); setEditName(item.name); setEditDesc(item.description || '') }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >编辑</button>
                  <button onClick={deleteItem} className="text-xs text-red-400 hover:text-red-600">删除</button>
                </div>
              )}
            </div>
            {item.description && <p className="text-gray-500 text-sm mt-1">{item.description}</p>}
          </>
        )}
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
          placeholder="写下你的感受（必填）"
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
            {reviews.map(review => {
              const isMine = myToken && review.user_token === myToken
              const isEditing = editingId === review.id
              const liked = likedIds.has(review.id)
              const likeCount = likeCounts[review.id] || 0

              return (
                <div key={review.id} className={`bg-white border rounded-xl px-5 py-4 ${isMine ? 'border-amber-200' : 'border-gray-200'}`}>
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <StarPicker value={editRating} onChange={setEditRating} />
                      <textarea
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(review.id)} className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700">保存</button>
                        <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 px-4 py-1.5 hover:text-gray-700">取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <StarDisplay rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      {review.body && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.body}</p>}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => toggleLike(review.id)}
                          className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
                        >
                          <span>{liked ? '❤️' : '🤍'}</span>
                          <span>{likeCount > 0 ? likeCount : '点赞'}</span>
                        </button>
                        {isMine && (
                          <div className="flex gap-2 ml-auto">
                            <button onClick={() => { setEditingId(review.id); setEditRating(review.rating); setEditBody(review.body || '') }} className="text-xs text-blue-500 hover:text-blue-700">编辑</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => deleteReview(review.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
