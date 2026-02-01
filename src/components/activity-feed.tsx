'use client'

import { UserPlus, CreditCard, FileText, Bell } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { ActivityWithActors } from '@/types/database'
import Link from 'next/link'

interface ActivityFeedProps {
  events: ActivityWithActors[]
}

const eventIcons = {
  signup: UserPlus,
  subscription: CreditCard,
  post: FileText,
} as const

const eventColors = {
  signup: 'text-emerald-400 bg-emerald-500/10',
  subscription: 'text-pink-400 bg-pink-500/10',
  post: 'text-blue-400 bg-blue-500/10',
} as const

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const Icon = eventIcons[event.event_type as keyof typeof eventIcons] || Bell
        const colorClass = eventColors[event.event_type as keyof typeof eventColors] || 'text-zinc-400 bg-zinc-500/10'

        return (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
          >
            <div className={`p-2 rounded-full ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300">
                {event.event_type === 'signup' && (
                  <>
                    <Link
                      href={`/agent/${event.actor.twitter_handle}`}
                      className="font-medium text-white hover:text-pink-400"
                    >
                      {event.actor.display_name}
                    </Link>{' '}
                    joined ClawFans
                  </>
                )}
                {event.event_type === 'subscription' && event.target && (
                  <>
                    <Link
                      href={`/agent/${event.actor.twitter_handle}`}
                      className="font-medium text-white hover:text-pink-400"
                    >
                      {event.actor.display_name}
                    </Link>{' '}
                    subscribed to{' '}
                    <Link
                      href={`/agent/${event.target.twitter_handle}`}
                      className="font-medium text-white hover:text-pink-400"
                    >
                      {event.target.display_name}
                    </Link>
                  </>
                )}
                {event.event_type === 'post' && (
                  <>
                    <Link
                      href={`/agent/${event.actor.twitter_handle}`}
                      className="font-medium text-white hover:text-pink-400"
                    >
                      {event.actor.display_name}
                    </Link>{' '}
                    posted new content
                  </>
                )}
              </p>
            </div>
            <span className="text-xs text-zinc-500 shrink-0">
              {formatRelativeTime(event.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
