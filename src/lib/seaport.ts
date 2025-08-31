import { Seaport } from '@opensea/seaport-js'
import { ItemType } from '@opensea/seaport-js/lib/constants'
import { ethers } from 'ethers'
import { ENS_CONTRACTS, SEAPORT_CONTRACT, WETH_CONTRACT, ENSNFT, Listing, Offer } from '@/types'

export class ENSSeaport {
  private seaport: Seaport
  private provider: ethers.JsonRpcProvider
  private signer?: ethers.Signer

  constructor(provider: ethers.JsonRpcProvider, signer?: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.seaport = new Seaport(provider, {
      overrides: {
        contractAddress: SEAPORT_CONTRACT,
      }
    })
  }

  // Create a listing for an ENS NFT
  async createListing(
    nft: ENSNFT,
    price: string,
    currency: 'ETH' | 'WETH' = 'ETH'
  ): Promise<{ order: any; executeAllActions: () => Promise<any> }> {
    if (!this.signer) {
      throw new Error('Signer required for creating listings')
    }

    const offerer = await this.signer.getAddress()
    const startTime = Math.floor(Date.now() / 1000)
    const endTime = startTime + (30 * 24 * 60 * 60) // 30 days

    const { executeAllActions } = await this.seaport.createOrder({
      offer: [{
        itemType: ItemType.ERC721,
        token: nft.contractAddress,
        identifier: nft.tokenId,
      }],
      consideration: [{
        amount: ethers.parseEther(price).toString(),
        recipient: offerer,
        ...(currency === 'WETH' && {
          itemType: ItemType.ERC20,
          token: WETH_CONTRACT,
        }),
      }],
      startTime: startTime.toString(),
      endTime: endTime.toString(),
    }, offerer)

    return { order: null, executeAllActions }
  }

  // Create an offer for a listed ENS NFT
  async createOffer(
    listing: Listing,
    offerAmount: string,
    currency: 'ETH' | 'WETH' = 'ETH'
  ): Promise<{ order: any; executeAllActions: () => Promise<any> }> {
    if (!this.signer) {
      throw new Error('Signer required for creating offers')
    }

    const offerer = await this.signer.getAddress()

    const { executeAllActions } = await this.seaport.createOrder({
      offer: [{
        amount: ethers.parseEther(offerAmount).toString(),
        ...(currency === 'WETH' ? {
          itemType: ItemType.ERC20,
          token: WETH_CONTRACT,
        } : {
          itemType: ItemType.NATIVE,
        }),
      }],
      consideration: [{
        itemType: ItemType.ERC721,
        token: listing.nft.contractAddress,
        identifier: listing.nft.tokenId,
        recipient: offerer,
      }],
    }, offerer)

    return { order: null, executeAllActions }
  }

  // Fulfill a listing (buy now)
  async fulfillListing(
    listing: Listing
  ): Promise<{ executeAllActions: () => Promise<any> }> {
    if (!this.signer) {
      throw new Error('Signer required for fulfilling listings')
    }

    const fulfiller = await this.signer.getAddress()

                 const { executeAllActions } = await this.seaport.fulfillOrder({
               order: {
                 parameters: {
                   offerer: listing.seller,
                   zone: ethers.ZeroAddress,
                   offer: [{
                     itemType: ItemType.ERC721,
                     token: listing.nft.contractAddress,
                     identifierOrCriteria: listing.nft.tokenId,
                     startAmount: '1',
                     endAmount: '1',
                   }],
                   consideration: [{
                     itemType: listing.currency === 'WETH' ? ItemType.ERC20 : ItemType.NATIVE,
                     token: listing.currency === 'WETH' ? WETH_CONTRACT : ethers.ZeroAddress,
                     identifierOrCriteria: '0',
                     startAmount: ethers.parseEther(listing.price).toString(),
                     endAmount: ethers.parseEther(listing.price).toString(),
                     recipient: listing.seller,
                   }],
                   orderType: 0, // FULL_OPEN
                   startTime: listing.startTime.toString(),
                   endTime: listing.endTime.toString(),
                   zoneHash: ethers.ZeroHash,
                   salt: '0',
                   conduitKey: ethers.ZeroHash,
                   counter: '0',
                   totalOriginalConsiderationItems: 1, // Required field
                 },
                 signature: '0x', // Would need actual signature
               },
               accountAddress: fulfiller,
             })

    return { executeAllActions }
  }

