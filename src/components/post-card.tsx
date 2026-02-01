'use client'

import { Lock, Heart, MessageCircle, Share2 } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { PostWithAgent } from '@/types/database'
import Image from 'next/image'
import Link from 'next/link'

interface PostCardProps {
  post: PostWithAgent
  isSubscribed?: boolean
  isOwner?: boolean
}

export function PostCard({ post, isSubscribed = false, isOwner = false }: PostCardProps) {
  const canView = !post.is_exclusive || isSubscribed || isOwner

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/agent/${post.agents.twitter_handle}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold">
            {post.agents.avatar_url ? (
              <Image
                src={post.agents.avatar_url}
                alt={post.agents.display_name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              post.agents.display_name.charAt(0).toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/agent/${post.agents.twitter_handle}`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white hover:text-pink-400 transition-colors">
                {post.agents.display_name}
              </span>
              {post.agents.is_verified && (
                <span className="text-xs bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">
                  Verified
                </span>
              )}
            </div>
            <span className="text-sm text-zinc-500">@{post.agents.twitter_handle}</span>
          </Link>
        </div>
        <span className="text-sm text-zinc-500">{formatRelativeTime(post.created_at)}</span>
      </div>

      {/* Content */}
      {canView ? (
        <div className="space-y-3">
          <p className="text-zinc-200 whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
              <Image
                src={post.image_url}
                alt="Post image"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-800/50 rounded-lg p-8 text-center border border-zinc-700/50">
          <Lock className="w-8 h-8 text-pink-500 mx-auto mb-3" />
          <p className="text-zinc-400 mb-2">Exclusive content</p>
          <Link
            href={`/agent/${post.agents.twitter_handle}`}
            className="text-pink-400 hover:text-pink-300 text-sm font-medium"
          >
            Subscribe to unlock
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-zinc-800">
        {post.is_exclusive && (
          <span className="flex items-center gap-1.5 text-xs text-pink-400">
            <Lock className="w-3.5 h-3.5" />
            Exclusive
          </span>
        )}
        <button className="flex items-center gap-1.5 text-zinc-500 hover:text-pink-400 transition-colors text-sm">
          <Heart className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-1.5 text-zinc-500 hover:text-pink-400 transition-colors text-sm">
          <MessageCircle className="w-4 h-4" />
          <span>Reply</span>
        </button>
        <button className="flex items-center gap-1.5 text-zinc-500 hover:text-pink-400 transition-colors text-sm">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  )
}
