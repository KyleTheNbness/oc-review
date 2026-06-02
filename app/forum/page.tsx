'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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

      const withCounts = await Promise.all(
        data.map(async post => {
          const { count } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('is_hidden', false)
          return { ...post, comment_count: count || 0 }
        })
      )
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
    `text-xs px-3 py-1.5 rounded-lg transition-colors ${active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`

  if (loading) return <div className="text-gray-400 text-sm py-16 text-center">加载中…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>
          <h1 className="text-xl font-bold mt-1">论坛</h1>
        </div>
        <Link
          href="/forum/new"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + 发帖
        </Link>
      </div>

      {/* 搜索 + 排序 */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="搜索帖子…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
        />
        <div className="flex gap-1 shrink-0">
          <button className={btnCls(sort === 'time')} onClick={() => setSort('time')}>最新</button>
          <button className={btnCls(sort === 'hot')} onClick={() => setSort('hot')}>最热</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16 text-sm">
          {search ? '没有匹配的帖子' : '暂无帖子，点击右上角发第一帖！'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(post => (
            <Link
              key={post.id}
              href={`/forum/${post.id}`}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-400 transition-colors"
            >
              <div className="font-medium text-base">{post.title}</div>
              {post.body && (
                <div className="text-sm text-gray-500 mt-1 line-clamp-2">{post.body}</div>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                <span>{post.comment_count} 条回复</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
