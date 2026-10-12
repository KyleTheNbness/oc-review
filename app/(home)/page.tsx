import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// 每个板块轮流使用的点缀色
const ACCENTS = [
  'bg-brand-50 text-brand-700 ring-brand-100',
  'bg-gold-50 text-gold-600 ring-gold-100',
  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'bg-rose-50 text-rose-600 ring-rose-100',
  'bg-violet-50 text-violet-700 ring-violet-100',
  'bg-sky-50 text-sky-700 ring-sky-100',
]

export default async function HomePage() {
  // 两个查询并行发出，一次往返拿到全部数据
  //（之前是每个板块依次查两次，板块越多越慢）
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from('categories').select('*').order('id'),
    supabase.from('items').select('category_id').eq('is_hidden', false),
  ])

  const counts: Record<number, number> = {}
  for (const it of items || []) {
    counts[it.category_id] = (counts[it.category_id] || 0) + 1
  }

  return (
    <div className="fade-in">
      <section className="mb-6 pt-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          选课、选教授、选宿舍，<span className="text-brand-700">先看看大家怎么说</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">匿名、真实、仅供参考。</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {(categories || []).map((cat, idx) => {
          const count = counts[cat.id] || 0
          return (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="card-link p-5 flex flex-col gap-3"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold ring-1 ${ACCENTS[idx % ACCENTS.length]}`}
              >
                {cat.name.slice(0, 1)}
              </span>
              <div>
                <div className="font-semibold text-base text-slate-900">{cat.name}</div>
                <div className="muted mt-0.5">{count} 个条目</div>
              </div>
            </Link>
          )
        })}
      </div>

      {(!categories || categories.length === 0) && (
        <div className="text-center text-slate-400 py-16 text-sm">
          数据加载中，请先完成 Supabase 配置…
        </div>
      )}

      <Link
        href="/forum"
        className="mt-3 card-link p-5 flex items-center gap-4 bg-gradient-to-br from-brand-700 to-brand-900 border-brand-800 text-white hover:border-brand-700"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gold-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 6 2.5-3H18a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v13Z" />
          </svg>
        </span>
        <div className="flex-1">
          <div className="font-semibold text-base">论坛</div>
          <div className="text-xs text-brand-100/80 mt-0.5">Tips、问题、随便聊</div>
        </div>
        <span className="text-brand-200 text-lg">→</span>
      </Link>

      <div className="mt-8 card px-5 py-4 text-xs text-slate-500 leading-relaxed space-y-1.5">
        <p>· 本站内容均为用户匿名提交，不代表任何官方立场^ ^</p>
        <p>· 课程、教授评价因人而异，仅供参考。不要把任何一面之词当作确凿的真理。</p>
        <p>· 请文明，认真发言，共同维护良好的社区环境。</p>
        <p>· 如发现不实或不当内容，或有任何建议(例如想新开某个板块),请在下方联系管理员。</p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/contact" className="text-sm text-slate-400 hover:text-brand-700 underline underline-offset-4 decoration-slate-300 transition-colors">
          联系管理员
        </Link>
      </div>
    </div>
  )
}
