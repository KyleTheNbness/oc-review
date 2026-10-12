import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

// 板块信息几乎不变，缓存在本次浏览会话里，
// 再次进入同一板块时可以省掉一次数据库往返。
const KEY = 'oc_category_'

export function getCachedCategory(slug: string): Category | null {
  try {
    const raw = sessionStorage.getItem(KEY + slug)
    return raw ? (JSON.parse(raw) as Category) : null
  } catch {
    return null
  }
}

export async function fetchCategory(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  try {
    if (data) sessionStorage.setItem(KEY + slug, JSON.stringify(data))
    else sessionStorage.removeItem(KEY + slug)
  } catch {}
  return data
}
