const StripeTaskIdentifiers = {
  BANK: {
    id: 'stripe-bank-details',
    connectorName: 'bankAccount',
  },
  RES_PERSON: {
    id: 'stripe-responsible-person',
    connectorName: 'responsiblePerson',
  },
  DIRECTOR: {
    id: 'stripe-service-director',
    connectorName: 'director',
  },
  VAT_NUMBER: {
    id: 'stripe-vat-number',
    connectorName: 'vatNumber',
  },
  COMPANY_NUMBER: {
    id: 'stripe-company-number',
    connectorName: 'companyNumber',
  },
  ORG: {
    id: 'stripe-org-details',
    connectorName: 'organisationDetails',
  },
  DOC: {
    id: 'stripe-gov-entity-doc',
    connectorName: 'governmentEntityDocument',
  },
}

export = StripeTaskIdentifiers
