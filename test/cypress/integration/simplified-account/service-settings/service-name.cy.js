const userStubs = require('../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../stubs/gateway-account-stubs')
const serviceStubs = require('../../../stubs/service-stubs')
const {
  checkDisplayedSettings,
  checkServiceNameValidation,
  checkServiceNameEditActionNavigation
} = require('./service-name-test-helpers')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'My Cool Service',
  cy: 'Fy Ngwasanaeth Cwl'
}
const TEST_ACCOUNT_TYPE = 'test'
const TEST_GATEWAY_ACCOUNT_ID = 10

const SERVICE_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${TEST_ACCOUNT_TYPE}/settings`

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
      serviceName: opts.serviceName || SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: opts.role,
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, TEST_ACCOUNT_TYPE, { gateway_account_id: TEST_GATEWAY_ACCOUNT_ID }),
    ...additionalStubs
  ])
}

describe('Service name settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The default settings page', () => {
    describe('For an admin user', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(SERVICE_SETTINGS_URL)
      })
      it('should be Service name', () => {
        cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
      })
      it('should show the correct heading', () => {
        cy.get('h1').should('contain', 'Service name')
      })
      describe('The settings navigation', () => {
        it('should show service name', () => {
          cy.get('.service-settings-nav')
            .find('li')
            .should('contain', 'Service name')
            .find('a')
            .should('have.attr', 'href', `${SERVICE_SETTINGS_URL}/service-name`)
        })
      })
    })
    describe('For any other user', () => {
      beforeEach(() => {
        const role = {
          name: 'view-only',
          description: 'View only',
          permissions: [
            {
              name: 'transactions:read',
              description: 'Viewtransactionslist'
            }
          ]
        }
        setStubs({
          role
        })
        cy.visit(SERVICE_SETTINGS_URL)
      })
      it('should be Email notifications', () => {
        cy.title().should('eq', 'Settings - Email notifications - GOV.UK Pay')
      })
      it('should show the correct heading', () => {
        cy.get('h1').should('contain', 'Email notifications')
      })
      describe('The settings navigation', () => {
        it('should not show service name', () => {
          cy.get('.service-settings-nav')
            .find('li')
            .should('not.contain', 'Service name')
            .find('a')
            .should('not.have.attr', 'href', `${SERVICE_SETTINGS_URL}/service-name`)
        })
      })
    })
  })
  describe('Service name index', () => {
    describe('When Welsh service name is set', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(SERVICE_SETTINGS_URL)
      })
      const expectedSettings = [
        {
          key: 'Service name',
          value: SERVICE_NAME.en,
          actions: [
            { text: 'Change', href: `${SERVICE_SETTINGS_URL}/service-name/edit` }
          ]
        },
        {
          key: 'Welsh service name',
          value: SERVICE_NAME.cy,
          actions: [
            { text: 'Change', href: `${SERVICE_SETTINGS_URL}/service-name/edit?cy=true` }
          ]
        }
      ]

      it('should correctly display the Service name settings', () => {
        checkDisplayedSettings(2, expectedSettings)
      })

      it('should navigate to edit view for English service name when "Change" action is clicked', () => {
        checkServiceNameEditActionNavigation({
          selector: '[data-cy="edit-english-name"]',
          expectedUrl: 'service-name/edit',
          expectedPageTitle: 'Settings - Edit English service name - GOV.UK Pay',
          expectedHeader: 'Service name (English)'
        })
      })

      it('should navigate to edit view for Welsh service name when "Change" action is clicked', () => {
        checkServiceNameEditActionNavigation({
          selector: '[data-cy="edit-welsh-name"]',
          expectedUrl: 'service-name/edit?cy=true',
          expectedPageTitle: 'Settings - Edit Welsh service name - GOV.UK Pay',
          expectedHeader: 'Welsh service name (Cymraeg)'
        })
      })
    })
    describe('When Welsh service name is not set', () => {
      beforeEach(() => {
        setStubs({
          serviceName: {
            en: SERVICE_NAME.en,
            cy: undefined
          }
        })
        cy.visit(SERVICE_SETTINGS_URL)
      })
      const expectedSettings = [
        {
          key: 'Service name',
          value: SERVICE_NAME.en,
          actions: [
            { text: 'Change', href: `${SERVICE_SETTINGS_URL}/service-name/edit` }
          ]
        },
        {
          key: 'Welsh service name',
          value: 'Add Welsh service name',
          actions: []
        }
      ]

      it('should correctly display the Service name settings', () => {
        checkDisplayedSettings(2, expectedSettings)
      })

      it('should navigate to edit view for English service name when "Change" action is clicked', () => {
        checkServiceNameEditActionNavigation({
          selector: '[data-cy="edit-english-name"]',
          expectedUrl: 'service-name/edit',
          expectedPageTitle: 'Settings - Edit English service name - GOV.UK Pay',
          expectedHeader: 'Service name (English)'
        })
      })

      it('should navigate to edit view for Welsh service name when "Add Welsh service name" link is clicked', () => {
        checkServiceNameEditActionNavigation({
          selector: '[data-cy="add-welsh-name"]',
          expectedUrl: 'service-name/edit?cy=true',
          expectedPageTitle: 'Settings - Edit Welsh service name - GOV.UK Pay',
          expectedHeader: 'Welsh service name (Cymraeg)'
        })
      })
    })
  })

  describe('Service name edit', () => {
    describe('Service name validation', () => {
      beforeEach(() => {
        setStubs({}, [
          serviceStubs.patchUpdateServiceNameSuccess({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
            serviceName: {
              en: SERVICE_NAME.en,
              cy: ''
            }
          }),
          gatewayAccountStubs.patchUpdateServiceNameSuccess(TEST_GATEWAY_ACCOUNT_ID, SERVICE_NAME.en) // connector doesn't store the Welsh name
        ])
      })

      it('should show validation error when attempting to submit an English service name that is too long', () => {
        checkServiceNameValidation({
          settingsUrl: SERVICE_SETTINGS_URL + '/service-name/edit',
          expectedInputValue: 'A'.repeat(51),
          expectedErrorMessage: 'Service name must be 50 characters or fewer'
        })
      })

      it('should show validation error when attempting to submit an empty English service name', () => {
        checkServiceNameValidation({
          settingsUrl: SERVICE_SETTINGS_URL + '/service-name/edit',
          expectedInputValue: '',
          expectedErrorMessage: 'Service name is required'
        })
      })

      it('should show validation error when attempting to submit a Welsh service name that is too long', () => {
        checkServiceNameValidation({
          settingsUrl: SERVICE_SETTINGS_URL + '/service-name/edit?cy=true',
          expectedInputValue: 'A'.repeat(51),
          expectedErrorMessage: 'Service name must be 50 characters or fewer'
        })
      })

      it('should not show validation error when attempting to submit an empty Welsh service name', () => {
        cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit?cy=true')
        cy.get('input[name="serviceNameInput"]').clear({ force: true }).should('have.value', '')
        cy.get('.govuk-error-summary').should('not.exist')
        cy.get('button[form="edit-service-name"]').click()
        cy.get('.govuk-error-summary').should('not.exist')
        cy.get('#service-name-input-error').should('not.exist')
      })
    })
    describe('English service name', () => {
      beforeEach(() => {
        setStubs({}, [
          serviceStubs.patchUpdateServiceNameSuccess({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
            serviceName: {
              en: 'My New Service Name',
              cy: SERVICE_NAME.cy
            }
          }),
          gatewayAccountStubs.patchUpdateServiceNameSuccess(TEST_GATEWAY_ACCOUNT_ID, 'My New Service Name')
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit')
      })
      it('should show expected form elements', () => {
        cy.get('h1').should('contain.text', 'Service name (English)')
        cy.get('input[name="serviceNameInput"]')
          .should('have.value', SERVICE_NAME.en)
          .should('have.attr', 'lang', 'en')
          .should('have.attr', 'spellcheck', 'true')
        cy.get('.govuk-button').should('contain.text', 'Save changes')
        cy.get('.govuk-button').should('not.contain.text', 'Remove Welsh service name')
      })
      it('should submit form', () => {
        cy.get('input[name="serviceNameInput"]').clear({ force: true }).type('My New Service Name')
          .should('have.value', 'My New Service Name')
        cy.get('button[form="edit-service-name"]').click()
        cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
      })
    })
    describe('Welsh service name', () => {
      describe('When saving a new name', () => {
        beforeEach(() => {
          setStubs({}, [
            serviceStubs.patchUpdateServiceNameSuccess({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
              serviceName: {
                en: SERVICE_NAME.en,
                cy: 'Fy Enw Gwasanaeth Newydd'
              }
            }),
            gatewayAccountStubs.patchUpdateServiceNameSuccess(TEST_GATEWAY_ACCOUNT_ID, SERVICE_NAME.en) // connector doesn't store the Welsh name
          ])
          cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit?cy=true')
        })
        it('should show expected form elements', () => {
          cy.get('h1').should('contain.text', 'Welsh service name (Cymraeg)')
          cy.get('input[name="serviceNameInput"]')
            .should('have.value', SERVICE_NAME.cy)
            .should('have.attr', 'lang', 'cy')
            .should('have.attr', 'spellcheck', 'true')
          cy.get('.govuk-button').should('contain.text', 'Save changes')
          cy.get('.govuk-button').should('contain.text', 'Remove Welsh service name')
        })
        it('should submit form', () => {
          cy.get('input[name="serviceNameInput"]').clear({ force: true }).type('Fy Enw Gwasanaeth Newydd')
            .should('have.value', 'Fy Enw Gwasanaeth Newydd')
          cy.get('button[form="edit-service-name"]').click()
          cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
        })
      })
      describe('When removing the Welsh name', () => {
        beforeEach(() => {
          setStubs({}, [
            serviceStubs.patchUpdateServiceNameSuccess({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
              serviceName: {
                en: SERVICE_NAME.en,
                cy: ''
              }
            }),
            gatewayAccountStubs.patchUpdateServiceNameSuccess(TEST_GATEWAY_ACCOUNT_ID, SERVICE_NAME.en) // connector doesn't store the Welsh name
          ])
          cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit?cy=true')
        })
        it('should show expected form elements', () => {
          cy.get('h1').should('contain.text', 'Welsh service name (Cymraeg)')
          cy.get('input[name="serviceNameInput"]').should('have.value', SERVICE_NAME.cy)
          cy.get('.govuk-button-group')
            .find('button')
            .should('have.length', 2)
            .should('contain.text', 'Save changes')
            .should('contain.text', 'Remove Welsh service name')
        })
        it('should submit form', () => {
          cy.get('button[form="remove-welsh-service-name"]').click()
          cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
        })
      })
      describe('When Welsh service name is not set', () => {
        beforeEach(() => {
          setStubs({
            serviceName: {
              en: SERVICE_NAME.en,
              cy: undefined
            }
          }, [
            serviceStubs.patchUpdateServiceNameSuccess({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
              serviceName: {
                en: SERVICE_NAME.en,
                cy: ''
              }
            }),
            gatewayAccountStubs.patchUpdateServiceNameSuccess(TEST_GATEWAY_ACCOUNT_ID, SERVICE_NAME.en) // connector doesn't store the Welsh name
          ])
          cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit?cy=true')
        })
        it('should not show "Remove Welsh service name" button', () => {
          cy.get('h1').should('contain.text', 'Welsh service name (Cymraeg)')
          cy.get('input[name="serviceNameInput"]').should('have.value', '')
          cy.get('.govuk-button-group')
            .find('button')
            .should('have.length', 1)
            .should('contain.text', 'Save changes')
            .should('not.contain.text', 'Remove Welsh service name')
        })
        it('should submit form', () => {
          cy.get('button[form="edit-service-name"]').click()
          cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
        })
      })
    })
  })
})
