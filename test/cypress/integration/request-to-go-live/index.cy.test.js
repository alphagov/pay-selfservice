const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Request to go live: index', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceExternalId = 'afe452323dd04d1898672bfaba25e3a6'

  const buildServiceRoleForGoLiveStage = (goLiveStage) => {
    return {
      service: {
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage,
        gateway_account_ids: [gatewayAccountId]
      }
    }
  }

  const setupStubs = (serviceRole) => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithServiceRole({ userExternalId, serviceRole }),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId })
    ])
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('User does not have the correct permissions', () => {
    beforeEach(() => {
      const serviceRole = buildServiceRoleForGoLiveStage('NOT_STARTED')
      serviceRole.role = {
        permissions: []
      }
      setupStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Request to go live stage NOT_STARTED', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('NOT_STARTED'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request a live account')
      cy.get('h1 + p').should('contain', 'Complete these steps to request a live account')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Start now')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-name`)
      })
    })
  })

  describe('Request to go live stage ENTERED_ORGANISATION_NAME', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request a live account')
      cy.get('h1 + p').should('contain', 'Complete these steps to request a live account')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('contain', 'In Progress')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-address`)
      })
    })
  })

  describe('Request to go live stage ENTERED_ORGANISATION_ADDRESS', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request a live account')
      cy.get('h1 + p').should('contain', 'Complete these steps to request a live account')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_STRIPE', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request a live account')
      cy.get('h1 + p').should('contain', 'Complete these steps to request a live account')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_WORLDPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_WORLDPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request a live account')
      cy.get('h1 + p').should('contain', 'Complete these steps to request a live account')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_GOV_BANKING_WORLDPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_GOV_BANKING_WORLDPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-index-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_SMARTPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_SMARTPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request a live account')
      cy.get('h1 + p').should('contain', 'Complete these steps to request a live account')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_EPDQ', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_EPDQ'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request a live account')
      cy.get('h1 + p').should('contain', 'Complete these steps to request a live account')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage TERMS_AGREED_STRIPE', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_STRIPE'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request submitted')

      cy.get('ul > li').should('contain', 'responsible person')
      cy.get('ul > li').should('contain', 'bank details')
      cy.get('ul > li').should('contain', 'VAT number')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('not.exist')
      cy.get('#request-to-go-live-step-choose-psp > h2').should('not.exist')
      cy.get('#request-to-go-live-step-agree-terms > h2').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage TERMS_AGREED_WORLDPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_WORLDPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request submitted')

      cy.get('ul > li').should('not.contain', 'responsible person')
      cy.get('ul > li').should('not.contain', 'bank details')
      cy.get('ul > li').should('not.contain', 'VAT number')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('not.exist')
      cy.get('#request-to-go-live-step-choose-psp > h2').should('not.exist')
      cy.get('#request-to-go-live-step-agree-terms > h2').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage TERMS_AGREED_GOV_BANKING_WORLDPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_GOV_BANKING_WORLDPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('h1').should('contain', 'Request submitted')
      cy.get('ul > li').should('not.contain', 'responsible person')
      cy.get('ul > li').should('not.contain', 'bank details')
      cy.get('ul > li').should('not.contain', 'VAT number')
    })
  })

  describe('Request to go live stage TERMS_AGREED_SMARTPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_SMARTPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request submitted')

      cy.get('ul > li').should('not.contain', 'responsible person')
      cy.get('ul > li').should('not.contain', 'bank details')
      cy.get('ul > li').should('not.contain', 'VAT number')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('not.exist')
      cy.get('#request-to-go-live-step-choose-psp > h2').should('not.exist')
      cy.get('#request-to-go-live-step-agree-terms > h2').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage TERMS_AGREED_EPDQ', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_EPDQ'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request submitted')

      cy.get('ul > li').should('not.contain', 'responsible person')
      cy.get('ul > li').should('not.contain', 'bank details')
      cy.get('ul > li').should('not.contain', 'VAT number')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('not.exist')
      cy.get('#request-to-go-live-step-choose-psp > h2').should('not.exist')
      cy.get('#request-to-go-live-step-agree-terms > h2').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage DENIED', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('DENIED'))
    })

    it('should show "Request to go live" page with an error', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('not.exist')

      cy.get('.next-steps-panel').should('not.exist')

      cy.get('.govuk-error-summary h2').should('contain', 'There is a problem')
      cy.get('.govuk-error-summary .govuk-error-summary__list a')
        .should('contain', 'Please contact GOV.UK Pay support')
        .and('have.attr', 'href')
        .and('eq', 'https://www.payments.service.gov.uk/support/')
    })
  })

  describe('Request to go live stage LIVE', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('LIVE'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('not.exist')

      cy.get('.next-steps-panel').should('not.exist')

      cy.get('#request-to-go-live-step-organisation-name > h2').should('exist')
      cy.get('#request-to-go-live-step-organisation-name > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-choose-psp > h2').should('exist')
      cy.get('#request-to-go-live-step-choose-psp > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-step-agree-terms > h2').should('exist')
      cy.get('#request-to-go-live-step-agree-terms > h2 > span').should('contain', 'Completed')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })
})
