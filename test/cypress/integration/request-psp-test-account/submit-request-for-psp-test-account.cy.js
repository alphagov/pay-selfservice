const userStubs = require('../../stubs/user-stubs')
const serviceStubs = require('../../stubs/service-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const tokenStubs = require('../../stubs/token-stubs')

describe('Request PSP test account: submit request', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const sandboxGatewayAccountId = 42
  const serviceExternalId = 'afe452323dd04d1898672bfaba25e3a6'
  const requestStripeTestAccountUrl = `/service/${serviceExternalId}/request-stripe-test-account`
  const stripeGatewayAccountExternalId = 'a-stripe-gw-external-id'

  const setupStubs = (pspTestAccountStageFirstResponse, pspTestAccountStageSecondResponse) => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessRespondDifferentlySecondTime(userExternalId,
        {
          gatewayAccountId: sandboxGatewayAccountId,
          serviceExternalId,
          pspTestAccountStage: pspTestAccountStageFirstResponse
        },
        {
          gatewayAccountId: sandboxGatewayAccountId,
          serviceExternalId,
          pspTestAccountStage: pspTestAccountStageSecondResponse
        }
      ),
      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, { gateway_account_id: sandboxGatewayAccountId }),
      gatewayAccountStubs.requestStripeTestAccount(serviceExternalId, { gateway_account_external_id: stripeGatewayAccountExternalId }),
      gatewayAccountStubs.addGatewayAccountsToService(serviceExternalId),
      serviceStubs.patchUpdateServicePspTestAccountStage({ serviceExternalId, gatewayAccountId: sandboxGatewayAccountId, pspTestAccountStage: 'REQUEST_SUBMITTED' }),
      tokenStubs.revokeTokensForAccount(sandboxGatewayAccountId)
    ])
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe.only('PSP test account stage is NOT_STARTED', () => {
    it('should submit request for Stripe test account', () => {
      setupStubs('NOT_STARTED', 'NOT_STARTED')
      cy.visit(requestStripeTestAccountUrl)

      cy.get('button').contains('Get a Stripe test account').click()

      cy.get('h1').should('contain', 'Thanks for requesting a Stripe test account')
    })
  })

  describe('PSP test account stage is REQUEST_SUBMITTED', () => {
    it('should show "Account already requested" page', () => {
      setupStubs('NOT_STARTED', 'REQUEST_SUBMITTED')
      cy.visit(requestStripeTestAccountUrl)

      cy.get('button').contains('Submit request').click()
      cy.get('h1').should('contain', 'Account already requested')
    })
  })

  describe('PSP test account stage is CREATED', () => {
    it('should show "Stripe test account already set up" page', () => {
      setupStubs('NOT_STARTED', 'CREATED')
      cy.visit(requestStripeTestAccountUrl)

      cy.get('button').contains('Submit request').click()
      cy.get('h1').should('contain', 'Stripe test account already set up')
    })
  })
})
