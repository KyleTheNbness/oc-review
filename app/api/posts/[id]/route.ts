import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { title, body, user_token } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: '请填写标题' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('posts').select('user_token').eq('id', Number(id)).single()
  if (!post || !user_token || post.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { error } = await supabase
    .from('posts')
    .update({ title: title.trim(), body: body?.trim() || null })
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

  const { data: post } = await supabase
    .from('posts').select('user_token').eq('id', Number(id)).single()
  if (!post || !user_token || post.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { error } = await supabase.from('posts').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
