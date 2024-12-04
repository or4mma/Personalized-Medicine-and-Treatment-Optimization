import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let healthRecords: { [key: string]: any } = {}
let dataAccessPermissions: { [key: string]: boolean } = {}

// Mock contract functions
const updateHealthRecord = (sender: string, geneticData: string | null, medicalHistory: string | null, currentMedications: string[], allergies: string[]) => {
  const existingRecord = healthRecords[sender] || { geneticData: null, medicalHistory: null, currentMedications: [], allergies: [], lastUpdated: 0 }
  healthRecords[sender] = {
    geneticData: geneticData || existingRecord.geneticData,
    medicalHistory: medicalHistory || existingRecord.medicalHistory,
    currentMedications,
    allergies,
    lastUpdated: Date.now()
  }
  return { success: true }
}

const grantDataAccess = (sender: string, requester: string) => {
  dataAccessPermissions[`${sender}:${requester}`] = true
  return { success: true }
}

const revokeDataAccess = (sender: string, requester: string) => {
  dataAccessPermissions[`${sender}:${requester}`] = false
  return { success: true }
}

const getHealthRecord = (sender: string, patientId: string) => {
  if (sender === patientId || dataAccessPermissions[`${patientId}:${sender}`]) {
    return { success: true, value: healthRecords[patientId] }
  }
  return { success:false, error: 101 }
}

const checkDataAccess = (patientId: string, requester: string) => {
  return { success: true, value: dataAccessPermissions[`${patientId}:${requester}`] || false }
}

describe('Personal Health Data Management', () => {
  beforeEach(() => {
    healthRecords = {}
    dataAccessPermissions = {}
  })
  
  it('allows updating health record', () => {
    const result = updateHealthRecord('user1', 'ATCG...', 'Patient history...', ['Aspirin'], ['Peanuts'])
    expect(result.success).toBe(true)
    expect(healthRecords['user1']).toBeTruthy()
    expect(healthRecords['user1'].geneticData).toBe('ATCG...')
    expect(healthRecords['user1'].currentMedications).toContain('Aspirin')
  })
  
  it('allows granting data access', () => {
    const result = grantDataAccess('user1', 'doctor1')
    expect(result.success).toBe(true)
    expect(dataAccessPermissions['user1:doctor1']).toBe(true)
  })
  
  it('allows revoking data access', () => {
    grantDataAccess('user1', 'doctor1')
    const result = revokeDataAccess('user1', 'doctor1')
    expect(result.success).toBe(true)
    expect(dataAccessPermissions['user1:doctor1']).toBe(false)
  })
  
  it('allows authorized access to health records', () => {
    updateHealthRecord('user1', 'ATCG...', 'Patient history...', ['Aspirin'], ['Peanuts'])
    grantDataAccess('user1', 'doctor1')
    const result = getHealthRecord('doctor1', 'user1')
    expect(result.success).toBe(true)
    expect(result.value).toBeTruthy()
    expect(result.value.geneticData).toBe('ATCG...')
  })
  
  it('prevents unauthorized access to health records', () => {
    updateHealthRecord('user1', 'ATCG...', 'Patient history...', ['Aspirin'], ['Peanuts'])
    const result = getHealthRecord('doctor1', 'user1')
    expect(result.success).toBe(false)
    expect(result.error).toBe(101)
  })
})

