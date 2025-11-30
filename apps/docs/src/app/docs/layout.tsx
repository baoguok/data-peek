import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { source } from '@/lib/source'
import { Database } from 'lucide-react'
import Link from 'next/link'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Database className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold">data-peek</span>
          </Link>
        ),
        transparentMode: 'top',
      }}
      sidebar={{
        defaultOpenLevel: 1,
        collapsible: true,
      }}
      links={[
        {
          text: 'Website',
          url: 'https://datapeek.dev',
          external: true,
        },
        {
          text: 'GitHub',
          url: 'https://github.com/Rohithgilla12/data-peek',
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  )
}
