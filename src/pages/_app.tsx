import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiConfig, rainbowKitConfig } from '@/lib/wagmi'
import '@rainbow-me/rainbowkit/styles.css'
import Head from 'next/head'
import { useState } from 'react'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useState(() => {
    setMounted(true)
  })

  if (!mounted) {
    return null
  }

  return (
    <>
      <Head>
        <title>ENS Marketplace</title>
        <meta name="description" content="Trade ENS domains safely on Ethereum" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider {...rainbowKitConfig}>
            <Component {...pageProps} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  )
}
