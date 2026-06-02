import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params
  const { user_token } = await req.json().catch(() => ({})) as { user_token?: string }

  const supabase = createServiceClient()

  const { data: comment } = await supabase
    .from('post_comments').select('user_token').eq('id', Number(commentId)).single()
  if (!comment || !user_token || comment.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

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
  const { body, user_token } = await req.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: '请填写内容' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: comment } = await supabase
    .from('post_comments').select('user_token').eq('id', Number(commentId)).single()
  if (!comment || !user_token || comment.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { error } = await supabase
    .from('post_comments')
    .update({ body: body.trim() })
    .eq('id', Number(commentId))

  if (error) return NextResponse.json({ error: '更新失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
