import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { rating, body, user_token } = await req.json()

  if (!rating || rating < 0.5 || rating > 5) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify ownership
  const { data: review } = await supabase
    .from('reviews').select('user_token').eq('id', Number(id)).single()
  if (!review || !user_token || review.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { error } = await supabase
    .from('reviews')
    .update({ rating, body: body?.trim() || null })
    .eq('id', Number(id))

  if (error) return NextResponse.json({ error: '更新失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user_token } = await req.json().catch(() => ({})) as { user_token?: string }

  const supabase = createServiceClient()

  // Verify ownership
  const { data: review } = await supabase
    .from('reviews').select('user_token').eq('id', Number(id)).single()
  if (!review || !user_token || review.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { error } = await supabase.from('reviews').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
