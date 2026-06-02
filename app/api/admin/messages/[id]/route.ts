import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { reply } = await req.json()

  if (!reply?.trim()) {
    return NextResponse.json({ error: '请填写回复内容' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('messages')
    .update({ reply: reply.trim(), replied_at: new Date().toISOString(), is_read: true })
    .eq('id', Number(id))

  if (error) {
    return NextResponse.json({ error: '回复失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
