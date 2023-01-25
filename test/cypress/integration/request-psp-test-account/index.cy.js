const userStubs = require('../../stubs/user-stubs')

describe('Request PSP test account: index', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceExternalId = 'afe452323dd04d1898672bfaba25e3a6'

  const buildServiceRoleForPspTestAccountStage = (goLiveStage, pspTestAccountStage) => {
    return {
      service: {
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage,
        gateway_account_ids: [gatewayAccountId],
        current_psp_test_account_stage: pspTestAccountStage
      }
    }
  }

  const setupStubs = (goLiveStage, pspTestAccountStage, permissions) => {
    const serviceRole = buildServiceRoleForPspTestAccountStage(goLiveStage, pspTestAccountStage)
    if (permissions) {
      serviceRole.role = {
        permissions: permissions
      }
    }
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithServiceRole({ userExternalId, serviceRole })
    ])
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('PSP test account stage is NOT_STARTED', () => {
    it('should show "Request PSP test account" form when service is not LIVE', () => {
      setupStubs('NOT_STARTED', 'NOT_STARTED')
      const requestStripeTestAccountUrl = `/service/${serviceExternalId}/request-stripe-test-account`
      cy.visit(requestStripeTestAccountUrl)

      cy.get('h1').should('contain', 'Request Stripe test account')
    })
    it('should show "Test account cannot be requested" when service is not LIVE', () => {
      setupStubs('NOT_STARTED', 'NOT_STARTED')
      const requestStripeTestAccountUrl = `/service/${serviceExternalId}/request-stripe-test-account`
      cy.visit(requestStripeTestAccountUrl)

      cy.get('h1').should('contain', 'Request Stripe test account')
    })
  })

  describe('PSP test account stage is REQUEST_SUBMITTED', () => {
    it('should show "Account already requested" page', () => {
      setupStubs('NOT_STARTED', 'REQUEST_SUBMITTED')
      const requestStripeTestAccountUrl = `/service/${serviceExternalId}/request-stripe-test-account`
      cy.visit(requestStripeTestAccountUrl)

      cy.get('h1').should('contain', 'Account already requested')
    })
  })

  describe('PSP test account stage is CREATED', () => {
    it('should show "Stripe test account already set up" page', () => {
      setupStubs('NOT_STARTED', 'CREATED')
      const requestStripeTestAccountUrl = `/service/${serviceExternalId}/request-stripe-test-account`
      cy.visit(requestStripeTestAccountUrl)

      cy.get('h1').should('contain', 'Stripe test account already set up')
    })
  })

  describe('User does not have the correct permissions', () => {
    beforeEach(() => {
      const serviceRole = buildServiceRoleForPspTestAccountStage('NOT_STARTED', 'NOT_STARTED')
      serviceRole.role = {
        permissions: []
      }
      setupStubs('NOT_STARTED', 'NOT_STARTED', [])
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestStripeTestAccountUrl = `/service/${serviceExternalId}/request-stripe-test-account`
      cy.visit(requestStripeTestAccountUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })
})
