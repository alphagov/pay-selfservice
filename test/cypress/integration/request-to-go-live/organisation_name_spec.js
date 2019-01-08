describe('Request to go live: organisation name', () => {
  const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
  const gatewayAccountId = 666
  const serviceExternalId = 'cp5wa'

  beforeEach(() => {
    cy.task('getCookies', {
      user_external_id: userExternalId,
      gateway_account_id: gatewayAccountId
    }).then(cookies => {
      cy.setCookie('session', cookies.encryptedSessionCookie)
      cy.setCookie('gateway_account', cookies.encryptedGatewayAccountCookie)
    })
  })

  describe('NO PERMISSIONS', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        {
          name: 'getUserSuccess',
          opts: {
            external_id: userExternalId,
            service_roles: [{
              service: {
                external_id: serviceExternalId,
                current_go_live_stage: 'NOT_STARTED',
                gateway_account_ids: [gatewayAccountId]
              },
              role: {
                permissions: []
              }
            }]
          }
        },
        {
          name: 'getGatewayAccountSuccess',
          opts: { gateway_account_id: gatewayAccountId }
        }
      ])
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED', () => {
    const organisationName = 'Government Digital Service'

    beforeEach(() => {
      cy.task('setupStubs', [
        {
          name: 'getUserSuccess',
          opts: {
            external_id: userExternalId,
            service_roles: [{
              service: {
                external_id: serviceExternalId,
                current_go_live_stage: 'NOT_STARTED',
                gateway_account_ids: [gatewayAccountId],
                merchant_details: {
                  name: organisationName
                }
              }
            }]
          }
        },
        {
          name: 'getGatewayAccountSuccess',
          opts: { gateway_account_id: gatewayAccountId }
        }
      ])
    })

    it('should show "Request to go live: organisation name" page correctly with pre-filled organisation name', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', organisationName)

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-name`)
      })
    })

    it('should show an error when blank name is submitted on "Request to go live: organisation name" page', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').clear()

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'What is the name of your organisation?')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#request-to-go-live-organisation-name-input')

      cy.get('input#request-to-go-live-organisation-name-input').should('have.class', 'govuk-input--error')
      cy.get('span#request-to-go-live-organisation-name-input-error').should('contain', 'Please enter a valid name')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-name`)
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_WRONG_STAGE', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        {
          name: 'getUserSuccess',
          opts: {
            external_id: userExternalId,
            service_roles: [{
              service: {
                external_id: serviceExternalId,
                current_go_live_stage: 'ENTERED_ORGANISATION_NAME',
                gateway_account_ids: [gatewayAccountId]
              }
            }]
          }
        },
        {
          name: 'getGatewayAccountSuccess',
          opts: { gateway_account_id: gatewayAccountId }
        }
      ])
    })

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })
})
