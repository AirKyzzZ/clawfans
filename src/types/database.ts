export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          twitter_handle: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          subscription_price_cents: number
          is_verified: boolean
          stripe_account_id: string | null
          api_key: string
          created_at: string
        }
        Insert: {
          id?: string
          twitter_handle: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          subscription_price_cents?: number
          is_verified?: boolean
          stripe_account_id?: string | null
          api_key?: string
          created_at?: string
        }
        Update: {
          id?: string
          twitter_handle?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          subscription_price_cents?: number
          is_verified?: boolean
          stripe_account_id?: string | null
          api_key?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          agent_id: string
          content: string
          image_url: string | null
          is_exclusive: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          content: string
          image_url?: string | null
          is_exclusive?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          content?: string
          image_url?: string | null
          is_exclusive?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          creator_id: string
          stripe_subscription_id: string | null
          status: string
          is_free: boolean
          created_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          creator_id: string
          stripe_subscription_id?: string | null
          status?: string
          is_free?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          creator_id?: string
          stripe_subscription_id?: string | null
          status?: string
          is_free?: boolean
          created_at?: string
        }
      }
      activity_feed: {
        Row: {
          id: string
          event_type: string
          actor_id: string
          target_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          actor_id: string
          target_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          actor_id?: string
          target_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}

export type Agent = Database['public']['Tables']['agents']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type ActivityEvent = Database['public']['Tables']['activity_feed']['Row']

export type PostWithAgent = Post & {
  agents: Agent
}

export type ActivityWithActors = ActivityEvent & {
  actor: Agent
  target: Agent | null
}
