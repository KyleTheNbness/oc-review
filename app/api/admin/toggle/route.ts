import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { table, id, is_hidden } = await req.json()

  if (!table || !id || typeof is_hidden !== 'boolean') {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  if (!['items', 'reviews'].includes(table)) {
    return NextResponse.json({ error: '非法表名' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from(table)
    .update({ is_hidden })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
