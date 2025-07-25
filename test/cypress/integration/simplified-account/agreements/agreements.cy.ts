import userStubs from '@test/cypress/stubs/user-stubs'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import agreementStubs from '@test/cypress/stubs/agreement-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import {
  checkServiceNavigation,
  checkTitleAndHeading,
} from '@test/cypress/integration/simplified-account/common/assertions'

const USER_EXTERNAL_ID = 'user456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const AGREEMENTS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/agreements`

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({
    userExternalId: USER_EXTERNAL_ID,
    serviceExternalId: SERVICE_EXTERNAL_ID,
    gatewayAccountId: GATEWAY_ACCOUNT_ID,
    serviceName: SERVICE_NAME,
  }),
  gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, GatewayAccountType.TEST, {
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
    recurring_enabled: true,
  }),
]

const mockAgreements = [
  { external_id: 'a-valid-agreement-id', payment_instrument: false, status: 'CREATED' },
  { external_id: 'qgj1709v8t5mtlhd732otv19b1', payment_instrument: { card_details: { card_brand: 'visa' } } },
  { external_id: '3sfh76mobld3tc87lc608q667b', payment_instrument: { card_details: { card_brand: 'master-card' } } },
  {
    external_id: 'm0spc7kmbo2ihlg602r9klgiqj',
    status: 'CANCELLED',
    payment_instrument: { card_details: { card_brand: 'american-express' } },
  },
  { external_id: 'a-valid-agreement-id-1', payment_instrument: { card_details: { card_brand: 'visa' } } },
  {
    external_id: 'a-valid-agreement-id-2',
    status: 'INACTIVE',
    payment_instrument: { card_details: { card_brand: 'visa' } },
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
  { external_id: 'a-valid-agreement-id-21', payment_instrument: { card_details: { card_brand: 'visa' } } },
]

describe('Agreements', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('accessibility check', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: SERVICE_EXTERNAL_ID,
        live: false,
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        agreements: mockAgreements,
      }),
    ])
    cy.visit(AGREEMENTS_URL)
    cy.a11yCheck()
  })

  it('should correctly display agreements for a given service', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: SERVICE_EXTERNAL_ID,
        live: false,
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        agreements: mockAgreements,
      }),
    ])

    cy.visit(AGREEMENTS_URL)

    checkServiceNavigation('Agreements', AGREEMENTS_URL)
    checkTitleAndHeading('Agreements', SERVICE_NAME.en)

    cy.get('h1').contains('Agreements')

    cy.get('[data-cy=filter-container]').should('exist')
    // cy.get('[data-cy=status-select]').should('exist')
    cy.get('#status').get('label').contains('Status')
    cy.get('#status-hint').contains('Select an option')
    cy.get('#reference').get('label').contains('Reference number')
    cy.get('#reference-hint').contains('Enter full or partial reference')

    cy.get('#filter').should('exist')

    cy.get('.govuk-pagination').should('exist')

    cy.get('#agreements-list').should('exist')
    cy.get('#agreements-list thead').find('th').eq(0).should('have.text', 'ID')
    cy.get('#agreements-list thead').find('th').eq(1).should('have.text', 'Reference number')
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
        service_id: SERVICE_EXTERNAL_ID,
        live: false,
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        agreements: mockAgreements,
      }),
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: SERVICE_EXTERNAL_ID,
        live: false,
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        agreements: mockAgreements,
        filters: { status: statusFilter, reference: referenceFilter },
      }),
      agreementStubs.getLedgerAgreementsSuccess({
        page: 2,
        service_id: SERVICE_EXTERNAL_ID,
        live: false,
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        agreements: mockAgreements,
        filters: { status: statusFilter, reference: referenceFilter },
      }),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: SERVICE_EXTERNAL_ID,
        live: false,
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        external_id: 'a-valid-agreement-id',
      }),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactions: [
          { reference: 'payment-reference', amount: 1000, type: 'payment' },
          { reference: 'second-reference', amount: 20000, type: 'payment' },
        ],
        filters: {
          agreement_id: 'a-valid-agreement-id',
          display_size: 5,
        },
      }),
    ])

    cy.visit(AGREEMENTS_URL)
    cy.get('#reference').type(referenceFilter)
    cy.get('#status').select(statusFilter)
    cy.get('#filter').click()

    cy.get('#reference').should('have.value', referenceFilter)

    cy.log('Check pagination works and persists filters')
    cy.get('.govuk-pagination__item').contains('1').parent().should('have.class', 'govuk-pagination__item--current')
    cy.get('.govuk-pagination__item').contains('2').click()
    cy.get('.govuk-pagination__item').contains('2').parent().should('have.class', 'govuk-pagination__item--current')
    cy.get('#reference').should('have.value', referenceFilter)
    cy.get('#status').should('have.value', statusFilter)

    // todo navigate to agreement detail
  })

  it('should show no agreements content if filters return nothing', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementsSuccess({
        service_id: SERVICE_EXTERNAL_ID,
        live: false,
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        agreements: [],
      }),
    ])

    cy.visit(AGREEMENTS_URL)

    cy.get('#results-empty').should('be.visible')
    cy.get('#agreements-list').should('not.exist')
  })
})
