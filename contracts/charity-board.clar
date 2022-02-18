
;; ### charity-board ###

;; A charity board hosting several charity.
;; Any board can define their own requiremnt to accept a charity.
;; User entrust the board and can then donate to a particular charity or spread their donation to all accepted charity
;; The board can accepted new charity or remove current charity
;; The money given to a charity can only be withdraw by said chaarity and a charity can only be removed after its money has been sent to it.

;; CONST
(define-constant ERR_STX_TRANSFER u0)
(define-constant ERR_ELSE u1)


;; DATA
(define-data-var n-charity uint u0)
(define-map charity-address { charity-name: (string-utf8 100) } { charity-address: principal })
(define-data-var balance-total uint u0)
(define-map charity-balance { charity-name: (string-utf8 100) } { balance: uint })


;; private functions
;;

;; PUBLIC FUNCTION

;;Add new charity
(define-public (add-charity (name (string-utf8 100)) (address principal))
    (begin  
        (map-insert charity-address {charity-name: name} {charity-address: address})
        (map-insert charity-balance {charity-name: name} {balance: u0})
        (ok "charity added")
    )
)

;;Remove charity 
;;TODO empty balance
(define-public (remove-charity (name (string-utf8 100)))
    (begin  
        (map-delete charity-address {charity-name: name} )
        (ok "charity removed")
    )
)
