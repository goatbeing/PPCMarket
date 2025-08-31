// ENS Marketplace Types

export interface ENSNFT {
  id: string
  name: string
  tokenId: string
  contractAddress: string
  isWrapped: boolean
  owner: string
  expiryDate?: string
  registrationDate?: string
  avatar?: string
  resolver?: string
}

export interface Listing {
  id: string
  nft: ENSNFT
  seller: string
  price: string
  currency: 'ETH' | 'WETH'
  startTime: number
  endTime: number
  isActive: boolean
  orderHash?: string
  createdAt: string
}

export interface Offer {
  id: string
  listingId: string
  buyer: string
  offerAmount: string
  currency: 'ETH' | 'WETH'
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  orderHash?: string
  createdAt: string
  expiresAt?: string
}

export interface User {
  address: string
  ensName?: string
  avatar?: string
  isVerified?: boolean
}

export interface Transaction {
  hash: string
  type: 'listing' | 'offer' | 'fulfillment' | 'cancel'
  from: string
  to?: string
  amount?: string
  currency?: string
  nft?: ENSNFT
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

export interface SeaportOrder {
  parameters: {
    offerer: string
    zone: string
    offer: Array<{
      itemType: number
      token: string
      identifierOrCriteria: string
      startAmount: string
      endAmount: string
    }>
    consideration: Array<{
      itemType: number
      token: string
      identifierOrCriteria: string
      startAmount: string
      endAmount: string
      recipient: string
    }>
    orderType: number
    startTime: string
    endTime: string
    zoneHash: string
    salt: string
    conduitKey: string
    counter: string
  }
  signature: string
}

// ENS Contract Addresses
export const ENS_CONTRACTS = {
  LEGACY: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  WRAPPED: '0xD4416b13d2b3a9ABae7AcD5D6C2bBDdbe25686401',
  REGISTRAR: '0x253553366Da8546fC250F225fe3d25d0C78230390',
} as const

// Seaport Constants
export const SEAPORT_CONTRACT = '0x0000000000000068F116a894984e2DB1123eB395'

// WETH Contract
export const WETH_CONTRACT = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
