export const AdyenTaskIdentifier = {
  ORG_DETAILS: 'adyen-org-details' as AdyenTaskIdentifier,
  LEGAL_TERMS: 'adyen-legal-terms' as AdyenTaskIdentifier,
  BANK_DETAILS: 'adyen-bank-details' as AdyenTaskIdentifier,
  RESPONSIBLE_PERSON: 'adyen-responsible-person' as AdyenTaskIdentifier,
  SERVICE_DIRECTOR: 'adyen-service-director' as AdyenTaskIdentifier,
  REASON_FOR_TAKING_PAYMENTS: 'adyen-reason' as AdyenTaskIdentifier,
} as const

export type AdyenTaskIdentifier =
  | 'adyen-org-details'
  | 'adyen-legal-terms'
  | 'adyen-bank-details'
  | 'adyen-responsible-person'
  | 'adyen-service-director'
  | 'adyen-reason'
