import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  canonicalUrl?: string
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'ENS Marketplace',
  description = 'Trade ENS domains safely on Ethereum',
  canonicalUrl
}) => {
  const fullTitle = title.includes('ENS Marketplace')
    ? title
    : `${title} | ENS Marketplace`

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2997ff" />

        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ENS Marketplace" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />

        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Head>

      <div className="min-h-screen bg-black text-white font-sans">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ENS</span>
                </div>
                <span className="text-xl font-bold text-white">Marketplace</span>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-text-secondary hover:text-white transition-colors">
                  Browse
                </Link>
                <Link href="/listings" className="text-text-secondary hover:text-white transition-colors">
                  Listings
                </Link>
                <Link href="/portfolio" className="text-text-secondary hover:text-white transition-colors">
                  Portfolio
                </Link>
              </nav>

              {/* Wallet Connection */}
              <div className="flex items-center space-x-4">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted
                    const connected = ready && account && chain

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="btn btn-primary"
                              >
                                Connect Wallet
                              </button>
                            )
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="btn btn-error"
                              >
                                Wrong network
                              </button>
                            )
                          }

                          return (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={openChainModal}
                                className="btn btn-ghost text-sm"
                                type="button"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 16,
                                      height: 16,
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                      marginRight: 4,
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        style={{ width: 16, height: 16 }}
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                              </button>

                              <button
                                onClick={openAccountModal}
                                type="button"
                                className="btn btn-secondary"
                              >
                                {account.displayName}
                                {account.displayBalance
                                  ? ` (${account.displayBalance})`
                                  : ''}
                              </button>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-background-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">ENS</span>
                </div>
                <span className="text-text-secondary">ENS Marketplace</span>
              </div>

              <div className="flex items-center space-x-6 text-sm text-text-secondary">
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Docs
                </Link>
                <a
                  href="https://twitter.com/ensdomains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="https://discord.gg/ens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Discord
                </a>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border text-center text-xs text-text-secondary">
              <p>© 2024 ENS Marketplace. Built on Ethereum.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Layout
