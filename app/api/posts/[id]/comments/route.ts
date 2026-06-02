import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { body, parent_id } = await req.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: '请填写回复内容' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: Number(id), body: body.trim(), parent_id: parent_id || null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '回复失败，请重试' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
