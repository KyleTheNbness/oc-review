import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, description, user_token } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: '请填写条目名称' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: item } = await supabase
    .from('items').select('user_token').eq('id', Number(id)).single()
  if (!item || !user_token || item.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { error } = await supabase
    .from('items')
    .update({ name: name.trim(), description: description?.trim() || null })
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

  const { data: item } = await supabase
    .from('items').select('user_token').eq('id', Number(id)).single()
  if (!item || !user_token || item.user_token !== user_token) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { error } = await supabase.from('items').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