  // Fulfill an offer (accept offer)
  async fulfillOffer(
    offer: Offer,
    listing: Listing
  ): Promise<{ executeAllActions: () => Promise<any> }> {
    if (!this.signer) {
      throw new Error('Signer required for fulfilling offers')
    }

    const fulfiller = await this.signer.getAddress()

                 const { executeAllActions } = await this.seaport.fulfillOrder({
               order: {
                 parameters: {
                   offerer: offer.buyer,
                   zone: ethers.ZeroAddress,
                   offer: [{
                     itemType: offer.currency === 'WETH' ? ItemType.ERC20 : ItemType.NATIVE,
                     token: offer.currency === 'WETH' ? WETH_CONTRACT : ethers.ZeroAddress,
                     identifierOrCriteria: '0',
                     startAmount: ethers.parseEther(offer.offerAmount).toString(),
                     endAmount: ethers.parseEther(offer.offerAmount).toString(),
                   }],
                   consideration: [{
                     itemType: ItemType.ERC721,
                     token: listing.nft.contractAddress,
                     identifierOrCriteria: listing.nft.tokenId,
                     startAmount: '1',
                     endAmount: '1',
                     recipient: offer.buyer,
                   }],
                   orderType: 0,
                   startTime: Math.floor(Date.now() / 1000).toString(),
                   endTime: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour
                   zoneHash: ethers.ZeroHash,
                   salt: '0',
                   conduitKey: ethers.ZeroHash,
                   counter: '0',
                   totalOriginalConsiderationItems: 1, // Required field
                 },
                 signature: '0x',
               },
               accountAddress: fulfiller,
             })

    return { executeAllActions }
  }

  // Cancel a listing
  async cancelListing(orderHash: string): Promise<any> {
    if (!this.signer) {
      throw new Error('Signer required for canceling listings')
    }

    const offerer = await this.signer.getAddress()

    return await this.seaport.cancelOrders([orderHash], offerer)
  }

  // Get order status
  async getOrderStatus(orderHash: string): Promise<{
    isValid: boolean
    isCancelled: boolean
    isFilled: boolean
  }> {
    try {
      const order = await this.seaport.getOrder(orderHash)
      return {
        isValid: !!order,
        isCancelled: false, // Would need to check contract state
        isFilled: false, // Would need to check contract state
      }
    } catch {
      return {
        isValid: false,
        isCancelled: false,
        isFilled: false,
      }
    }
  }

  // Estimate gas for a transaction
  async estimateGas(order: any): Promise<bigint> {
    try {
      const gasEstimate = await this.provider.estimateGas({
        to: SEAPORT_CONTRACT,
        data: '0x', // Would need actual transaction data
      })
      return gasEstimate
    } catch (error) {
      console.error('Gas estimation failed:', error)
      return 21000n // Default gas limit
    }
  }
}

// Utility functions for ENS-specific operations
export const isWrappedENS = (contractAddress: string): boolean => {
  return contractAddress.toLowerCase() === ENS_CONTRACTS.WRAPPED.toLowerCase()
}

export const isLegacyENS = (contractAddress: string): boolean => {
  return contractAddress.toLowerCase() === ENS_CONTRACTS.LEGACY.toLowerCase()
}

export const getENSContractType = (contractAddress: string): 'legacy' | 'wrapped' | 'unknown' => {
  if (isLegacyENS(contractAddress)) return 'legacy'
  if (isWrappedENS(contractAddress)) return 'wrapped'
  return 'unknown'
}

export const formatENSPrice = (price: string, decimals: number = 18): string => {
  try {
    return ethers.formatEther(price)
  } catch {
    return '0'
  }
}

export const parseENSPrice = (price: string): string => {
  try {
    return ethers.parseEther(price).toString()
  } catch {
    return '0'
  }
}

// Get ENS name from token ID (simplified - would need full ENS resolution)
export const getENSNameFromTokenId = async (
  tokenId: string,
  contractAddress: string,
  provider: ethers.JsonRpcProvider
): Promise<string | null> => {
  try {
    // This is a simplified version - in production you'd use the ENS Registry
    // and Name Resolver contracts to get the actual name
    const registry = new ethers.Contract(
      ENS_CONTRACTS.LEGACY,
      ['function owner(bytes32) view returns (address)'],
      provider
    )

    const namehash = ethers.keccak256(ethers.toUtf8Bytes('eth'))
    const owner = await registry.owner(namehash)

    if (owner === ethers.ZeroAddress) {
      return null
    }

    // In a real implementation, you'd reverse resolve the name
    // For now, return a placeholder
    return `${tokenId}.eth`
  } catch {
    return null
  }
}
