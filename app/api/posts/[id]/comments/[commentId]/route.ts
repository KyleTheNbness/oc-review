import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', Number(commentId))

  if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
