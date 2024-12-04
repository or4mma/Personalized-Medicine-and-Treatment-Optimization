import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let sharedDataRecords: { [key: number]: any } = {}
let lastDataId = 0
let tokenBalances: { [key: string]: number } = {}

// Mock contract functions
const shareAnonymizedData = (sender: string, dataType: string, anonymizedData: string) => {
  lastDataId++
  sharedDataRecords[lastDataId] = {
    patientId: sender,
    dataType,
    anonymizedData,
    sharedAt: Date.now()
  }
  tokenBalances[sender] = (tokenBalances[sender] || 0) + 100
  return { success: true, value: lastDataId }
}

const rewardDataSharing = (sender: string, recipient: string, amount: number) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  tokenBalances[recipient] = (tokenBalances[recipient] || 0) + amount
  return { success: true }
}

const getSharedData = (dataId: number) => {
  return { success: true, value: sharedDataRecords[dataId] }
}

const getTokenBalance = (account: string) => {
  return { success: true, value: tokenBalances[account] || 0 }
}

describe('Health Data Sharing and Incentives', () => {
  beforeEach(() => {
    sharedDataRecords = {}
    lastDataId = 0
    tokenBalances = {}
  })
  
  it('allows sharing anonymized data', () => {
    const result = shareAnonymizedData('user1', 'genetic', 'ATCG...')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    expect(sharedDataRecords[1]).toBeTruthy()
    expect(sharedDataRecords[1].patientId).toBe('user1')
    expect(sharedDataRecords[1].dataType).toBe('genetic')
    expect(tokenBalances['user1']).toBe(100)
  })
  
  it('allows contract owner to reward data sharing', () => {
    const result = rewardDataSharing('contract-owner', 'user1', 500)
    expect(result.success).toBe(true)
    expect(tokenBalances['user1']).toBe(500)
  })
  
  it('prevents non-owner from rewarding data sharing', () => {
    const result = rewardDataSharing('user2', 'user1', 500)
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
    expect(tokenBalances['user1']).toBeUndefined()
  })
  
  it('allows retrieving shared data', () => {
    shareAnonymizedData('user1', 'genetic', 'ATCG...')
    const result = getSharedData(1)
    expect(result.success).toBe(true)
    expect(result.value).toBeTruthy()
    expect(result.value.patientId).toBe('user1')
    expect(result.value.dataType).toBe('genetic')
  })
  
  it('allows checking token balance', () => {
    shareAnonymizedData('user1', 'genetic', 'ATCG...')
    shareAnonymizedData('user1', 'medical-history', 'Patient history...')
    const result = getTokenBalance('user1')
    expect(result.success).toBe(true)
    expect(result.value).toBe(200)
  })
  
  it('returns zero balance for accounts with no tokens', () => {
    const result = getTokenBalance('user2')
    expect(result.success).toBe(true)
    expect(result.value).toBe(0)
  })
})

