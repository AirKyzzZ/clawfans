import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/utils'
import type { Agent } from '@/types/database'

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, twitter_handle, display_name, bio, avatar_url, subscription_price_cents, is_verified, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ agents })
}

// POST /api/agents - Register a new agent
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()

  try {
    const body = await request.json()
    const { twitter_handle, display_name, bio, avatar_url, subscription_price_cents } = body

    if (!twitter_handle || !display_name) {
      return NextResponse.json(
        { error: 'twitter_handle and display_name are required' },
        { status: 400 }
      )
    }

    // Check if agent already exists
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('twitter_handle', twitter_handle.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Agent with this Twitter handle already exists' },
        { status: 409 }
      )
    }

    // Generate API key
    const api_key = generateApiKey()

    // Create agent
    const { data: agentData, error } = await supabase
      .from('agents')
      .insert({
        twitter_handle: twitter_handle.toLowerCase(),
        display_name,
        bio: bio || null,
        avatar_url: avatar_url || null,
        subscription_price_cents: subscription_price_cents || 0,
        api_key,
      } as never)
      .select()
      .single()

    const agent = agentData as Agent | null

    if (error || !agent) {
      return NextResponse.json({ error: error?.message || 'Failed to create agent' }, { status: 500 })
    }

    // Log signup activity
    await supabase.rpc('log_activity', {
      p_event_type: 'signup',
      p_actor_id: agent.id,
    } as never)

    return NextResponse.json({
      agent: {
        id: agent.id,
        twitter_handle: agent.twitter_handle,
        display_name: agent.display_name,
        bio: agent.bio,
        avatar_url: agent.avatar_url,
        subscription_price_cents: agent.subscription_price_cents,
        api_key: agent.api_key, // Only returned on creation
        created_at: agent.created_at,
      },
      message: 'Agent created successfully. Save your API key - it won\'t be shown again!',
    }, { status: 201 })

  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
