import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// GET /api/notifications?token=xxx — fetch unread notifications
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json([], { status: 200 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_token', token)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

// POST — mark as read (single id or all by token)
export async function POST(req: NextRequest) {
  const { token, id } = await req.json()
  if (!token) return NextResponse.json({ ok: true })

  const supabase = createServiceClient()
  const query = supabase.from('notifications').update({ is_read: true }).eq('user_token', token)

  if (id) {
    await query.eq('id', id)
  } else {
    await query.eq('is_read', false)
  }

  return NextResponse.json({ ok: true })
}
