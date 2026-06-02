import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { title, body, user_token } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: '请填写标题' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({ title: title.trim(), body: body?.trim() || null, user_token: user_token || null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '发布失败，请重试' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
