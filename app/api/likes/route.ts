import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { user_token, target_type, target_id } = await req.json()

  if (!user_token || !target_type || !target_id) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_token', user_token)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .single()

  if (existing) {
    // Unlike
    await supabase.from('likes').delete().eq('id', existing.id)
  } else {
    // Like
    await supabase.from('likes').insert({ user_token, target_type, target_id })
  }

  // Get new count
  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', target_type)
    .eq('target_id', target_id)

  return NextResponse.json({ liked: !existing, count: count || 0 })
}
