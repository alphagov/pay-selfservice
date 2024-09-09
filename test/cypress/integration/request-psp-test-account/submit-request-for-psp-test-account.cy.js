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

  describe('PSP test account stage is NOT_STARTED', () => {
    it('should submit request for Stripe test account', () => {
      setupStubs('NOT_STARTED', 'NOT_STARTED')
      cy.visit(requestStripeTestAccountUrl)

      cy.get('button').contains('Get a Stripe test account').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${stripeGatewayAccountExternalId}/dashboard`)
      })
    })

    it('should show the loading spinner when the submit button is clicked', () => {
      setupStubs('NOT_STARTED', 'NOT_STARTED')
      cy.visit(requestStripeTestAccountUrl)

      cy.get('form').then(form$ => {
        form$.on('submit', e => {
          e.preventDefault()
        })
      })

      cy.get('button').contains('Get a Stripe test account').click()

      cy.get('#spinner-container').should('be.visible')
    })
  })
})
