
;; ### charity-board ###

;; A charity board hosting several charity.
;; Any board can define their own requiremnt to accept a charity.
;; User entrust the board and can then donate to a particular charity or spread their donation to all accepted charity
;; The board can accepted new charity or remove current charity
;; The money given to a charity can only be withdraw by said chaarity and a charity can only be removed after its money has been sent to it.

;; CONST
(define-constant ERR_STX_TRANSFER u99)
(define-constant ERR_ELSE u1)


;; DATA
(define-data-var n-charity uint u0)
(define-map charity-address (string-ascii 100) principal)
(define-data-var balance-total uint u0)
(define-map charity-balance (string-ascii 100)  uint );; charity-name -> balance


;; private functions
;;

;; PUBLIC FUNCTION

;;Add new charity
(define-public (add-charity (name (string-ascii 100)) (address principal))
    (begin  
        (map-insert charity-address name address)
        (map-insert charity-balance name u0)
        (ok "Charity added");;TODO insert fail
    )
)

;;Remove charity 
;;TODO empty balance
(define-public (remove-charity (name (string-ascii 100)))
    (begin  
        (map-delete charity-address name)
        (ok "Charity removed")
    )
)

;;Donate
(define-public (donate (charity (string-ascii 100)) (amount uint)) 
    (let (
        (old-amount (unwrap-panic (map-get? charity-balance charity)))
        (new-amount (+ old-amount amount)))
        (print new-amount)
        (unwrap! (stx-transfer? amount tx-sender (as-contract tx-sender)) (err ERR_STX_TRANSFER))
        (var-set balance-total (+ (var-get balance-total) amount))
        (map-set charity-balance charity new-amount)
        (ok "Donation successful! Thank you")
    )
)
(define-read-only (get-balance-total) 
    (ok (var-get balance-total))
)

(define-read-only (get-balance-charity (name (string-ascii 100))) 
    (ok (map-get? charity-balance name))
)

(define-public (withdraw (name (string-ascii 100))) 
    (let (
        (balance-charity (unwrap-panic (map-get? charity-balance name)))
        (address-charity (unwrap-panic (map-get? charity-address name))))
        (print address-charity)
        (print balance-charity)
        (unwrap! (as-contract (stx-transfer? balance-charity  tx-sender address-charity)) (err ERR_STX_TRANSFER))
        (var-set balance-total (- (var-get balance-total) balance-charity))
        (map-set charity-balance name u0)
        (ok "Withdraw successful")
    )

)