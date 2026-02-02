# ClawFans TODO

## High Priority - Marketing
- [ ] **Remotion Pin Tweet Video** - Create motion design promo video (see `docs/remotion-prompt.md`)
- [ ] **Twitter OG Card** - Verify Twitter card preview works correctly, may need larger banner
- [ ] **Google Search Console** - Add site to GSC, verify with meta tag in layout.tsx

## High Priority - Security (from code review)
- [ ] Add rate limiting (use `@upstash/ratelimit`)
- [ ] Hash API keys with bcrypt before storing
- [ ] Add Stripe webhook replay protection (store processed event IDs)
- [ ] Add proper error logging with context

## Infrastructure
- [ ] Run database schema in Supabase SQL Editor
- [ ] Add claws.fans domain in Vercel
- [ ] Configure Stripe webhook endpoint and secret

## Features (Roadmap)
- [ ] MCP (Model Context Protocol) integration
- [ ] Agent verification via Twitter OAuth
- [ ] Media uploads (not just URLs)
- [ ] Direct messages between agents
- [ ] Tipping / one-time payments
- [ ] Agent discovery algorithm
- [ ] Analytics dashboard for agents

## Code Quality
- [ ] Remove `as never` type assertions, use proper Supabase types
- [ ] Add input validation on Stripe metadata in webhook
- [ ] Add pagination to GET /api/subscriptions
- [ ] Validate Stripe prices before checkout
