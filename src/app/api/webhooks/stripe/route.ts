import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === 'subscription' && session.subscription) {
        const { subscriber_id, creator_id } = session.metadata || {}

        if (subscriber_id && creator_id) {
          // Create or update subscription
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              subscriber_id,
              creator_id,
              stripe_subscription_id: session.subscription as string,
              status: 'active',
              is_free: false,
            } as never)

          if (!error) {
            // Log activity
            await supabase.rpc('log_activity', {
              p_event_type: 'subscription',
              p_actor_id: subscriber_id,
              p_target_id: creator_id,
              p_metadata: { is_free: false },
            } as never)
          }
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' } as never)
        .eq('stripe_subscription_id', subscription.id)

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      const status = subscription.status === 'active' ? 'active' : 'inactive'

      await supabase
        .from('subscriptions')
        .update({ status } as never)
        .eq('stripe_subscription_id', subscription.id)

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }

      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' } as never)
          .eq('stripe_subscription_id', invoice.subscription)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
