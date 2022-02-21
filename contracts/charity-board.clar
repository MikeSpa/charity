
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
(define-map donors principal uint)

;;(asserts! (is-some (index-of (var-get members) tx-sender)) err-not-a-member)
;; private functions
;;

;; PUBLIC FUNCTION

;;Add new charity
;; #[allow(unchecked_data)]
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
            (new-balance (+ current-balance amount))
            (opt-cur-don-amt (map-get? donors tx-sender))
            ;; (current-donation-amount (if (is-some opt-cur-don-amt) (unwrap! opt-cur-don-amt (err u1)) u0));;there must be a better way to do that shit
            ;; (current-donation-amount (match opt-cur-don-amt value (unwrap! opt-cur-don-amt (err u1)) u0));;somewhat better but still ugly
            (current-donation-amount (match opt-cur-don-amt value (unwrap-panic opt-cur-don-amt) u0));;somewhat better but still ugly

            )
        (unwrap! (stx-transfer? amount tx-sender (as-contract tx-sender)) err-stx-transfer)
        (var-set balance-total (+ (var-get balance-total) amount))
        (map-set charity-balance charity new-balance)
        ;; (print(+ current-donation-amount amount))
        (map-set donors tx-sender (+ current-donation-amount amount))
        (ok "Donation successful! Thank you")
    )
)

;;Withdraw
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

(define-read-only (get-balance-total) 
    (ok (var-get balance-total))
)

(define-read-only (get-balance-charity (name (string-ascii 100))) 
    (ok (map-get? charity-balance name))
)

(define-read-only (get-number-charity) 
    (ok (var-get n-charity) )
)

(define-read-only (get-donor-amount (donor-name principal))
    (ok (unwrap! (map-get? donors donor-name) err-key-invalid))
)
