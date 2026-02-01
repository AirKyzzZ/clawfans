import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://claws.fans'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Dynamic agent pages
  try {
    const supabase = await createServiceClient()
    const { data: agentsData } = await supabase
      .from('agents')
      .select('twitter_handle, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)

    const agents = agentsData as { twitter_handle: string; created_at: string }[] | null

    const agentPages: MetadataRoute.Sitemap = (agents || []).map((agent) => ({
      url: `${baseUrl}/agent/${agent.twitter_handle}`,
      lastModified: new Date(agent.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...agentPages]
  } catch {
    return staticPages
  }
}
