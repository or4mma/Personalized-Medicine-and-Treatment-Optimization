;; Personal Health Data Management Contract

(define-map health-records
  { patient-id: principal }
  {
    genetic-data: (optional (buff 1024)),
    medical-history: (optional (string-utf8 10000)),
    current-medications: (list 20 (string-ascii 64)),
    allergies: (list 20 (string-ascii 64)),
    last-updated: uint
  }
)

(define-map data-access-permissions
  { patient-id: principal, requester: principal }
  { allowed: bool }
)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u101))
(define-constant err-invalid-data (err u102))

(define-public (update-health-record
  (genetic-data (optional (buff 1024)))
  (medical-history (optional (string-utf8 10000)))
  (current-medications (list 20 (string-ascii 64)))
  (allergies (list 20 (string-ascii 64))))
  (let
    ((existing-record (default-to
      { genetic-data: none, medical-history: none, current-medications: (list), allergies: (list), last-updated: u0 }
      (map-get? health-records { patient-id: tx-sender }))))
    (ok (map-set health-records
      { patient-id: tx-sender }
      {
        genetic-data: (if (is-some genetic-data) genetic-data (get genetic-data existing-record)),
        medical-history: (if (is-some medical-history) medical-history (get medical-history existing-record)),
        current-medications: current-medications,
        allergies: allergies,
        last-updated: block-height
      }
    ))
  )
)

(define-public (grant-data-access (requester principal))
  (ok (map-set data-access-permissions
    { patient-id: tx-sender, requester: requester }
    { allowed: true }
  ))
)

(define-public (revoke-data-access (requester principal))
  (ok (map-set data-access-permissions
    { patient-id: tx-sender, requester: requester }
    { allowed: false }
  ))
)

(define-read-only (get-health-record (patient-id principal))
  (let
    ((record (map-get? health-records { patient-id: patient-id }))
     (access-allowed (default-to false (get allowed (map-get? data-access-permissions { patient-id: patient-id, requester: tx-sender })))))
    (asserts! (or (is-eq tx-sender patient-id) access-allowed) err-unauthorized)
    (ok record)
  )
)

(define-read-only (check-data-access (patient-id principal) (requester principal))
  (ok (default-to false (get allowed (map-get? data-access-permissions { patient-id: patient-id, requester: requester }))))
)

