import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { name, slug } = await req.json()

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: '请填写分类名称和标识' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), slug: slug.trim().toLowerCase() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '添加失败，标识可能已存在' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data })
}
