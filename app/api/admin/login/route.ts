import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single()

  if (!admin) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
  }

  const hash = createHash('sha256').update(password).digest('hex')
  if (hash !== admin.password_hash) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
