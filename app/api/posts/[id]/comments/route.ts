import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { body, parent_id, user_token } = await req.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: '请填写回复内容' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const postId = Number(id)

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, body: body.trim(), parent_id: parent_id || null, user_token: user_token || null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '回复失败，请重试' }, { status: 500 })
  }

  // Create notifications (fire-and-forget)
  if (user_token) {
    // Notify post author if replying to top-level
    if (!parent_id) {
      const { data: post } = await supabase
        .from('posts').select('user_token').eq('id', postId).single()
      if (post?.user_token && post.user_token !== user_token) {
        await supabase.from('notifications').insert({
          recipient_token: post.user_token,
          type: 'reply_to_post',
          post_id: postId,
          comment_id: data.id,
        })
      }
    } else {
      // Notify parent comment author
      const { data: parentComment } = await supabase
        .from('post_comments').select('user_token').eq('id', parent_id).single()
      if (parentComment?.user_token && parentComment.user_token !== user_token) {
        await supabase.from('notifications').insert({
          recipient_token: parentComment.user_token,
          type: 'reply_to_comment',
          post_id: postId,
          comment_id: data.id,
        })
      }
    }
  }

  return NextResponse.json({ ok: true, id: data.id })
}
