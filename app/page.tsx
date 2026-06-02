import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('id')

  // Get stats for each category
  const stats: Record<number, { count: number; avg: number | null }> = {}
  if (categories) {
    for (const cat of categories) {
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .eq('category_id', cat.id)
        .eq('is_hidden', false)

      const itemIds = (items || []).map((i) => i.id)
      let avg = null
      if (itemIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('item_id', itemIds)
          .eq('is_hidden', false)
        if (reviews && reviews.length > 0) {
          avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        }
      }
      stats[cat.id] = { count: itemIds.length, avg }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">OC 测评</h1>
        <p className="text-gray-500 text-sm">Oxford College 中国留学生匿名测评平台</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(categories || []).map((cat) => {
          const s = stats[cat.id] || { count: 0, avg: null }
          return (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2 hover:border-gray-400 transition-colors"
            >
              <div className="font-semibold text-base">{cat.name}</div>
              <div className="text-xs text-gray-400">
                {s.count} 个条目
              </div>
            </Link>
          )
        })}
      </div>

      {(!categories || categories.length === 0) && (
        <div className="text-center text-gray-400 py-16 text-sm">
          数据加载中，请先完成 Supabase 配置…
        </div>
      )}

      <Link
        href="/forum"
        className="mt-3 block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-400 transition-colors"
      >
        <div className="font-semibold text-base">论坛</div>
        <div className="text-xs text-gray-400 mt-1">Tips、问题、随便聊</div>
      </Link>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white px-5 py-4 text-xs text-gray-400 leading-relaxed space-y-1">
        <p>· 本站内容均为用户匿名提交，不代表任何官方立场。</p>
        <p>· 课程、教授评价因人而异，仅供参考，不保证信息的准确性与时效性。</p>
        <p>· 请文明发言，共同维护良好的社区环境。</p>
        <p>· 如发现不实或不当内容，请联系管理员处理。</p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/contact" className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
          联系管理员
        </Link>
      </div>
    </div>
  )
}
