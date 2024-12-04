import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let deviceRegistrations: { [key: string]: any } = {}
let healthMetrics: { [key: string]: any } = {}

// Mock contract functions
const registerDevice = (sender: string, deviceId: string, deviceType: string) => {
  deviceRegistrations[deviceId] = {
    owner: sender,
    deviceType,
    lastSynced: Date.now()
  }
  return { success: true }
}

const updateHealthMetrics = (sender: string, deviceId: string, heartRate: number[], steps: number, sleepHours: number) => {
  if (!deviceRegistrations[deviceId] || deviceRegistrations[deviceId].owner !== sender) {
    return { success: false, error: 101 }
  }
  healthMetrics[sender] = {
    heartRate,
    steps,
    sleepHours,
    lastUpdated: Date.now()
  }
  deviceRegistrations[deviceId].lastSynced = Date.now()
  return { success: true }
}

const getHealthMetrics = (sender: string, patientId: string) => {
  // Mock the personal-health-data contract's check-data-access function
  const accessAllowed = sender === patientId || sender === 'doctor1'
  if (!accessAllowed) {
    return { success: false, error: 101 }
  }
  return { success: true, value: healthMetrics[patientId] }
}

const getDeviceInfo = (deviceId: string) => {
  return { success: true, value: deviceRegistrations[deviceId] }
}

describe('Wearable Device Integration', () => {
  beforeEach(() => {
    deviceRegistrations = {}
    healthMetrics = {}
  })
  
  it('allows registering a device', () => {
    const result = registerDevice('user1', 'device1', 'smartwatch')
    expect(result.success).toBe(true)
    expect(deviceRegistrations['device1']).toBeTruthy()
    expect(deviceRegistrations['device1'].owner).toBe('user1')
    expect(deviceRegistrations['device1'].deviceType).toBe('smartwatch')
  })
  
  it('allows updating health metrics', () => {
    registerDevice('user1', 'device1', 'smartwatch')
    const result = updateHealthMetrics('user1', 'device1', [70, 72, 75, 71], 10000, 7)
    expect(result.success).toBe(true)
    expect(healthMetrics['user1']).toBeTruthy()
    expect(healthMetrics['user1'].heartRate).toEqual([70, 72, 75, 71])
    expect(healthMetrics['user1'].steps).toBe(10000)
    expect(healthMetrics['user1'].sleepHours).toBe(7)
  })
  
  it('prevents updating health metrics for unregistered devices', () => {
    const result = updateHealthMetrics('user1', 'unregistered_device', [70, 72, 75, 71], 10000, 7)
    expect(result.success).toBe(false)
    expect(result.error).toBe(101)
  })
  
  it('prevents updating health metrics for devices owned by others', () => {
    registerDevice('user1', 'device1', 'smartwatch')
    const result = updateHealthMetrics('user2', 'device1', [70, 72, 75, 71], 10000, 7)
    expect(result.success).toBe(false)
    expect(result.error).toBe(101)
  })
  
  it('allows retrieving health metrics for self', () => {
    registerDevice('user1', 'device1', 'smartwatch')
    updateHealthMetrics('user1', 'device1', [70, 72, 75, 71], 10000, 7)
    const result = getHealthMetrics('user1', 'user1')
    expect(result.success).toBe(true)
    expect(result.value).toBeTruthy()
    expect(result.value.heartRate).toEqual([70, 72, 75, 71])
    expect(result.value.steps).toBe(10000)
    expect(result.value.sleepHours).toBe(7)
  })
  
  it('allows authorized access to health metrics', () => {
    registerDevice('user1', 'device1', 'smartwatch')
    updateHealthMetrics('user1', 'device1', [70, 72, 75, 71], 10000, 7)
    const result = getHealthMetrics('doctor1', 'user1')
    expect(result.success).toBe(true)
    expect(result.value).toBeTruthy()
    expect(result.value.heartRate).toEqual([70, 72, 75, 71])
  })
  
  it('prevents unauthorized access to health metrics', () => {
    registerDevice('user1', 'device1', 'smartwatch')
    updateHealthMetrics('user1', 'device1', [70, 72, 75, 71], 10000, 7)
    const result = getHealthMetrics('user2', 'user1')
    expect(result.success).toBe(false)
    expect(result.error).toBe(101)
  })
  
  it('allows retrieving device information', () => {
    registerDevice('user1', 'device1', 'smartwatch')
    const result = getDeviceInfo('device1')
    expect(result.success).toBe(true)
    expect(result.value).toBeTruthy()
    expect(result.value.owner).toBe('user1')
    expect(result.value.deviceType).toBe('smartwatch')
  })
  
  it('returns undefined for non-existent devices', () => {
    const result = getDeviceInfo('non_existent_device')
    expect(result.success).toBe(true)
    expect(result.value).toBeUndefined()
  })
})
