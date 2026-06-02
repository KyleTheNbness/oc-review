import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()

  const [
    { data: categories },
    { data: items },
    { data: reviews },
    { data: messages },
  ] = await Promise.all([
    supabase.from('categories').select('*').order('id'),
    supabase.from('items').select('*, categories(name)').order('created_at', { ascending: false }),
    supabase.from('reviews').select('*, items(name)').order('created_at', { ascending: false }),
    supabase.from('messages').select('*').order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ categories, items, reviews, messages })
}
