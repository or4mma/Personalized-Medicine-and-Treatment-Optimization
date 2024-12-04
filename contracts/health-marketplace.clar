;; Personalized Health Marketplace Contract

(define-map product-listings
  { product-id: uint }
  {
    seller: principal,
    name: (string-ascii 64),
    description: (string-utf8 256),
    price: uint,
    stock: uint
  }
)

(define-map orders
  { order-id: uint }
  {
    buyer: principal,
    product-id: uint,
    quantity: uint,
    total-price: uint,
    status: (string-ascii 20)
  }
)

(define-data-var last-product-id uint u0)
(define-data-var last-order-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))

(define-public (list-product (name (string-ascii 64)) (description (string-utf8 256)) (price uint) (stock uint))
  (let
    ((new-id (+ (var-get last-product-id) u1)))
    (map-set product-listings
      { product-id: new-id }
      {
        seller: tx-sender,
        name: name,
        description: description,
        price: price,
        stock: stock
      }
    )
    (var-set last-product-id new-id)
    (ok new-id)
  )
)

(define-public (update-product (product-id uint) (new-price uint) (new-stock uint))
  (let
    ((listing (unwrap! (map-get? product-listings { product-id: product-id }) err-not-found)))
    (asserts! (is-eq (get seller listing) tx-sender) err-unauthorized)
    (ok (map-set product-listings
      { product-id: product-id }
      (merge listing { price: new-price, stock: new-stock })
    ))
  )
)

(define-public (place-order (product-id uint) (quantity uint))
  (let
    ((listing (unwrap! (map-get? product-listings { product-id: product-id }) err-not-found))
     (total-price (* (get price listing) quantity))
     (new-id (+ (var-get last-order-id) u1)))
    (asserts! (<= quantity (get stock listing)) err-not-found)
    (try! (stx-transfer? total-price tx-sender (get seller listing)))
    (map-set orders
      { order-id: new-id }
      {
        buyer: tx-sender,
        product-id: product-id,
        quantity: quantity,
        total-price: total-price,
        status: "placed"
      }
    )
    (map-set product-listings
      { product-id: product-id }
      (merge listing { stock: (- (get stock listing) quantity) })
    )
    (var-set last-order-id new-id)
    (ok new-id)
  )
)

(define-read-only (get-product (product-id uint))
  (map-get? product-listings { product-id: product-id })
)

(define-read-only (get-order (order-id uint))
  (map-get? orders { order-id: order-id })
)
