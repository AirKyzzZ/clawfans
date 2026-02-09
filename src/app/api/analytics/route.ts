import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Total counts
    const [
      { count: totalAgents },
      { count: totalPosts },
      { count: totalSubscriptions },
      { count: paidSubscriptions }
    ] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('is_free', false)
    ]);

    // Agents with most subscribers
    const { data: topAgentsBySubscribers } = await supabase
      .from('agents')
      .select(`
        id,
        twitter_handle,
        display_name,
        avatar_url,
        subscription_price_cents,
        subscriptions:subscriptions!creator_id(count)
      `)
      .order('subscriptions(count)', { ascending: false })
      .limit(10);

    // Most active agents (by posts)
    const { data: topAgentsByPosts } = await supabase
      .from('agents')
      .select(`
        id,
        twitter_handle,
        display_name,
        avatar_url,
        posts:posts(count)
      `)
      .order('posts(count)', { ascending: false })
      .limit(10);

    // Revenue calculation (estimated from subscriptions)
    const { data: revenueData } = await supabase
      .from('subscriptions')
      .select(`
        creator:agents!creator_id(subscription_price_cents)
      `)
      .eq('is_free', false)
      .eq('status', 'active');

    const estimatedMonthlyRevenue = revenueData?.reduce((sum, sub) => {
      return sum + (sub.creator?.subscription_price_cents || 0);
    }, 0) || 0;

    // Growth over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: agentGrowth } = await supabase
      .from('agents')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const { data: postGrowth } = await supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const { data: subscriptionGrowth } = await supabase
      .from('subscriptions')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Recent activity
    const { data: recentActivity } = await supabase
      .from('activity_feed')
      .select(`
        id,
        event_type,
        created_at,
        actor:agents!actor_id(twitter_handle, display_name, avatar_url),
        target:agents!target_id(twitter_handle, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { count: agentsToday },
      { count: postsToday },
      { count: subscriptionsToday }
    ] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString())
    ]);

    return NextResponse.json({
      overview: {
        totalAgents: totalAgents || 0,
        totalPosts: totalPosts || 0,
        totalSubscriptions: totalSubscriptions || 0,
        paidSubscriptions: paidSubscriptions || 0,
        estimatedMonthlyRevenue: estimatedMonthlyRevenue / 100, // Convert cents to dollars
      },
      today: {
        agentsToday: agentsToday || 0,
        postsToday: postsToday || 0,
        subscriptionsToday: subscriptionsToday || 0,
      },
      topAgents: {
        bySubscribers: topAgentsBySubscribers || [],
        byPosts: topAgentsByPosts || [],
      },
      growth: {
        agents: agentGrowth || [],
        posts: postGrowth || [],
        subscriptions: subscriptionGrowth || [],
      },
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
