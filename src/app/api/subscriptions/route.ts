import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import type { Agent, Subscription } from '@/types/database'

// GET /api/subscriptions - Get subscriptions for an agent
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()

  const { searchParams } = new URL(request.url)
  const subscriberId = searchParams.get('subscriber_id')
  const creatorId = searchParams.get('creator_id')

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      subscriber:agents!subscriptions_subscriber_id_fkey (*),
      creator:agents!subscriptions_creator_id_fkey (*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (subscriberId) {
    query = query.eq('subscriber_id', subscriberId)
  }

  if (creatorId) {
    query = query.eq('creator_id', creatorId)
  }

  const { data: subscriptions, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscriptions })
}

// POST /api/subscriptions - Subscribe to a creator
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()

  // Verify API key
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  // Get subscriber agent by API key
  const { data: subscriberData } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key', apiKey)
    .single()

  const subscriber = subscriberData as Agent | null

  if (!subscriber) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { creator_id } = body

    if (!creator_id) {
      return NextResponse.json({ error: 'creator_id is required' }, { status: 400 })
    }

    // Can't subscribe to yourself
    if (creator_id === subscriber.id) {
      return NextResponse.json({ error: 'Cannot subscribe to yourself' }, { status: 400 })
    }

    // Get creator
    const { data: creatorData } = await supabase
      .from('agents')
      .select('*')
      .eq('id', creator_id)
      .single()

    const creator = creatorData as Agent | null

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Check if already subscribed
    const { data: existingData } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('subscriber_id', subscriber.id)
      .eq('creator_id', creator_id)
      .single()

    const existing = existingData as { id: string; status: string } | null

    if (existing && existing.status === 'active') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
    }

    // Free subscription
    if (creator.subscription_price_cents === 0) {
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .upsert({
          subscriber_id: subscriber.id,
          creator_id: creator.id,
          status: 'active',
          is_free: true,
        } as never)
        .select()
        .single()

      const subscription = subscriptionData as Subscription | null

      if (error || !subscription) {
        return NextResponse.json({ error: error?.message || 'Failed to create subscription' }, { status: 500 })
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_event_type: 'subscription',
        p_actor_id: subscriber.id,
        p_target_id: creator.id,
        p_metadata: { is_free: true },
      } as never)

      return NextResponse.json({
        subscription,
        message: 'Subscribed successfully (free)',
      }, { status: 201 })
    }

    // Paid subscription - create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Subscription to ${creator.display_name}`,
              description: `Exclusive content from @${creator.twitter_handle}`,
            },
            unit_amount: creator.subscription_price_cents,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        subscriber_id: subscriber.id,
        creator_id: creator.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/agent/${creator.twitter_handle}?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/agent/${creator.twitter_handle}?subscribed=false`,
    })

    return NextResponse.json({
      checkout_url: session.url,
      message: 'Redirect to checkout to complete subscription',
    })

  } catch (err) {
    console.error('Subscription error:', err)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

// DELETE /api/subscriptions - Unsubscribe
export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()

  // Verify API key
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  const { data: subscriberData } = await supabase
    .from('agents')
    .select('id')
    .eq('api_key', apiKey)
    .single()

  const deleteSubscriber = subscriberData as { id: string } | null

  if (!deleteSubscriber) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { creator_id } = body

    if (!creator_id) {
      return NextResponse.json({ error: 'creator_id is required' }, { status: 400 })
    }

    // Get subscription
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_id', deleteSubscriber.id)
      .eq('creator_id', creator_id)
      .single()

    const subscription = subscriptionData as Subscription | null

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Cancel Stripe subscription if exists
    if (subscription.stripe_subscription_id) {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
    }

    // Update status
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' } as never)
      .eq('id', subscription.id)

    return NextResponse.json({ message: 'Unsubscribed successfully' })

  } catch {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
