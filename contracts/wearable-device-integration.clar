;; Wearable Device Integration Contract

(define-map device-registrations
  { device-id: (buff 32) }
  {
    owner: principal,
    device-type: (string-ascii 64),
    last-synced: uint
  }
)

(define-map health-metrics
  { patient-id: principal }
  {
    heart-rate: (list 24 uint),
    steps: uint,
    sleep-hours: uint,
    last-updated: uint
  }
)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u101))

(define-public (register-device (device-id (buff 32)) (device-type (string-ascii 64)))
  (ok (map-set device-registrations
    { device-id: device-id }
    {
      owner: tx-sender,
      device-type: device-type,
      last-synced: block-height
    }
  ))
)

(define-public (update-health-metrics (device-id (buff 32)) (heart-rate (list 24 uint)) (steps uint) (sleep-hours uint))
  (let
    ((device (unwrap! (map-get? device-registrations { device-id: device-id }) err-unauthorized)))
    (asserts! (is-eq (get owner device) tx-sender) err-unauthorized)
    (map-set health-metrics
      { patient-id: tx-sender }
      {
        heart-rate: heart-rate,
        steps: steps,
        sleep-hours: sleep-hours,
        last-updated: block-height
      }
    )
    (map-set device-registrations
      { device-id: device-id }
      (merge device { last-synced: block-height })
    )
    (ok true)
  )
)

(define-read-only (get-health-metrics (patient-id principal))
  (let
    ((access-allowed (unwrap! (contract-call? .personal-health-data check-data-access patient-id tx-sender) err-unauthorized)))
    (asserts! (or (is-eq tx-sender patient-id) access-allowed) err-unauthorized)
    (ok (map-get? health-metrics { patient-id: patient-id }))
  )
)

(define-read-only (get-device-info (device-id (buff 32)))
  (map-get? device-registrations { device-id: device-id })
)

