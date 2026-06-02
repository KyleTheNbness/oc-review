import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { body } = await req.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: '请填写消息内容' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({ body: body.trim() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '发送失败，请重试' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
