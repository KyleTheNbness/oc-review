'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserToken } from '@/lib/userToken'
import type { Item, Review } from '@/types'
import StarDisplay from '@/components/StarDisplay'
import StarPicker from '@/components/StarPicker'
import LikeButton from '@/components/LikeButton'
import { DetailSkeleton } from '@/components/Skeletons'

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
    const t = token || myToken

    // 点赞总数和"我赞过的"同时查，不再一个等一个
    const [{ data: likesData }, myLikesRes] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'review')
        .in('target_id', ids),
      t
        ? supabase
            .from('likes')
            .select('target_id')
            .eq('target_type', 'review')
            .eq('user_token', t)
            .in('target_id', ids)
        : Promise.resolve({ data: null }),
    ])

    const counts: Record<number, number> = {}
    ids.forEach(i => { counts[i] = 0 })
    ;(likesData || []).forEach(l => { counts[l.target_id] = (counts[l.target_id] || 0) + 1 })
    setLikeCounts(counts)
    if (t) setLikedIds(new Set((myLikesRes.data || []).map(l => l.target_id)))
  }

  useEffect(() => {
    const t = getUserToken()
    setMyToken(t)
    async function load() {
      // 条目信息和评价列表并行加载
      const [{ data: itemData }] = await Promise.all([
        supabase.from('items').select('*').eq('id', id).eq('is_hidden', false).single(),
        loadReviews(t),
      ])
      setItem(itemData)
      setLoading(false)
    }
    load()
  }, [id])

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  async function toggleLike(reviewId: number) {
    if (!myToken) return
    // 先在界面上立刻变化，再等服务器确认（失败则回滚）
    const wasLiked = likedIds.has(reviewId)
    const prevCount = likeCounts[reviewId] || 0
    const apply = (liked: boolean, count: number) => {
      setLikeCounts(prev => ({ ...prev, [reviewId]: count }))
      setLikedIds(prev => {
        const next = new Set(prev)
        if (liked) next.add(reviewId)
        else next.delete(reviewId)
        return next
      })
    }
    apply(!wasLiked, Math.max(0, prevCount + (wasLiked ? -1 : 1)))
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: myToken, target_type: 'review', target_id: reviewId }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      apply(json.liked, json.count)
    } catch {
      apply(wasLiked, prevCount)
    }
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

  if (loading) return <DetailSkeleton />
  if (!item) return <div className="card text-center py-16 text-slate-400 text-sm">条目不存在</div>

  const isMineItem = myToken && item.user_token === myToken

  // 各星级的评价数量（半星向上取整归档）
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    n: reviews.filter(r => Math.ceil(r.rating) === star).length,
  }))

  return (
    <div className="fade-in">
      <Link href={`/${slug}`} className="back-link">← 返回</Link>

      <div className="card mt-4 mb-6 p-5">
        {editingItem ? (
          <div className="flex flex-col gap-3">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="input font-bold text-lg"
            />
            <input
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="简短描述（可选）"
              className="input text-slate-500"
            />
            <div className="flex gap-2">
              <button onClick={saveItem} className="btn-primary">保存</button>
              <button onClick={() => setEditingItem(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <h1 className="page-title">{item.name}</h1>
              {isMineItem && (
                <div className="flex gap-3 shrink-0 mt-2">
                  <button
                    onClick={() => { setEditingItem(true); setEditName(item.name); setEditDesc(item.description || '') }}
                    className="btn-text"
                  >编辑</button>
                  <button onClick={deleteItem} className="btn-danger-text">删除</button>
                </div>
              )}
            </div>
            {item.description && <p className="text-slate-500 text-sm mt-1.5">{item.description}</p>}
          </>
        )}

        <div className="mt-5 pt-5 border-t border-slate-100">
          {avgRating !== null ? (
            <div className="flex items-center gap-6">
              <div className="shrink-0 text-center">
                <div className="text-5xl font-bold text-gold-500 tabular-nums leading-none">{avgRating.toFixed(1)}</div>
                <div className="mt-2"><StarDisplay rating={avgRating} size="sm" /></div>
                <div className="muted mt-1">{reviews.length} 条评价</div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                {dist.map(({ star, n }) => (
                  <div key={star} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-3 text-right tabular-nums">{star}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gold-400 transition-[width] duration-500"
                        style={{ width: `${(n / reviews.length) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 tabular-nums">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">暂无评价</span>
          )}
        </div>
      </div>

      {/* 写评价 */}
      <div className="card p-5 mb-8">
        <h2 className="section-title mb-4">写评价</h2>
        <div className="mb-3">
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <textarea
          placeholder="写下你的感受（必填）"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          className="input resize-none"
        />
        {submitMsg && (
          <p className={`text-sm mt-2 ${submitMsg.includes('已提交') ? 'text-emerald-600' : 'text-rose-500'}`}>
            {submitMsg}
          </p>
        )}
        <button onClick={submitReview} disabled={submitting} className="btn-primary mt-3 px-5 py-2.5">
          {submitting ? '提交中…' : '提交评价'}
        </button>
      </div>

      {/* 评价列表 */}
      <div>
        <h2 className="section-title mb-3">全部评价 <span className="text-slate-400 font-normal">· {reviews.length}</span></h2>
        {reviews.length === 0 ? (
          <div className="card text-slate-400 text-sm text-center py-10">暂无评价，成为第一个！</div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map(review => {
              const isMine = myToken && review.user_token === myToken
              const isEditing = editingId === review.id
              const liked = likedIds.has(review.id)
              const likeCount = likeCounts[review.id] || 0

              return (
                <div key={review.id} className={`card px-5 py-4 ${isMine ? 'border-gold-300 ring-1 ring-gold-100' : ''}`}>
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <StarPicker value={editRating} onChange={setEditRating} />
                      <textarea
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        rows={3}
                        className="input resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(review.id)} className="btn-primary py-1.5">保存</button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary py-1.5">取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={review.rating} size="sm" />
                          {isMine && <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-medium text-gold-600">我的</span>}
                        </div>
                        <span className="muted">{new Date(review.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      {review.body && <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">{review.body}</p>}
                      <div className="flex items-center gap-3 mt-3">
                        <LikeButton liked={liked} count={likeCount} onClick={() => toggleLike(review.id)} showLabel />
                        {isMine && (
                          <div className="flex gap-3 ml-auto">
                            <button onClick={() => { setEditingId(review.id); setEditRating(review.rating); setEditBody(review.body || '') }} className="btn-text">编辑</button>
                            <button onClick={() => deleteReview(review.id)} className="btn-danger-text">删除</button>
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
