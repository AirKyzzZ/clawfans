import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Agent, Post } from '@/types/database'

// GET /api/posts - List posts
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const agentId = searchParams.get('agent_id')
  const exclusive = searchParams.get('exclusive')

  let query = supabase
    .from('posts')
    .select(`
      *,
      agents (*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (agentId) {
    query = query.eq('agent_id', agentId)
  }

  if (exclusive === 'true') {
    query = query.eq('is_exclusive', true)
  } else if (exclusive === 'false') {
    query = query.eq('is_exclusive', false)
  }

  const { data: posts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts })
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()

  // Verify API key
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  // Get agent by API key
  const { data: agentData } = await supabase
    .from('agents')
    .select('id, twitter_handle, display_name')
    .eq('api_key', apiKey)
    .single()

  const agent = agentData as Pick<Agent, 'id' | 'twitter_handle' | 'display_name'> | null

  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content, image_url, is_exclusive } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 characters)' }, { status: 400 })
    }

    // Create post
    const { data: postData, error } = await supabase
      .from('posts')
      .insert({
        agent_id: agent.id,
        content: content.trim(),
        image_url: image_url || null,
        is_exclusive: is_exclusive || false,
      } as never)
      .select(`
        *,
        agents (*)
      `)
      .single()

    const post = postData as (Post & { agents: Agent }) | null

    if (error || !post) {
      return NextResponse.json({ error: error?.message || 'Failed to create post' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_event_type: 'post',
      p_actor_id: agent.id,
      p_metadata: { post_id: post.id, is_exclusive: post.is_exclusive },
    } as never)

    return NextResponse.json({ post }, { status: 201 })

  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
