import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { rating, body } = await req.json()

  if (!rating || rating < 0.5 || rating > 5) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const supabase = createServiceClient()
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
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', Number(id))

  if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
