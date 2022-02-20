
;; ### charity-board ###

;; A charity board hosting several charity.
;; Any board can define their own requiremnt to accept a charity.
;; User entrust the board and can then donate to a particular charity or spread their donation to all accepted charity
;; The board can accepted new charity or remove current charity
;; The money given to a charity can only be withdraw by said chaarity and a charity can only be removed after its money has been sent to it.

;; CONST
(define-constant contract-owner tx-sender)
;; ERROR
(define-constant err-stx-transfer (err u99))
(define-constant err-owner-only (err u100))
(define-constant err-key-invalid (err u101))
(define-constant err-key-already-used (err u102))


;; DATA
(define-data-var n-charity uint u0)
(define-map charity-address (string-ascii 100) principal);; charity-name -> address
(define-data-var balance-total uint u0)
(define-map charity-balance (string-ascii 100)  uint );; charity-name -> balance

;;(asserts! (is-some (index-of (var-get members) tx-sender)) err-not-a-member)
;; private functions
;;

;; PUBLIC FUNCTION

;;Add new charity
(define-public (add-charity (name (string-ascii 100)) (address principal))
    (begin 
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (map-insert charity-address name address) err-key-already-used)
        (asserts! (map-insert charity-balance name u0) err-key-already-used)
        (var-set n-charity (+ (var-get n-charity) u1))
        (ok "Charity added")
    )
)

;;Remove charity 
(define-public (remove-charity (name (string-ascii 100)))
    (begin 
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (let (
            (balance (unwrap! (map-get? charity-balance name) err-key-invalid)))
            (if (> balance u0) (try! (withdraw name)) (print "TODO"))
            (map-delete charity-address name)
            (map-delete charity-balance name)
            (var-set n-charity (- (var-get n-charity) u1))
            (ok "Charity removed")
        )
    )
)

;;Donate
(define-public (donate (charity (string-ascii 100)) (amount uint)) 
    (let (
        (current-balance (unwrap! (map-get? charity-balance charity) err-key-invalid))
        (new-balance (+ current-balance amount)))
        (unwrap! (stx-transfer? amount tx-sender (as-contract tx-sender)) err-stx-transfer)
        (var-set balance-total (+ (var-get balance-total) amount))
        (map-set charity-balance charity new-balance)
        (ok "Donation successful! Thank you")
    )
)

(define-read-only (get-balance-total) 
    (ok (var-get balance-total))
)

(define-read-only (get-balance-charity (name (string-ascii 100))) 
    (ok (map-get? charity-balance name))
)

(define-read-only (get-number-charity) 
    (ok (var-get n-charity) )
)

(define-public (withdraw (name (string-ascii 100))) 
    (let (
        (balance-charity (unwrap! (map-get? charity-balance name) err-key-invalid))
        (address-charity (unwrap! (map-get? charity-address name) err-key-invalid)))
        (print address-charity)
        (print balance-charity)
        (unwrap! (as-contract (stx-transfer? balance-charity tx-sender address-charity)) err-stx-transfer)
        (var-set balance-total (- (var-get balance-total) balance-charity))
        (map-set charity-balance name u0)
        (ok "Withdraw successful")
    )
)