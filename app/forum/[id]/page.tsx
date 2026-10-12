'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserToken } from '@/lib/userToken'
import LikeButton from '@/components/LikeButton'
import { DetailSkeleton } from '@/components/Skeletons'

interface Post { id: number; title: string; body: string | null; created_at: string; user_token: string | null }
interface Comment {
  id: number
  body: string
  created_at: string
  parent_id: number | null
  user_token: string | null
  replies?: Comment[]
}

function buildTree(flat: Comment[]): Comment[] {
  const map: Record<number, Comment> = {}
  const roots: Comment[] = []
  flat.forEach(c => { map[c.id] = { ...c, replies: [] } })
  flat.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies!.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
}

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [flatComments, setFlatComments] = useState<Comment[]>([])
  const [myToken, setMyToken] = useState('')
  const [loading, setLoading] = useState(true)

  // 点赞
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({})
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())

  // 新回复
  const [replyTo, setReplyTo] = useState<{ id: number; preview: string } | null>(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 编辑帖子
  const [editingPost, setEditingPost] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const editTitleRef = useRef<HTMLInputElement>(null)
  const editBodyRef = useRef<HTMLTextAreaElement>(null)

  // 编辑回复
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentBody, setEditCommentBody] = useState('')
  const editCommentRef = useRef<HTMLTextAreaElement>(null)

  async function loadLikes(flat: Comment[], token?: string) {
    if (flat.length === 0) return
    const ids = flat.map(c => c.id)

    const t = token || myToken
    // 点赞总数和"我赞过的"同时查
    const [{ data: likesData }, myLikesRes] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'comment')
        .in('target_id', ids),
      t
        ? supabase
            .from('likes')
            .select('target_id')
            .eq('target_type', 'comment')
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

  async function loadComments(token?: string) {
    const { data } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })
    const flat = data || []
    setFlatComments(flat)
    setComments(buildTree(flat))
    await loadLikes(flat, token)
  }

  useEffect(() => {
    const t = getUserToken()
    setMyToken(t)
    async function load() {
      // 帖子和回复并行加载
      const [{ data: postData }] = await Promise.all([
        supabase.from('posts').select('*').eq('id', id).eq('is_hidden', false).single(),
        loadComments(t),
      ])
      setPost(postData)
      setLoading(false)
    }
    load()
  }, [id])

  async function toggleLike(commentId: number) {
    if (!myToken) return
    // 先在界面上立刻变化，再等服务器确认（失败则回滚）
    const wasLiked = likedIds.has(commentId)
    const prevCount = likeCounts[commentId] || 0
    const apply = (liked: boolean, count: number) => {
      setLikeCounts(prev => ({ ...prev, [commentId]: count }))
      setLikedIds(prev => {
        const next = new Set(prev)
        if (liked) next.add(commentId)
        else next.delete(commentId)
        return next
      })
    }
    apply(!wasLiked, Math.max(0, prevCount + (wasLiked ? -1 : 1)))
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: myToken, target_type: 'comment', target_id: commentId }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      apply(json.liked, json.count)
    } catch {
      apply(wasLiked, prevCount)
    }
  }

  async function submitComment() {
    if (!body.trim()) { setError('请填写内容'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, parent_id: replyTo?.id || null, user_token: myToken }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || '提交失败'); setSubmitting(false); return }
    setBody('')
    setReplyTo(null)
    await loadComments()
    setSubmitting(false)
  }

  async function deletePost() {
    if (!confirm('确定删除这篇帖子吗？')) return
    await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_token: myToken }),
    })
    router.push('/forum')
  }

  async function savePost() {
    const title = editTitleRef.current?.value ?? editTitle
    const body = editBodyRef.current?.value ?? editBody
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, user_token: myToken }),
    })
    setPost(p => p ? { ...p, title, body: body || null } : p)
    setEditingPost(false)
  }

  async function deleteComment(commentId: number) {
    if (!confirm('确定删除这条回复吗？')) return
    await fetch(`/api/posts/${id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_token: myToken }),
    })
    await loadComments()
  }

  async function saveComment(commentId: number) {
    const body = editCommentRef.current?.value ?? editCommentBody
    await fetch(`/api/posts/${id}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, user_token: myToken }),
    })
    setEditingCommentId(null)
    await loadComments()
  }

  if (loading) return <DetailSkeleton />
  if (!post) return <div className="card text-center py-16 text-slate-400 text-sm">帖子不存在</div>

  const isMinePost = myToken && post.user_token === myToken

  function CommentNode({ c, depth = 0 }: { c: Comment; depth?: number }) {
    const isMine = myToken && c.user_token === myToken
    const isEditing = editingCommentId === c.id
    const liked = likedIds.has(c.id)
    const likeCount = likeCounts[c.id] || 0

    return (
      <div className={depth > 0 ? 'ml-3 sm:ml-4 border-l-2 border-brand-100 pl-3' : ''}>
        <div className={`card px-4 py-3 mb-2 ${isMine ? 'border-gold-300 ring-1 ring-gold-100' : ''}`}>
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editCommentRef}
                defaultValue={editCommentBody}
                rows={3}
                className="input resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => saveComment(c.id)} className="btn-primary py-1.5">保存</button>
                <button onClick={() => setEditingCommentId(null)} className="btn-secondary py-1.5">取消</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="muted">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                <LikeButton liked={liked} count={likeCount} onClick={() => toggleLike(c.id)} />
                <button
                  onClick={() => {
                    setReplyTo({ id: c.id, preview: c.body.slice(0, 20) })
                    document.getElementById('reply-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className="text-xs font-medium text-brand-600 hover:text-brand-800"
                >回复</button>
                {isMine && (
                  <span className="ml-auto flex gap-3">
                    <button onClick={() => { setEditingCommentId(c.id); setEditCommentBody(c.body) }} className="btn-text">编辑</button>
                    <button onClick={() => deleteComment(c.id)} className="btn-danger-text">删除</button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {c.replies && c.replies.map(r => <CommentNode key={r.id} c={r} depth={depth + 1} />)}
      </div>
    )
  }

  return (
    <div className="fade-in">
      <Link href="/forum" className="back-link">← 返回论坛</Link>

      {/* 帖子 */}
      <div className="mt-4 mb-8 card p-5">
        {editingPost ? (
          <div className="flex flex-col gap-3">
            <input ref={editTitleRef} defaultValue={editTitle} className="input font-semibold" />
            <textarea ref={editBodyRef} defaultValue={editBody} rows={5} className="input resize-none" />
            <div className="flex gap-2">
              <button onClick={savePost} className="btn-primary">保存</button>
              <button onClick={() => setEditingPost(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="page-title text-xl">{post.title}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="muted">{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
              {isMinePost && (
                <>
                  <button onClick={() => { setEditingPost(true); setEditTitle(post.title); setEditBody(post.body || '') }}
                    className="btn-text">编辑</button>
                  <button onClick={deletePost} className="btn-danger-text">删除</button>
                </>
              )}
            </div>
            {post.body && <p className="text-[15px] text-slate-700 mt-4 leading-relaxed whitespace-pre-wrap">{post.body}</p>}
          </>
        )}
      </div>

      {/* 回复列表 */}
      <div className="mb-6">
        <h2 className="section-title mb-3">回复 <span className="text-slate-400 font-normal">· {flatComments.length}</span></h2>
        {comments.length === 0
          ? <div className="card text-slate-400 text-sm text-center py-10">暂无回复，来说第一句！</div>
          : comments.map(c => <CommentNode key={c.id} c={c} />)
        }
      </div>

      {/* 写回复 */}
      <div id="reply-box" className="card p-5 scroll-mt-24">
        <h2 className="section-title mb-3">
          {replyTo ? (
            <span className="flex items-center gap-2 flex-wrap">
              回复：<span className="text-slate-400 font-normal text-sm">「{replyTo.preview}…」</span>
              <button onClick={() => setReplyTo(null)} className="btn-text">× 取消</button>
            </span>
          ) : '写回复'}
        </h2>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="说点什么…" rows={3}
          className="input resize-none" />
        {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
        <button onClick={submitComment} disabled={submitting} className="btn-primary mt-3 px-5 py-2.5">
          {submitting ? '提交中…' : '提交回复'}
        </button>
      </div>
    </div>
  )
}
