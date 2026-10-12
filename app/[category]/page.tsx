'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fetchCategory, getCachedCategory } from '@/lib/categoryCache'
import type { Category, Item } from '@/types'
import StarDisplay from '@/components/StarDisplay'
import { ListSkeleton } from '@/components/Skeletons'

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.category as string

  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [ratingsReady, setRatingsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadItems(catId: number) {
      const { data: rawItems } = await supabase
        .from('items')
        .select('*')
        .eq('category_id', catId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
      if (cancelled) return

      const list = rawItems || []
      // 先把条目列表显示出来，评分随后补上
      setItems(list)
      setLoading(false)

      const itemIds = list.map(i => i.id)
      const reviewsByItem: Record<number, number[]> = {}
      if (itemIds.length > 0) {
        const { data: allReviews } = await supabase
          .from('reviews')
          .select('item_id, rating')
          .in('item_id', itemIds)
          .eq('is_hidden', false)
        if (cancelled) return
        ;(allReviews || []).forEach(r => {
          if (!reviewsByItem[r.item_id]) reviewsByItem[r.item_id] = []
          reviewsByItem[r.item_id].push(r.rating)
        })
      }

      setItems(list.map(item => {
        const ratings = reviewsByItem[item.id] || []
        const count = ratings.length
        const avg = count > 0 ? ratings.reduce((s, r) => s + r, 0) / count : null
        return { ...item, avg_rating: avg ?? undefined, review_count: count }
      }))
      setRatingsReady(true)
    }

    async function load() {
      const cached = getCachedCategory(slug)
      if (cached) {
        // 有缓存：直接用缓存的板块 id 去查条目，同时在后台核对板块信息
        setCategory(cached)
        fetchCategory(slug).then(fresh => {
          if (cancelled) return
          if (!fresh) router.push('/')
          else setCategory(fresh)
        })
        await loadItems(cached.id)
        return
      }
      const cat = await fetchCategory(slug)
      if (cancelled) return
      if (!cat) { router.push('/'); return }
      setCategory(cat)
      await loadItems(cat.id)
    }

    load()
    return () => { cancelled = true }
  }, [slug, router])

  // 按首字母排序并分组
  const q = search.trim().toLowerCase()
  const filtered = items
    .filter(i => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

  // 分组：取第一个字母作为分组键
  const grouped: { letter: string; items: Item[] }[] = []
  for (const item of filtered) {
    const letter = item.name[0]?.toUpperCase() || '#'
    const last = grouped[grouped.length - 1]
    if (last && last.letter === letter) {
      last.items.push(item)
    } else {
      grouped.push({ letter, items: [item] })
    }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="fade-in">
      <div className="flex items-end justify-between mb-6">
        <div>
          <Link href="/" className="back-link">← 返回</Link>
          <h1 className="page-title mt-1">{category?.name}</h1>
          <p className="muted mt-1">共 {items.length} 个条目</p>
        </div>
        <Link href={`/${slug}/new`} className="btn-primary">
          <span className="text-base leading-none">+</span> 添加条目
        </Link>
      </div>

      <div className="relative mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
        </svg>
        <input
          type="search"
          placeholder="搜索条目名称…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-slate-400 py-16 text-sm">
          {search ? '没有匹配的条目' : '暂无条目，点击右上角添加'}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(group => (
            <div key={group.letter}>
              <div className="sticky top-[61px] z-10 -mx-1 mb-2 px-1 py-1 text-xs font-bold text-brand-600/70 uppercase tracking-widest bg-[#f6f7fb]/90 backdrop-blur-sm">
                {group.letter}
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map(item => (
                  <Link
                    key={item.id}
                    href={`/${slug}/${item.id}`}
                    className="card-link px-5 py-4 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4 min-w-[76px]">
                      {!ratingsReady ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="skeleton h-4 w-8" />
                          <div className="skeleton h-3 w-16" />
                        </div>
                      ) : item.avg_rating != null ? (
                        <>
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-base font-bold text-gold-500 tabular-nums">
                              {Number(item.avg_rating).toFixed(1)}
                            </span>
                            <StarDisplay rating={item.avg_rating} size="sm" />
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.review_count} 条评价</div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-300">暂无评价</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
