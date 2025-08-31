# ENS Marketplace Frontend

Next.js application for the ENS Marketplace.

## 🚀 **No Custom Contracts Needed!**

This marketplace uses **OpenSea's Seaport protocol** directly - no custom smart contracts required!

**How it works:**
1. **Seaport Contract**: Already deployed at `0x0000000000000068F116a894984e2DB1123eB395`
2. **Your Frontend**: Connects users to Seaport via `@opensea/seaport-js`
3. **ENS NFTs**: Work out-of-the-box since they're ERC-721 tokens

**Benefits:**
- ✅ Zero deployment costs for contracts
- ✅ Battle-tested security (OpenSea uses this)
- ✅ Compatible with all ENS domains
- ✅ Gas-efficient trading

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Backend API URL (Railway deployment URL)
NEXT_PUBLIC_API_URL=https://your-backend-api.up.railway.app

# Environment
NEXT_PUBLIC_ENVIRONMENT=production

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Sentry for error tracking (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Architecture

```
User Wallet → Your Frontend → Seaport Contract → ENS NFT Transfer
     ↑              ↑              ↑              ↑
  MetaMask      Next.js       Ethereum       ERC-721
  Rainbow       React         Mainnet        Token
  Coinbase      Wagmi
```
