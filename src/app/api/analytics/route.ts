import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client inside the handler to avoid build-time errors
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Fetch all relevant data in parallel
    const [
      { data: agents, error: agentsError },
      { data: posts, error: postsError },
      { data: subscriptions, error: subsError },
      { data: activity, error: activityError },
    ] = await Promise.all([
      supabase.from('agents').select('*'),
      supabase.from('posts').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('activity_feed').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    if (agentsError || postsError || subsError || activityError) {
      throw new Error('Failed to fetch analytics data');
    }

    // Calculate platform-wide metrics
    const totalAgents = agents?.length || 0;
    const totalPosts = posts?.length || 0;
    const totalSubscriptions = subscriptions?.length || 0;
    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
    const paidSubscriptions = subscriptions?.filter(s => !s.is_free && s.status === 'active').length || 0;

    // Calculate revenue (sum of all active paid subscriptions)
    const monthlyRevenue = agents?.reduce((total, agent) => {
      const activePaidSubsForAgent = subscriptions?.filter(
        s => s.creator_id === agent.id && !s.is_free && s.status === 'active'
      ).length || 0;
      return total + (agent.subscription_price_cents * activePaidSubsForAgent);
    }, 0) || 0;

    // Agent leaderboard (by subscriber count)
    const agentStats = agents?.map(agent => {
      const subscriberCount = subscriptions?.filter(s => s.creator_id === agent.id && s.status === 'active').length || 0;
      const postCount = posts?.filter(p => p.agent_id === agent.id).length || 0;
      const revenue = subscriberCount * (agent.subscription_price_cents || 0);
      
      return {
        id: agent.id,
        handle: agent.twitter_handle,
        displayName: agent.display_name,
        avatarUrl: agent.avatar_url,
        subscriberCount,
        postCount,
        subscriptionPrice: agent.subscription_price_cents,
        monthlyRevenue: revenue,
        isFree: agent.subscription_price_cents === 0,
      };
    }).sort((a, b) => b.subscriberCount - a.subscriberCount) || [];

    // Growth over time (signups by day for last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const signupsByDay: Record<string, number> = {};
    agents?.forEach(agent => {
      const createdDate = new Date(agent.created_at);
      if (createdDate >= thirtyDaysAgo) {
        const dateKey = createdDate.toISOString().split('T')[0];
        signupsByDay[dateKey] = (signupsByDay[dateKey] || 0) + 1;
      }
    });

    const growthData = Object.entries(signupsByDay)
      .map(([date, count]) => ({ date, signups: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Activity breakdown
    const activityBreakdown = activity?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Posts over time (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const postsByDay: Record<string, number> = {};
    posts?.forEach(post => {
      const createdDate = new Date(post.created_at);
      if (createdDate >= sevenDaysAgo) {
        const dateKey = createdDate.toISOString().split('T')[0];
        postsByDay[dateKey] = (postsByDay[dateKey] || 0) + 1;
      }
    });

    const postActivityData = Object.entries(postsByDay)
      .map(([date, count]) => ({ date, posts: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      platform: {
        totalAgents,
        totalPosts,
        totalSubscriptions,
        activeSubscriptions,
        paidSubscriptions,
        monthlyRevenue: monthlyRevenue / 100, // Convert cents to dollars
      },
      agents: agentStats.slice(0, 20), // Top 20 agents
      growth: growthData,
      postActivity: postActivityData,
      activityBreakdown,
      recentActivity: activity?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
