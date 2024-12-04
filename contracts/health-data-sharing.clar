;; Health Data Sharing and Incentives Contract

(define-fungible-token data-sharing-token)

(define-map shared-data-records
  { data-id: uint }
  {
    patient-id: principal,
    data-type: (string-ascii 64),
    anonymized-data: (buff 1024),
    shared-at: uint
  }
)

(define-data-var last-data-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u101))

(define-public (share-anonymized-data (data-type (string-ascii 64)) (anonymized-data (buff 1024)))
  (let
    ((new-id (+ (var-get last-data-id) u1)))
    (map-set shared-data-records
      { data-id: new-id }
      {
        patient-id: tx-sender,
        data-type: data-type,
        anonymized-data: anonymized-data,
        shared-at: block-height
      }
    )
    (var-set last-data-id new-id)
    (try! (ft-mint? data-sharing-token u100 tx-sender))
    (ok new-id)
  )
)

(define-public (reward-data-sharing (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ft-mint? data-sharing-token amount recipient)
  )
)

(define-read-only (get-shared-data (data-id uint))
  (map-get? shared-data-records { data-id: data-id })
)

(define-read-only (get-token-balance (account principal))
  (ok (ft-get-balance data-sharing-token account))
)

