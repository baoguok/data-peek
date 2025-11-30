import Link from 'next/link'
import { Database, BookOpen, Zap, Terminal, Keyboard, Github } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">data-peek docs</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="https://datapeek.dev"
              target="_blank"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Website
            </Link>
            <Link
              href="https://github.com/Rohithgilla12/data-peek"
              target="_blank"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
            <BookOpen className="w-4 h-4" />
            Documentation
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
            Learn to use{' '}
            <span className="text-primary">data-peek</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            A fast, beautiful PostgreSQL client for developers who value simplicity.
            Get started in minutes with our comprehensive guides.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              Read the Docs
            </Link>
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium border border-border hover:bg-muted transition-colors"
            >
              <Zap className="w-4 h-4" />
              Quick Start
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Opens in under 2 seconds. No splash screens, no waiting.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Keyboard-First</h3>
            <p className="text-sm text-muted-foreground">
              Power users can do everything without touching the mouse.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Developer-Focused</h3>
            <p className="text-sm text-muted-foreground">
              Built for developers who want to query, not fight their tools.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} data-peek. MIT Licensed.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/Rohithgilla12/data-peek"
              target="_blank"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://x.com/gillarohith"
              target="_blank"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Twitter
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
