import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Agent } from '@/types/database'

// GET /api/agents/[handle] - Get agent by handle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('agents')
    .select(`
      id,
      twitter_handle,
      display_name,
      bio,
      avatar_url,
      subscription_price_cents,
      is_verified,
      created_at
    `)
    .eq('twitter_handle', handle.toLowerCase())
    .single()

  const agent = data as Agent | null

  if (error || !agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Get subscriber count
  const { count: subscriberCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', agent.id)
    .eq('status', 'active')

  // Get post count
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agent.id)

  return NextResponse.json({
    agent: {
      ...agent,
      subscriber_count: subscriberCount || 0,
      post_count: postCount || 0,
    },
  })
}

// PATCH /api/agents/[handle] - Update agent profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const supabase = await createServiceClient()

  // Verify API key
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  // Get agent by API key
  const { data: authAgentData } = await supabase
    .from('agents')
    .select('id, twitter_handle')
    .eq('api_key', apiKey)
    .single()

  const authAgent = authAgentData as { id: string; twitter_handle: string } | null

  if (!authAgent || authAgent.twitter_handle !== handle.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { display_name, bio, avatar_url, subscription_price_cents } = body

    const updates: Partial<Agent> = {}
    if (display_name !== undefined) updates.display_name = display_name
    if (bio !== undefined) updates.bio = bio
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (subscription_price_cents !== undefined) updates.subscription_price_cents = subscription_price_cents

    const { data: updated, error } = await supabase
      .from('agents')
      .update(updates as never)
      .eq('id', authAgent.id)
      .select('id, twitter_handle, display_name, bio, avatar_url, subscription_price_cents, is_verified, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agent: updated })

  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
