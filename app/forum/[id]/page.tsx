'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const MY_COMMENTS_KEY = 'oc_my_comments'
function getMyComments(): number[] {
  try { return JSON.parse(localStorage.getItem(MY_COMMENTS_KEY) || '[]') } catch { return [] }
}

interface Post {
  id: number
  title: string
  body: string | null
  created_at: string
}

interface Comment {
  id: number
  body: string
  created_at: string
}

export default function PostPage() {
  const params = useParams()
  const id = Number(params.id)

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [myCommentIds, setMyCommentIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function loadComments() {
    const { data } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  useEffect(() => {
    async function load() {
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('is_hidden', false)
        .single()
      setPost(postData)
      await loadComments()
      setMyCommentIds(getMyComments())
      setLoading(false)
    }
    load()
  }, [id])

  async function submitComment() {
    if (!body.trim()) { setError('请填写回复内容'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || '回复失败')
    } else {
      const arr = getMyComments()
      localStorage.setItem(MY_COMMENTS_KEY, JSON.stringify([...arr, json.id]))
      setMyCommentIds(getMyComments())
      setBody('')
      await loadComments()
    }
    setSubmitting(false)
  }

  async function deleteComment(commentId: number) {
    if (!confirm('确定删除这条回复吗？')) return
    await fetch(`/api/posts/${id}/comments/${commentId}`, { method: 'DELETE' })
    const arr = getMyComments().filter(x => x !== commentId)
    localStorage.setItem(MY_COMMENTS_KEY, JSON.stringify(arr))
    setMyCommentIds(arr)
    await loadComments()
  }

  if (loading) return <div className="text-gray-400 text-sm py-16 text-center">加载中…</div>
  if (!post) return <div className="text-center py-16 text-gray-400 text-sm">帖子不存在</div>

  return (
    <div>
      <Link href="/forum" className="text-sm text-gray-400 hover:text-gray-600">← 返回论坛</Link>

      {/* 帖子正文 */}
      <div className="mt-4 mb-6 bg-white border border-gray-200 rounded-xl p-5">
        <h1 className="text-xl font-bold">{post.title}</h1>
        <div className="text-xs text-gray-400 mt-1">
          {new Date(post.created_at).toLocaleDateString('zh-CN')}
        </div>
        {post.body && (
          <p className="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">{post.body}</p>
        )}
      </div>

      {/* 回复列表 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">回复（{comments.length}）</h2>
        {comments.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">暂无回复，来说第一句！</div>
        ) : (
          <div className="flex flex-col gap-2">
            {comments.map((c, i) => {
              const isMine = myCommentIds.includes(c.id)
              return (
                <div key={c.id} className={`bg-white border rounded-xl px-5 py-4 ${isMine ? 'border-amber-200' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2 items-start flex-1">
                      <span className="text-xs text-gray-300 mt-0.5 shrink-0">#{i + 1}</span>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                      {isMine && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >删除</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 写回复 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-3">写回复</h2>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="说点什么…"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          onClick={submitComment}
          disabled={submitting}
          className="mt-3 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {submitting ? '提交中…' : '提交回复'}
        </button>
      </div>
    </div>
  )
}
