import './globals.css'
import { RootProvider } from 'fumadocs-ui/provider'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    template: '%s | data-peek Docs',
    default: 'data-peek Documentation',
  },
  description: 'Documentation for data-peek - A fast, beautiful PostgreSQL client for developers',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.min.css"
        />
      </head>
      <body
        className="flex flex-col min-h-screen"
        style={{ fontFamily: '"Geist Mono", monospace' }}
      >
        <RootProvider
          theme={{
            enabled: true,
            defaultTheme: 'dark',
            enableSystem: false,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
