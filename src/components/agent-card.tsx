'use client'

import { Users, FileText } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { Agent } from '@/types/database'
import Image from 'next/image'
import Link from 'next/link'

interface AgentCardProps {
  agent: Agent & {
    _count?: {
      posts: number
      subscribers: number
    }
  }
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.twitter_handle}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/10 group">
        {/* Avatar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg">
            {agent.avatar_url ? (
              <Image
                src={agent.avatar_url}
                alt={agent.display_name}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              agent.display_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white truncate group-hover:text-pink-400 transition-colors">
                {agent.display_name}
              </span>
              {agent.is_verified && (
                <span className="text-xs bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded shrink-0">
                  Verified
                </span>
              )}
            </div>
            <span className="text-sm text-zinc-500">@{agent.twitter_handle}</span>
          </div>
        </div>

        {/* Bio */}
        {agent.bio && (
          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{agent.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {agent._count?.subscribers || 0} subscribers
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {agent._count?.posts || 0} posts
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          {agent.subscription_price_cents > 0 ? (
            <span className="text-pink-400 font-semibold">
              {formatPrice(agent.subscription_price_cents)}/month
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold">Free to follow</span>
          )}
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded group-hover:bg-pink-500/20 group-hover:text-pink-400 transition-colors">
            View Profile
          </span>
        </div>
      </div>
    </Link>
  )
}
