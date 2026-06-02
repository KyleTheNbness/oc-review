import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { id, name, description } = await req.json()

  if (!id || !name?.trim()) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('items')
    .update({ name: name.trim(), description: description?.trim() || null })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
