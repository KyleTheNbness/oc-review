'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ListSkeleton } from '@/components/Skeletons'

interface Post {
  id: number
  title: string
  body: string | null
  created_at: string
  comment_count: number
}

type SortMode = 'time' | 'hot'

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortMode>('time')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (!data) { setLoading(false); return }

      // 一次查询拿到所有帖子的回复，在本地统计数量
      //（之前是每个帖子单独发一次请求，帖子越多越慢）
      const counts: Record<number, number> = {}
      const ids = data.map(p => p.id)
      if (ids.length > 0) {
        const { data: comments } = await supabase
          .from('post_comments')
          .select('post_id')
          .in('post_id', ids)
          .eq('is_hidden', false)
        ;(comments || []).forEach(c => { counts[c.post_id] = (counts[c.post_id] || 0) + 1 })
      }
      const withCounts = data.map(post => ({ ...post, comment_count: counts[post.id] || 0 }))
      setPosts(withCounts)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = posts
    .filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.body || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sort === 'hot'
        ? b.comment_count - a.comment_count
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  const btnCls = (active: boolean) =>
    `text-xs font-medium px-3 py-1.5 rounded-lg transition ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`

  if (loading) return <ListSkeleton />

  return (
    <div className="fade-in">
      <div className="flex items-end justify-between mb-5">
        <div>
          <Link href="/" className="back-link">← 返回</Link>
          <h1 className="page-title mt-1">论坛</h1>
          <p className="muted mt-1">Tips、问题、随便聊</p>
        </div>
        <Link href="/forum/new" className="btn-primary">
          <span className="text-base leading-none">+</span> 发帖
        </Link>
      </div>

      {/* 搜索 + 排序 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
          </svg>
          <input
            type="search"
            placeholder="搜索帖子…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-0.5 shrink-0 rounded-xl bg-slate-100 p-1">
          <button className={btnCls(sort === 'time')} onClick={() => setSort('time')}>最新</button>
          <button className={btnCls(sort === 'hot')} onClick={() => setSort('hot')}>最热</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-slate-400 py-16 text-sm">
          {search ? '没有匹配的帖子' : '暂无帖子，点击右上角发第一帖！'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(post => (
            <Link
              key={post.id}
              href={`/forum/${post.id}`}
              className="card-link px-5 py-4"
            >
              <div className="font-medium text-base text-slate-900">{post.title}</div>
              {post.body && (
                <div className="text-sm text-slate-500 mt-1 line-clamp-2">{post.body}</div>
              )}
              <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
                <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                <span className={`inline-flex items-center gap-1 ${post.comment_count > 0 ? 'text-brand-600' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l2.5-3H18a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v13Z" />
                  </svg>
                  {post.comment_count} 条回复
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
