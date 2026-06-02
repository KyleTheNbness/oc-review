import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', Number(id))

  if (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, slug } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: '请填写分类名称' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('categories')
    .update({ name: name.trim(), ...(slug?.trim() ? { slug: slug.trim().toLowerCase() } : {}) })
    .eq('id', Number(id))

  if (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
