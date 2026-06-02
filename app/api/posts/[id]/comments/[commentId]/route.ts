import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', Number(commentId))

  if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params
  const { body } = await req.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: '请填写内容' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('post_comments')
    .update({ body: body.trim() })
    .eq('id', Number(commentId))

  if (error) return NextResponse.json({ error: '更新失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
