const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const agreementStubs = require('../../stubs/agreement-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

const userExternalId = 'some-user-id'
const gatewayAccountId = 10
const gatewayAccountExternalId = 'gateway-account-id'
const serviceExternalId = 'service-id'

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({ userExternalId, serviceExternalId, gatewayAccountId }),
  gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
    gatewayAccountId,
    gatewayAccountExternalId,
    serviceExternalId,
    recurringEnabled: true
  })
]

const mockAgreements = [
  { external_id: 'a-valid-agreement-id', payment_instrument: false, status: 'CREATED' },
  { external_id: 'qgj1709v8t5mtlhd732otv19b1', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: '3sfh76mobld3tc87lc608q667b', payment_instrument: { card_details: { card_brand: 'master-card' } } },
  {
    external_id: 'm0spc7kmbo2ihlg602r9klgiqj',
    status: 'CANCELLED',
    payment_instrument: { card_details: { card_brand: 'american-express' } }
  },
  { external_id: 'a-valid-agreement-id-1', payment_instrument: { card_details: { card_brand: 'visa' } } },
  {
    external_id: 'a-valid-agreement-id-2',
    status: 'INACTIVE',
    payment_instrument: { card_details: { card_brand: 'visa' } }
  },
  { external_id: 'a-valid-agreement-id-3', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-4', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-5', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-6', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-7', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-8', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-9', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-10', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-11', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-12', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-13', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-14', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-15', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-16', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-17', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-18', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-19', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-20', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: 'a-valid-agreement-id-21', payment_instrument: { card_details: { card_brand: 'visa' } } }
]

describe('Agreements', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should correctly display agreements for a given service', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        agreements: mockAgreements
      })
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements')

    cy.get('#navigation-menu-agreements').should('have.length', 1)

    cy.get('h1').contains('Agreements')

    cy.get('[data-cy=filter-container]').should('exist')
    cy.get('[data-cy=status-select]').should('exist')
    cy.get('#status').get('label').contains('Status')
    cy.get('#status-hint').contains('Select an option')
    cy.get('#reference').get('label').contains('Reference number')
    cy.get('#reference-hint').contains('Enter full or partial reference')

    cy.get('#filter').should('exist')

    cy.get('[data-cy=pagination-form]').should('exist')

    cy.get('#agreements-list').should('exist')
    cy.get('#agreements-list thead').find('th').eq(0).should('have.text', 'ID')
    cy.get('#agreements-list thead').find('th').eq(1).should('have.text', 'Reference')
    cy.get('#agreements-list thead').find('th').eq(2).should('contain', 'Status')
    cy.get('#agreements-list thead').find('th').eq(3).should('contain', 'Payment instrument')
    cy.get('#agreements-list thead').find('th').eq(4).should('contain', 'Date created')
    cy.get('#agreements-list tbody').find('tr').should('have.length', 25)
  })

  const referenceFilter = 'a-valid-ref'
  const statusFilter = 'CREATED'

  it('should set and persist filters', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        agreements: mockAgreements
      }),
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        agreements: mockAgreements,
        filters: { status: statusFilter, reference: referenceFilter }
      }),
      agreementStubs.getLedgerAgreementsSuccess({
        page: 2,
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        agreements: mockAgreements,
        filters: { status: statusFilter, reference: referenceFilter }
      }),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountId,
        transactions: [
          { reference: 'payment-reference', amount: 1000, type: 'payment' },
          { reference: 'second-reference', amount: 20000, type: 'payment' }
        ],
        filters: {
          agreement_id: 'a-valid-agreement-id',
          display_size: 5
        }
      })
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements')
    cy.get('#reference').type(referenceFilter)
    cy.get('#status').select(statusFilter)
    cy.get('#filter').click()

    cy.get('#reference').should('have.value', referenceFilter)

    cy.log('Check pagination works and persists filters')
    cy.get('.pagination.2').first().click()
    cy.get('.pagination.2').first().should('have.class', 'active')
    cy.get('#reference').should('have.value', referenceFilter)
    cy.get('#status').should('have.value', statusFilter)

    cy.log('Load the details page and check the filters are preserved')
    cy.get('[data-action=update]').then((links) => links[0].click())
    cy.get('.govuk-heading-l').should('have.text', 'Agreement detail')
    cy.get('.govuk-back-link').should('have.attr', 'href')
      .and('include', 'page=2')
      .and('include', 'status=CREATED')
      .and('include', 'reference=a-valid-ref')

    cy.get('#payment-instrument-list').should('exist')
    cy.get('#empty-payment-instrument').should('not.exist')

    cy.get('.govuk-summary-list__value').contains('Test User')
    cy.get('.govuk-summary-list__value').contains('Reason shown to paying user for taking agreement')

    cy.get('.govuk-table__body').children().should('have.length', 2)
  })

  it('should show no agreements content if filters return nothing', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        agreements: []
      })
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements')

    cy.get('#results-empty').should('be.visible')
    cy.get('#agreements-list').should('not.exist')
  })
})
