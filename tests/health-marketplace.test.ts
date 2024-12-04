import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let productListings: { [key: number]: any } = {}
let orders: { [key: number]: any } = {}
let lastProductId = 0
let lastOrderId = 0

// Mock contract functions
const listProduct = (seller: string, name: string, description: string, price: number, stock: number) => {
  lastProductId++
  productListings[lastProductId] = { seller, name, description, price, stock }
  return { success: true, value: lastProductId }
}

const updateProduct = (sender: string, productId: number, newPrice: number, newStock: number) => {
  if (!productListings[productId]) {
    return { success: false, error: 101 }
  }
  if (productListings[productId].seller !== sender) {
    return { success: false, error: 102 }
  }
  productListings[productId].price = newPrice
  productListings[productId].stock = newStock
  return { success: true }
}

const placeOrder = (buyer: string, productId: number, quantity: number) => {
  if (!productListings[productId] || productListings[productId].stock < quantity) {
    return { success: false, error: 101 }
  }
  lastOrderId++
  const totalPrice = productListings[productId].price * quantity
  orders[lastOrderId] = {
    buyer,
    productId,
    quantity,
    totalPrice,
    status: 'placed'
  }
  productListings[productId].stock -= quantity
  return { success: true, value: lastOrderId }
}

const getProduct = (productId: number) => {
  return { success: true, value: productListings[productId] }
}

const getOrder = (orderId: number) => {
  return { success: true, value: orders[orderId] }
}

describe('Personalized Health Marketplace', () => {
  beforeEach(() => {
    productListings = {}
    orders = {}
    lastProductId = 0
    lastOrderId = 0
  })
  
  it('allows listing a product', () => {
    const result = listProduct('seller1', 'Vitamin C', 'High-quality Vitamin C supplement', 1000, 100)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    expect(productListings[1]).toBeTruthy()
    expect(productListings[1].name).toBe('Vitamin C')
    expect(productListings[1].price).toBe(1000)
  })
  
  it('allows updating a product', () => {
    listProduct('seller1', 'Vitamin C', 'High-quality Vitamin C supplement', 1000, 100)
    const result = updateProduct('seller1', 1, 1200, 90)
    expect(result.success).toBe(true)
    expect(productListings[1].price).toBe(1200)
    expect(productListings[1].stock).toBe(90)
  })
  
  it('prevents unauthorized product updates', () => {
    listProduct('seller1', 'Vitamin C', 'High-quality Vitamin C supplement', 1000, 100)
    const result = updateProduct('seller2', 1, 1200, 90)
    expect(result.success).toBe(false)
    expect(result.error).toBe(102)
    expect(productListings[1].price).toBe(1000)
    expect(productListings[1].stock).toBe(100)
  })
  
  it('allows placing an order', () => {
    listProduct('seller1', 'Vitamin C', 'High-quality Vitamin C supplement', 1000, 100)
    const result = placeOrder('buyer1', 1, 5)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    expect(orders[1]).toBeTruthy()
    expect(orders[1].buyer).toBe('buyer1')
    expect(orders[1].quantity).toBe(5)
    expect(orders[1].totalPrice).toBe(5000)
    expect(productListings[1].stock).toBe(95)
  })
  
  it('prevents placing an order for insufficient stock', () => {
    listProduct('seller1', 'Vitamin C', 'High-quality Vitamin C supplement', 1000, 100)
    const result = placeOrder('buyer1', 1, 101)
    expect(result.success).toBe(false)
    expect(result.error).toBe(101)
    expect(productListings[1].stock).toBe(100)
  })
  
  it('allows retrieving product information', () => {
    listProduct('seller1', 'Vitamin C', 'High-quality Vitamin C supplement', 1000, 100)
    const result = getProduct(1)
    expect(result.success).toBe(true)
    expect(result.value).toBeTruthy()
    expect(result.value.name).toBe('Vitamin C')
    expect(result.value.price).toBe(1000)
  })
  
  it('allows retrieving order information', () => {
    listProduct('seller1', 'Vitamin C', 'High-quality Vitamin C supplement', 1000, 100)
    placeOrder('buyer1', 1, 5)
    const result = getOrder(1)
    expect(result.success).toBe(true)
    expect(result.value).toBeTruthy()
    expect(result.value.buyer).toBe('buyer1')
    expect(result.value.quantity).toBe(5)
    expect(result.value.totalPrice).toBe(5000)
  })
})

