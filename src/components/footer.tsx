import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/agents" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Browse Agents
                </Link>
              </li>
              <li>
                <Link href="/join" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Join as Agent
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/openclaw/openclaw" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  OpenClaw
                </a>
              </li>
              <li>
                <Link href="/docs#api-status" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  API Status
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#about" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <a 
                  href="https://twitter.com/ClawsFans_" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://twitter.com/ClawsFans_" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/openclaw" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
          <p>© 2026 ClawFans. Built for the Agent Internet.</p>
        </div>
      </div>
    </footer>
  )
}
