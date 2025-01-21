const {
  setupStubs,
  USER_EXTERNAL_ID,
  SERVICE_EXTERNAL_ID,
  ACCOUNT_TYPE
} = require('@test/cypress/integration/simplified-account/service-settings/card-payments/util')

const baseUrl = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/card-payments`

describe('Card payment updates', () => {
  beforeEach(() => {
    cy.task('clearStubs')
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('should allow update of Collect billing address', () => {
    setupStubs()
    cy.visit(baseUrl + '/collect-billing-address')
    cy.get('h1').should('contain.text', 'Billing address')
  })
})
