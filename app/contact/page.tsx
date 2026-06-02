'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MY_MESSAGES_KEY = 'oc_my_messages'

function getMyMessageIds(): number[] {
  try { return JSON.parse(localStorage.getItem(MY_MESSAGES_KEY) || '[]') } catch { return [] }
}

interface Message {
  id: number
  body: string
  created_at: string
  reply: string | null
  replied_at: string | null
}

export default function ContactPage() {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState('')
  const [myMessages, setMyMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  async function loadMyMessages() {
    const ids = getMyMessageIds()
    if (ids.length === 0) { setLoading(false); return }
    const { data } = await supabase
      .from('messages')
      .select('id, body, created_at, reply, replied_at')
      .in('id', ids)
      .order('created_at', { ascending: false })
    setMyMessages(data || [])
    setLoading(false)
  }

  useEffect(() => { loadMyMessages() }, [])

  async function send() {
    if (!body.trim()) { setSendMsg('请填写消息内容'); return }
    setSending(true)
    setSendMsg('')
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    const json = await res.json()
    if (!res.ok) {
      setSendMsg(json.error || '发送失败')
    } else {
      const ids = getMyMessageIds()
      localStorage.setItem(MY_MESSAGES_KEY, JSON.stringify([json.id, ...ids]))
      setBody('')
      setSendMsg('消息已发送！管理员回复后会显示在下方。')
      await loadMyMessages()
    }
    setSending(false)
  }

  return (
    <div>
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>
      <h1 className="text-xl font-bold mt-4 mb-6">联系管理员</h1>

      {/* 发送表单 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">发送消息</h2>
        <textarea
          placeholder="有任何问题、建议或举报违规内容，请在这里留言…"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
        />
        {sendMsg && (
          <p className={`text-sm mt-2 ${sendMsg.includes('已发送') ? 'text-green-600' : 'text-red-500'}`}>
            {sendMsg}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2">消息完全匿名，请保存页面以查看回复。</p>
        <button
          onClick={send}
          disabled={sending}
          className="mt-3 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {sending ? '发送中…' : '发送'}
        </button>
      </div>

      {/* 我的消息记录 */}
      {!loading && myMessages.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">我的消息记录</h2>
          <div className="flex flex-col gap-3">
            {myMessages.map(msg => (
              <div key={msg.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm text-gray-700 leading-relaxed">{msg.body}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(msg.created_at).toLocaleDateString('zh-CN')}
                </div>
                {msg.reply ? (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <div className="text-xs text-amber-600 font-medium mb-1">管理员回复</div>
                    <div className="text-sm text-gray-700 leading-relaxed">{msg.reply}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(msg.replied_at!).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-400 italic">等待管理员回复…</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
