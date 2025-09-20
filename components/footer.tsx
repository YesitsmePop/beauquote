export function Footer() {
  return (
    <footer className="border-t border-border/20 bg-background/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="BeauQuote" className="w-6 h-6 rounded object-cover" />
              <span className="font-bold">BeauQuote</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Challenge your mind with encrypted wisdom from history's greatest thinkers.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Game</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  This is a
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Very Simple
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  And Fun Game
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  We do not
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Have a very
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Large Community
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  If you like
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  What you see
                </a>
              </li>
              <li>
                <a href="https://m-dev-links.vercel.app/" className="hover:text-primary transition-colors">
                  Click the link that I be
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2025 BeauQuote. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
