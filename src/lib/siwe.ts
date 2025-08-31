import { SiweMessage } from 'siwe'
import { ethers } from 'ethers'

export interface AuthState {
  address?: string
  ensName?: string
  isAuthenticated: boolean
  isLoading: boolean
  error?: string
}

export const createSiweMessage = (address: string, statement = 'Sign in to ENS Marketplace') => {
  const domain = typeof window !== 'undefined' ? window.location.host : 'localhost'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const message = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: 1,
    nonce: generateNonce(),
  })

  return message
}

export const signInWithEthereum = async (signer: ethers.Signer): Promise<{
  message: SiweMessage
  signature: string
  success: boolean
}> => {
  try {
    const address = await signer.getAddress()
    const message = createSiweMessage(address)
    const signature = await signer.signMessage(message.prepareMessage())

    // Verify the signature
    const verified = await message.verify({ signature })

    if (!verified.success) {
      throw new Error('Signature verification failed')
    }

    return {
      message,
      signature,
      success: true
    }
  } catch (error) {
    console.error('SIWE sign-in error:', error)
    return {
      message: null as any,
      signature: '',
      success: false
    }
  }
}

export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

export const getAuthHeaders = (signature: string, message: SiweMessage) => {
  return {
    'Authorization': `Bearer ${btoa(JSON.stringify({ signature, message: message.prepareMessage() }))}`,
    'Content-Type': 'application/json'
  }
}

export const verifyAuthToken = async (token: string): Promise<boolean> => {
  try {
    // In a real implementation, you'd send this to your backend for verification
    // For now, we'll just check if it's a valid JWT-like structure
    const decoded = JSON.parse(atob(token.split('.')[1]))
    return !!decoded.address
  } catch {
    return false
  }
}

export const getStoredAuth = (): { signature?: string; message?: SiweMessage } | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('ens-marketplace-auth')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const storeAuth = (signature: string, message: SiweMessage) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('ens-marketplace-auth', JSON.stringify({
      signature,
      message: message.toMessage(),
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Failed to store auth:', error)
  }
}

export const clearAuth = () => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('ens-marketplace-auth')
  } catch (error) {
    console.error('Failed to clear auth:', error)
  }
}

export const isAuthExpired = (): boolean => {
  if (typeof window === 'undefined') return true

  try {
    const stored = localStorage.getItem('ens-marketplace-auth')
    if (!stored) return true

    const auth = JSON.parse(stored)
    const expiryTime = 24 * 60 * 60 * 1000 // 24 hours
    return Date.now() - auth.timestamp > expiryTime
  } catch {
    return true
  }
}
