import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { category_id, name, description, user_token } = await req.json()

  if (!category_id || !name?.trim()) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('items')
    .insert({
      category_id,
      name: name.trim(),
      description: description?.trim() || null,
      created_by: 'anonymous',
      user_token: user_token || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
