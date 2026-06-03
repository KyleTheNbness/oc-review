'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Item, Review, Category } from '@/types'

type Tab = 'reviews' | 'items' | 'stats' | 'categories' | 'messages' | 'forum' | 'users'

interface Message {
  id: number
  body: string
  created_at: string
  is_read: boolean
  reply: string | null
  replied_at: string | null
}

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
  const [editCatId, setEditCatId] = useState<number | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatSlug, setEditCatSlug] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatError, setNewCatError] = useState('')
  const [newCatSuccess, setNewCatSuccess] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [postComments, setPostComments] = useState<any[]>([])
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

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
    const res = await fetch('/api/admin/data')
    const json = await res.json()

    setCategories(json.categories || [])
    setItems(
      (json.items || []).map((i: any) => ({
        ...i,
        category_name: i.categories?.name,
      }))
    )
    setReviews(
      (json.reviews || []).map((r: any) => ({
        ...r,
        item_name: r.items?.name,
      }))
    )
    setMessages(json.messages || [])
    setPosts(json.posts || [])
    setPostComments((json.postComments || []).map((c: any) => ({ ...c, post_title: c.posts?.title })))
  }

  async function toggleReview(id: number, hidden: boolean) {
    await fetch('/api/admin/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'reviews', id, is_hidden: hidden }),
    })
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_hidden: hidden } : r))
  }

  async function toggleItem(id: number, hidden: boolean) {
    await fetch('/api/admin/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'items', id, is_hidden: hidden }),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_hidden: hidden } : i))
  }

  async function saveEdit() {
    if (!editItem) return
    await fetch('/api/admin/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editItem.id, name: editName, description: editDesc }),
    })
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

      <div className="flex gap-2 mb-6 flex-wrap">
        <button className={tabCls('reviews')} onClick={() => setTab('reviews')}>评价管理</button>
        <button className={tabCls('items')} onClick={() => setTab('items')}>条目管理</button>
        <button className={tabCls('stats')} onClick={() => setTab('stats')}>数据统计</button>
        <button className={tabCls('categories')} onClick={() => setTab('categories')}>分类管理</button>
        <button className={tabCls('forum')} onClick={() => setTab('forum')}>论坛管理</button>
        <button className={tabCls('users')} onClick={() => setTab('users')}>用户</button>
        <button className={tabCls('messages')} onClick={() => setTab('messages')}>
          消息
          {messages.filter(m => !m.reply).length > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {messages.filter(m => !m.reply).length}
            </span>
          )}
        </button>
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

      {tab === 'categories' && (
        <div>
          {/* 现有分类 */}
          <div className="flex flex-col gap-2 mb-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl px-5 py-3">
                {editCatId === cat.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      placeholder="分类名称"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <input
                      value={editCatSlug}
                      onChange={e => setEditCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="英文标识"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/admin/categories/${cat.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: editCatName, slug: editCatSlug }),
                          })
                          if (res.ok) {
                            setCategories(prev => prev.map(c =>
                              c.id === cat.id ? { ...c, name: editCatName, slug: editCatSlug || c.slug } : c
                            ))
                            setEditCatId(null)
                          } else {
                            alert('更新失败，请重试')
                          }
                        }}
                        className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700"
                      >保存</button>
                      <button onClick={() => setEditCatId(null)} className="text-sm text-gray-500 px-4 py-1.5 hover:text-gray-700">取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{cat.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">/{cat.slug}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); setEditCatSlug(cat.slug) }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                      >编辑</button>
                      <button
                        onClick={async () => {
                          if (!confirm(`确定删除「${cat.name}」分类？该分类下所有条目和评价也会被删除。`)) return
                          const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
                          if (res.ok) {
                            setCategories(prev => prev.filter(c => c.id !== cat.id))
                          } else {
                            alert('删除失败，请重试')
                          }
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      >删除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 添加新分类 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold mb-4">添加新分类</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">分类名称 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="例如：活动 / 图书馆"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">英文标识 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={e => setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="例如：events / library（仅英文小写）"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>
              {newCatError && <p className="text-red-500 text-sm">{newCatError}</p>}
              {newCatSuccess && <p className="text-green-600 text-sm">{newCatSuccess}</p>}
              <button
                onClick={async () => {
                  setNewCatError('')
                  setNewCatSuccess('')
                  if (!newCatName.trim() || !newCatSlug.trim()) {
                    setNewCatError('请填写分类名称和英文标识')
                    return
                  }
                  const res = await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newCatName, slug: newCatSlug }),
                  })
                  const json = await res.json()
                  if (!res.ok) {
                    setNewCatError(json.error || '添加失败')
                  } else {
                    setNewCatSuccess(`"${newCatName}" 添加成功！`)
                    setNewCatName('')
                    setNewCatSlug('')
                    setCategories(prev => [...prev, json.data])
                  }
                }}
                className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors self-start"
              >
                添加分类
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-16">暂无消息</div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`bg-white border rounded-xl p-5 ${!msg.reply ? 'border-amber-200' : 'border-gray-200'}`}>
              <div className="text-sm text-gray-700 leading-relaxed">{msg.body}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.created_at).toLocaleDateString('zh-CN')}
                {!msg.reply && <span className="ml-2 text-amber-500">未回复</span>}
              </div>

              {msg.reply && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="text-xs text-amber-600 font-medium mb-1">你的回复</div>
                  <div className="text-sm text-gray-700">{msg.reply}</div>
                </div>
              )}

              {replyingId === msg.id ? (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="输入回复内容…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!replyText.trim()) return
                        await fetch(`/api/admin/messages/${msg.id}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ reply: replyText }),
                        })
                        setMessages(prev => prev.map(m =>
                          m.id === msg.id ? { ...m, reply: replyText, replied_at: new Date().toISOString() } : m
                        ))
                        setReplyingId(null)
                        setReplyText('')
                      }}
                      className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700"
                    >发送回复</button>
                    <button onClick={() => setReplyingId(null)} className="text-sm text-gray-500 px-4 py-1.5 hover:text-gray-700">取消</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setReplyingId(msg.id); setReplyText(msg.reply || '') }}
                  className="mt-3 text-xs text-blue-500 hover:text-blue-700"
                >
                  {msg.reply ? '修改回复' : '回复'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (() => {
        // Collect all unique tokens sorted by first activity
        const tokenMap: Record<string, { firstSeen: string }> = {}
        const addToken = (token: string | null, date: string) => {
          if (!token) return
          if (!tokenMap[token] || date < tokenMap[token].firstSeen) {
            tokenMap[token] = { firstSeen: date }
          }
        }
        reviews.forEach(r => addToken((r as any).user_token, r.created_at))
        items.forEach(i => addToken((i as any).user_token, i.created_at))
        posts.forEach(p => addToken(p.user_token, p.created_at))
        postComments.forEach(c => addToken(c.user_token, c.created_at))

        const users = Object.entries(tokenMap)
          .sort((a, b) => a[1].firstSeen.localeCompare(b[1].firstSeen))
          .map(([token], idx) => ({ token, label: `用户 #${idx + 1}` }))

        return (
          <div className="flex flex-col gap-3">
            {users.length === 0 && <div className="text-center text-gray-400 text-sm py-16">暂无用户数据</div>}
            {users.map(({ token, label }) => {
              const userReviews = reviews.filter(r => (r as any).user_token === token)
              const userItems = items.filter(i => (i as any).user_token === token)
              const userPosts = posts.filter(p => p.user_token === token)
              const userComments = postComments.filter(c => c.user_token === token)
              const isOpen = expandedUser === token

              return (
                <div key={token} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedUser(isOpen ? null : token)}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-sm">{label}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {userReviews.length > 0 && <span>{userReviews.length} 条评价</span>}
                      {userItems.length > 0 && <span>{userItems.length} 个条目</span>}
                      {userPosts.length > 0 && <span>{userPosts.length} 篇帖子</span>}
                      {userComments.length > 0 && <span>{userComments.length} 条回复</span>}
                      <span>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-4">
                      {userReviews.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-2">评价</div>
                          <div className="flex flex-col gap-1.5">
                            {userReviews.map(r => (
                              <div key={r.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-400 text-xs">{(r as any).item_name} · {'★'.repeat(Math.round(r.rating))} · {new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
                                <p className="text-gray-700 mt-0.5">{r.body || <span className="text-gray-400 italic">无文字</span>}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {userItems.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-2">添加的条目</div>
                          <div className="flex flex-col gap-1.5">
                            {userItems.map(i => (
                              <div key={i.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-400 text-xs">{(i as any).category_name}</span>
                                <p className="text-gray-700 mt-0.5">{i.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {userPosts.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-2">帖子</div>
                          <div className="flex flex-col gap-1.5">
                            {userPosts.map(p => (
                              <div key={p.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('zh-CN')}</span>
                                <p className="text-gray-700 mt-0.5 font-medium">{p.title}</p>
                                {p.body && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{p.body}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {userComments.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-2">论坛回复</div>
                          <div className="flex flex-col gap-1.5">
                            {userComments.map(c => (
                              <div key={c.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-400 text-xs">{c.post_title} · {new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                                <p className="text-gray-700 mt-0.5">{c.body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {tab === 'forum' && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold mb-2">帖子</h2>
            <div className="flex flex-col gap-2">
              {posts.map(post => (
                <div key={post.id} className={`bg-white border rounded-xl px-4 py-3 ${post.is_hidden ? 'opacity-40' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{post.title}</div>
                      {post.body && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{post.body}</div>}
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(post.created_at).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ table: 'posts', id: post.id, is_hidden: !post.is_hidden }),
                        })
                        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_hidden: !p.is_hidden } : p))
                      }}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${post.is_hidden ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                    >
                      {post.is_hidden ? '恢复' : '隐藏'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">回复</h2>
            <div className="flex flex-col gap-2">
              {postComments.map(c => (
                <div key={c.id} className={`bg-white border rounded-xl px-4 py-3 ${c.is_hidden ? 'opacity-40' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">{c.post_title} · {new Date(c.created_at).toLocaleDateString('zh-CN')}</div>
                      <div className="text-sm text-gray-700">{c.body}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ table: 'post_comments', id: c.id, is_hidden: !c.is_hidden }),
                        })
                        setPostComments(prev => prev.map(x => x.id === c.id ? { ...x, is_hidden: !x.is_hidden } : x))
                      }}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${c.is_hidden ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                    >
                      {c.is_hidden ? '恢复' : '隐藏'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
