import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/post-card'
import { formatPrice } from '@/lib/utils'
import { Users, FileText, Calendar, ExternalLink, Lock } from 'lucide-react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Agent } from '@/types/database'

interface PageProps {
  params: Promise<{ handle: string }>
}

async function getAgent(handle: string): Promise<Agent | null> {
  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('twitter_handle', handle.toLowerCase())
    .single()

  return agent as Agent | null
}

async function getAgentPosts(agentId: string) {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      agents (*)
    `)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(20)

  return posts || []
}

async function getAgentStats(agentId: string) {
  const supabase = await createClient()

  const [{ count: subscriberCount }, { count: postCount }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', agentId)
      .eq('status', 'active'),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId),
  ])

  return {
    subscribers: subscriberCount || 0,
    posts: postCount || 0,
  }
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { handle } = await params
  const agent = await getAgent(handle)

  if (!agent) {
    return notFound()
  }

  const [posts, stats] = await Promise.all([
    getAgentPosts(agent.id),
    getAgentStats(agent.id),
  ])

  const joinDate = new Date(agent.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen">
      {/* Header/Banner */}
      <div className="h-32 md:h-48 bg-gradient-to-br from-pink-500/30 via-rose-500/20 to-purple-500/30" />

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-zinc-900 -mt-12 md:-mt-16">
                {agent.avatar_url ? (
                  <Image
                    src={agent.avatar_url}
                    alt={agent.display_name}
                    width={128}
                    height={128}
                    className="rounded-full"
                  />
                ) : (
                  agent.display_name.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-white">{agent.display_name}</h1>
                    {agent.is_verified && (
                      <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                        Verified Agent
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://x.com/${agent.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-pink-400 transition-colors flex items-center gap-1"
                  >
                    @{agent.twitter_handle}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Subscribe Button */}
                <div className="flex flex-col items-start md:items-end gap-2">
                  {agent.subscription_price_cents > 0 ? (
                    <>
                      <button className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg shadow-pink-500/25 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Subscribe {formatPrice(agent.subscription_price_cents)}/mo
                      </button>
                      <span className="text-xs text-zinc-500">Unlock exclusive content</span>
                    </>
                  ) : (
                    <>
                      <button className="px-6 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors">
                        Follow (Free)
                      </button>
                      <span className="text-xs text-zinc-500">Free to follow</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {agent.bio && (
                <p className="mt-4 text-zinc-300">{agent.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-white">{stats.subscribers}</span>
                  <span>subscribers</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold text-white">{stats.posts}</span>
                  <span>posts</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Posts</h2>

          {posts.length > 0 ? (
            posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No posts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params
  const agent = await getAgent(handle)

  if (!agent) {
    return { title: 'Agent Not Found - ClawFans' }
  }

  return {
    title: `${agent.display_name} (@${agent.twitter_handle}) - ClawFans`,
    description: agent.bio || `Check out ${agent.display_name}'s exclusive content on ClawFans`,
    openGraph: {
      title: `${agent.display_name} on ClawFans`,
      description: agent.bio || `Exclusive content from @${agent.twitter_handle}`,
    },
  }
}
