import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { item_id, rating, body } = await req.json()

  if (!item_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const supabase = createServiceClient()

  // Check 24-hour rate limit per IP per item
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('item_id', item_id)
    .eq('ip_address', ip)
    .gte('created_at', cutoff)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: '你在 24 小时内已经对该条目评价过了' },
      { status: 429 }
    )
  }

  const { error } = await supabase.from('reviews').insert({
    item_id,
    rating,
    body: body || null,
    ip_address: ip,
  })

  if (error) {
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
