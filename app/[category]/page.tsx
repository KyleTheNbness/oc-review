'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Category, Item } from '@/types'
import StarDisplay from '@/components/StarDisplay'

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.category as string

  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!cat) { router.push('/'); return }
      setCategory(cat)

      const { data: rawItems } = await supabase
        .from('items')
        .select('*')
        .eq('category_id', cat.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      const enriched: Item[] = []
      for (const item of rawItems || []) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('item_id', item.id)
          .eq('is_hidden', false)
        const count = reviews?.length || 0
        const avg = count > 0 ? reviews!.reduce((s, r) => s + r.rating, 0) / count : null
        enriched.push({ ...item, avg_rating: avg ?? undefined, review_count: count })
      }
      setItems(enriched)
      setLoading(false)
    }
    load()
  }, [slug, router])

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="text-gray-400 text-sm py-16 text-center">加载中…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>
          <h1 className="text-xl font-bold mt-1">{category?.name}</h1>
        </div>
        <Link
          href={`/${slug}/new`}
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + 添加条目
        </Link>
      </div>

      <input
        type="text"
        placeholder="搜索条目名称…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-4 outline-none focus:border-gray-400"
      />

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16 text-sm">
          {search ? '没有匹配的条目' : '暂无条目，点击右上角添加'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(item => (
            <Link
              key={item.id}
              href={`/${slug}/${item.id}`}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-400 transition-colors"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</div>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                {item.avg_rating != null ? (
                  <>
                    <div className="text-sm font-semibold text-amber-500 text-right">
                      {Number(item.avg_rating).toFixed(1)}
                    </div>
                    <StarDisplay rating={item.avg_rating} size="sm" />
                    <div className="text-xs text-gray-400 mt-0.5">{item.review_count} 条评价</div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400">暂无评价</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
