'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Item, Review, Category } from '@/types'

type Tab = 'reviews' | 'items' | 'stats'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('reviews')

  const [reviews, setReviews] = useState<(Review & { item_name?: string })[]>([])
  const [items, setItems] = useState<(Item & { category_name?: string })[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  async function login() {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      setAuthed(true)
      loadData()
    } else {
      const j = await res.json()
      setLoginError(j.error || '登录失败')
    }
  }

  async function loadData() {
    const { data: cats } = await supabase.from('categories').select('*')
    setCategories(cats || [])

    const { data: allItems } = await supabase
      .from('items')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
    setItems(
      (allItems || []).map((i: any) => ({
        ...i,
        category_name: i.categories?.name,
      }))
    )

    const { data: allReviews } = await supabase
      .from('reviews')
      .select('*, items(name)')
      .order('created_at', { ascending: false })
    setReviews(
      (allReviews || []).map((r: any) => ({
        ...r,
        item_name: r.items?.name,
      }))
    )
  }

  async function toggleReview(id: number, hidden: boolean) {
    await supabase.from('reviews').update({ is_hidden: hidden }).eq('id', id)
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_hidden: hidden } : r))
  }

  async function toggleItem(id: number, hidden: boolean) {
    await supabase.from('items').update({ is_hidden: hidden }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_hidden: hidden } : i))
  }

  async function saveEdit() {
    if (!editItem) return
    await supabase.from('items').update({
      name: editName.trim(),
      description: editDesc.trim() || null,
    }).eq('id', editItem.id)
    setItems(prev => prev.map(i => i.id === editItem.id
      ? { ...i, name: editName.trim(), description: editDesc.trim() || null }
      : i
    ))
    setEditItem(null)
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <h1 className="text-xl font-bold mb-6 text-center">管理员登录</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
          <button
            onClick={login}
            className="bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            登录
          </button>
        </div>
      </div>
    )
  }

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">管理后台</h1>
        <button onClick={() => setAuthed(false)} className="text-sm text-gray-400 hover:text-gray-600">退出</button>
      </div>

      <div className="flex gap-2 mb-6">
        <button className={tabCls('reviews')} onClick={() => setTab('reviews')}>评价管理</button>
        <button className={tabCls('items')} onClick={() => setTab('items')}>条目管理</button>
        <button className={tabCls('stats')} onClick={() => setTab('stats')}>数据统计</button>
      </div>

      {tab === 'reviews' && (
        <div className="flex flex-col gap-2">
          {reviews.map(r => (
            <div key={r.id} className={`bg-white border rounded-xl px-4 py-3 ${r.is_hidden ? 'opacity-40' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">{r.item_name} · {new Date(r.created_at).toLocaleDateString('zh-CN')} · {'★'.repeat(r.rating)}</div>
                  <div className="text-sm text-gray-700">{r.body || <span className="text-gray-400 italic">无文字</span>}</div>
                </div>
                <button
                  onClick={() => toggleReview(r.id, !r.is_hidden)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${r.is_hidden ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                >
                  {r.is_hidden ? '恢复' : '隐藏'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'items' && (
        <>
          {editItem && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex flex-col gap-3">
              <div className="font-medium text-sm">编辑条目</div>
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                placeholder="描述（可选）"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">保存</button>
                <button onClick={() => setEditItem(null)} className="text-sm text-gray-500 px-4 py-2 hover:text-gray-700">取消</button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <div key={item.id} className={`bg-white border rounded-xl px-4 py-3 ${item.is_hidden ? 'opacity-40' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400 mb-0.5">{item.category_name}</div>
                    <div className="font-medium text-sm">{item.name}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditItem(item); setEditName(item.name); setEditDesc(item.description || '') }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => toggleItem(item.id, !item.is_hidden)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${item.is_hidden ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                    >
                      {item.is_hidden ? '恢复' : '隐藏'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category_id === cat.id)
            const catReviews = reviews.filter(r =>
              catItems.some(i => i.id === r.item_id)
            )
            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="font-semibold mb-2">{cat.name}</div>
                <div className="text-sm text-gray-500">条目：{catItems.length}</div>
                <div className="text-sm text-gray-500">评价：{catReviews.length}</div>
                {catReviews.length > 0 && (
                  <div className="text-sm text-amber-500 mt-1">
                    均分：{(catReviews.reduce((s, r) => s + r.rating, 0) / catReviews.length).toFixed(1)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
