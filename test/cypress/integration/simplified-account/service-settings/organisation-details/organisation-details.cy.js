const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const serviceStubs = require('@test/cypress/stubs/service-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 11

const ACCOUNT_TYPE = 'test'
const VALID_ORG_DETAILS = {
  name: 'Compu-Global-Hyper-Mega-Net',
  address_line1: '742 Evergreen Terrace',
  address_line2: '',
  address_city: 'Springfield',
  address_postcode: 'SP21NG',
  address_country: 'US',
  telephone_number: '01234567890',
  url: 'https://www.cghmn.example.com'
}

const setupStubs = (role = 'admin', merchantDetails) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      merchantDetails,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[role]
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, { gateway_account_id: GATEWAY_ACCOUNT_ID }),
    serviceStubs.patchUpdateMerchantDetailsSuccess({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      merchantDetails: {
        name: 'Compu-Global-Hyper-Mega-Net',
        address_line1: '742 Evergreen Terrace',
        address_line2: '',
        address_city: 'Springfield',
        address_postcode: 'SP21NG',
        address_country: 'US',
        telephone_number: '01234567890',
        url: 'https://www.cghmn.example.com'
      }
    })
  ])
}

describe('Organisation details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Organisation details landing page', () => {
    describe('for an admin user', () => {
      describe('when organisation details have not been set', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should redirect to the edit organisation details page', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
          cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)
        })
      })

      describe('when organisation details have been set', () => {
        beforeEach(() => {
          setupStubs('admin', VALID_ORG_DETAILS)
        })

        it('should not redirect to the edit organisation details page', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
          cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
          cy.get('h1').should('contain', 'Organisation details')
          cy.title().should('eq', 'Organisation details - Settings - My cool service - GOV.UK Pay')
        })

        it('should display the organisation details', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
          cy.get('.govuk-summary-card').within(() => {
            cy.get('.govuk-summary-card__title-wrapper > h2').should('contain', 'Organisation details')
            cy.get('.govuk-summary-list__row').eq(0).within(() => {
              cy.get('dt').should('contain', 'Name')
              cy.get('dd').should('contain', 'Compu-Global-Hyper-Mega-Net')
            })
            cy.get('.govuk-summary-list__row').eq(1).within(() => {
              cy.get('dt').should('contain', 'Address')
              cy.get('dd')
                .should('contain', '742 Evergreen Terrace')
                .should('contain', 'Springfield')
                .should('contain', 'SP21NG')
            })
            cy.get('.govuk-summary-list__row').eq(2).within(() => {
              cy.get('dt').should('contain', 'Telephone number')
              cy.get('dd').should('contain', '01234567890')
            })
            cy.get('.govuk-summary-list__row').eq(3).within(() => {
              cy.get('dt').should('contain', 'Website address')
              cy.get('dd').should('contain', 'https://www.cghmn.example.com')
            })
          })
        })

        it('should show a link to edit the organisation details', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
          cy.get('.govuk-summary-card').within(() => {
            cy.get('.govuk-summary-card__actions > a.govuk-link').should('contain', 'Change')
              .should('have.attr', 'href',
                `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)
          })
        })
      })
    })

    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs('view-and-refund')
      })

      it('should return a 403', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(403))
      })
    })
  })

  describe('Edit organisation details page', () => {
    describe('for an admin user', () => {
      describe('when organisation details have been set', () => {
        beforeEach(() => {
          setupStubs('admin', VALID_ORG_DETAILS)
        })

        it('should show the back link to the organisation details landing page', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)

          cy.get('.govuk-back-link')
            .should('be.visible')
            .should('contain', 'Back')
            .should('have.attr', 'href',
              `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
        })

        it('should populate the form with the existing organisation details', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)

          cy.get('input[name="organisationName"]').should('have.value', 'Compu-Global-Hyper-Mega-Net')
          cy.get('input[name="addressLine1"]').should('have.value', '742 Evergreen Terrace')
          cy.get('input[name="addressLine2"]').should('have.value', '')
          cy.get('input[name="addressCity"]').should('have.value', 'Springfield')
          cy.get('select[name="addressCountry"]').should('have.value', 'US')
          cy.get('input[name="addressPostcode"]').should('have.value', 'SP21NG')
          cy.get('input[name="telephoneNumber"]').should('have.value', '01234567890')
          cy.get('input[name="organisationUrl"]').should('have.value', 'https://www.cghmn.example.com')
        })
      })

      describe('when organisation details have not been set', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)
          cy.get('h1').should('contain', 'Change organisation details')
          cy.title().should('eq', 'Change organisation details - Settings - My cool service - GOV.UK Pay')
        })

        it('should not show the back link to the organisation details landing page', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)

          cy.get('.govuk-back-link').should('not.exist')
        })

        it('should show an empty form', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)

          cy.get('input[name="organisationName"]').should('have.value', '')
          cy.get('input[name="addressLine1"]').should('have.value', '')
          cy.get('input[name="addressLine2"]').should('have.value', '')
          cy.get('input[name="addressCity"]').should('have.value', '')
          cy.get('select[name="addressCountry"]').should('have.value', 'GB')
          cy.get('input[name="addressPostcode"]').should('have.value', '')
          cy.get('input[name="telephoneNumber"]').should('have.value', '')
          cy.get('input[name="organisationUrl"]').should('have.value', '')
        })

        it('should submit form and redirect to organisation details landing page if organisation details are valid', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)

          cy.get('input[name="organisationName"]').type('Compu-Global-Hyper-Mega-Net')
          cy.get('input[name="addressLine1"]').type('742 Evergreen Terrace')
          cy.get('input[name="addressCity"]').type('Springfield')
          cy.get('select[name="addressCountry"]').select('United States')
          cy.get('input[name="addressPostcode"]').type('SP21NG')
          cy.get('input[name="telephoneNumber"]').type('01234567890')
          cy.get('input[name="organisationUrl"]').type('https://www.cghmn.example.com')

          // adminusers should now respond with the set organisation details
          // otherwise it will redirect to the edit organisation details page
          setupStubs('admin', VALID_ORG_DETAILS)

          cy.get('button#save-merchant-details').click()

          cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details`)
        })

        it('should show validation errors on form submission if details are invalid', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)

          cy.get('input[name="organisationName"]').type('a'.repeat(101))
          cy.get('select[name="addressCountry"]').select('GB')
          cy.get('input[name="addressPostcode"]').type('NotAValidPostcode')
          cy.get('input[name="telephoneNumber"]').type('1')
          cy.get('input[name="organisationUrl"]').type('cghmn.example.com')

          cy.get('#organisation-details-form').submit()

          cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`)

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain', 'Organisation name must be 100 characters or fewer')
            .should('contain', 'Enter a building and street')
            .should('contain', 'Enter a town or city')
            .should('contain', 'Enter a real postcode')
            .should('contain', 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
            .should('contain', 'Enter a valid website address')

          cy.get('#organisation-name-error').should('contain.text', 'Organisation name must be 100 characters or fewer')
          cy.get('#address-line1-error').should('contain.text', 'Enter a building and street')
          cy.get('#address-city-error').should('contain.text', 'Enter a town or city')
          cy.get('#address-postcode-error').should('contain.text', 'Enter a real postcode')
          cy.get('#telephone-number-error').should('contain.text', 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
          cy.get('#url-error').should('contain.text', 'Enter a valid website address')
        })
      })
    })

    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs('view-and-refund')
      })

      it('should return a 403', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/organisation-details/edit`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(403))
      })
    })
  })
})
