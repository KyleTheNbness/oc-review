'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserToken } from '@/lib/userToken'

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

    const { data: likesData } = await supabase
      .from('likes')
      .select('target_id')
      .eq('target_type', 'comment')
      .in('target_id', ids)

    const counts: Record<number, number> = {}
    ids.forEach(i => { counts[i] = 0 })
    ;(likesData || []).forEach(l => { counts[l.target_id] = (counts[l.target_id] || 0) + 1 })
    setLikeCounts(counts)

    const t = token || myToken
    if (t) {
      const { data: myLikes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'comment')
        .eq('user_token', t)
        .in('target_id', ids)
      setLikedIds(new Set((myLikes || []).map(l => l.target_id)))
    }
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
      const { data: postData } = await supabase
        .from('posts').select('*').eq('id', id).eq('is_hidden', false).single()
      setPost(postData)
      await loadComments(t)
      setLoading(false)
    }
    load()
  }, [id])

  async function toggleLike(commentId: number) {
    if (!myToken) return
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_token: myToken, target_type: 'comment', target_id: commentId }),
    })
    const json = await res.json()
    setLikeCounts(prev => ({ ...prev, [commentId]: json.count }))
    setLikedIds(prev => {
      const next = new Set(prev)
      json.liked ? next.add(commentId) : next.delete(commentId)
      return next
    })
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

  if (loading) return <div className="text-gray-400 text-sm py-16 text-center">加载中…</div>
  if (!post) return <div className="text-center py-16 text-gray-400 text-sm">帖子不存在</div>

  const isMinePost = myToken && post.user_token === myToken

  function CommentNode({ c, depth = 0 }: { c: Comment; depth?: number }) {
    const isMine = myToken && c.user_token === myToken
    const isEditing = editingCommentId === c.id
    const liked = likedIds.has(c.id)
    const likeCount = likeCounts[c.id] || 0

    return (
      <div className={depth > 0 ? 'ml-4 border-l-2 border-gray-100 pl-3' : ''}>
        <div className={`bg-white border rounded-xl px-4 py-3 mb-2 ${isMine ? 'border-amber-200' : 'border-gray-200'}`}>
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editCommentRef}
                defaultValue={editCommentBody}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => saveComment(c.id)} className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700">保存</button>
                <button onClick={() => setEditingCommentId(null)} className="text-sm text-gray-500 px-4 py-1.5">取消</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                <button
                  onClick={() => toggleLike(c.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
                >
                  <span>{liked ? '❤️' : '🤍'}</span>
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>
                <button
                  onClick={() => setReplyTo({ id: c.id, preview: c.body.slice(0, 20) })}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >回复</button>
                {isMine && (
                  <>
                    <button onClick={() => { setEditingCommentId(c.id); setEditCommentBody(c.body) }} className="text-xs text-gray-400 hover:text-gray-600">编辑</button>
                    <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                  </>
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
    <div>
      <Link href="/forum" className="text-sm text-gray-400 hover:text-gray-600">← 返回论坛</Link>

      {/* 帖子 */}
      <div className="mt-4 mb-6 bg-white border border-gray-200 rounded-xl p-5">
        {editingPost ? (
          <div className="flex flex-col gap-3">
            <input ref={editTitleRef} defaultValue={editTitle}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 font-semibold" />
            <textarea ref={editBodyRef} defaultValue={editBody} rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none" />
            <div className="flex gap-2">
              <button onClick={savePost} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">保存</button>
              <button onClick={() => setEditingPost(false)} className="text-sm text-gray-500 px-4 py-2">取消</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">{post.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
              {isMinePost && (
                <>
                  <button onClick={() => { setEditingPost(true); setEditTitle(post.title); setEditBody(post.body || '') }}
                    className="text-xs text-gray-400 hover:text-gray-600">编辑</button>
                  <button onClick={deletePost} className="text-xs text-red-400 hover:text-red-600">删除</button>
                </>
              )}
            </div>
            {post.body && <p className="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">{post.body}</p>}
          </>
        )}
      </div>

      {/* 回复列表 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">回复（{flatComments.length}）</h2>
        {comments.length === 0
          ? <div className="text-gray-400 text-sm text-center py-8">暂无回复，来说第一句！</div>
          : comments.map(c => <CommentNode key={c.id} c={c} />)
        }
      </div>

      {/* 写回复 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-3">
          {replyTo ? (
            <span className="flex items-center gap-2 flex-wrap">
              回复：<span className="text-gray-400 font-normal text-sm">「{replyTo.preview}…」</span>
              <button onClick={() => setReplyTo(null)} className="text-xs text-gray-400 hover:text-gray-600">× 取消</button>
            </span>
          ) : '写回复'}
        </h2>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="说点什么…" rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none" />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button onClick={submitComment} disabled={submitting}
          className="mt-3 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
          {submitting ? '提交中…' : '提交回复'}
        </button>
      </div>
    </div>
  )
}
