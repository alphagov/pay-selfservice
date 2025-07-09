const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { WORLDPAY } = require('@models/constants/payment-providers')
const checkTitleAndHeading = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-title-and-heading')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const { WORLDPAY_CREDENTIALS } = require('@test/fixtures/credentials.fixtures')

const ORG_UNIT_ID = '5bd9b55e4444761ac0af1c80'// pragma: allowlist secret
const ISSUER = '5bd9e0e4444dce15fed8c940' // pragma: allowlist secret
const JWT_MAC_KEY = 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0' // pragma: allowlist secret
const VALID_FLEX_CREDENTIALS = {
  organisational_unit_id: ORG_UNIT_ID,
  issuer: ISSUER,
  jwt_mac_key: JWT_MAC_KEY
}


// test constants
const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = { en: 'McDuck Enterprises', cy: 'Mentrau McDuck' }
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const WORLDPAY_DETAILS_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/worldpay-details`
const SWITCH_TO_WORLDPAY_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay`
// ---

const setupStubs = async (opts = {}, additionalStubs = []) => {
  const options = Object.assign({
    switchEnabled: true,
    moto: false,
    accountCredentials: [
      WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE,
      WORLDPAY_CREDENTIALS.ONE_OFF.CREATED
    ],
    role: 'admin'
  }, opts)

  await cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role]
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: WORLDPAY,
      provider_switch_enabled: options.switchEnabled,
      allow_moto: options.moto,
      worldpay_3ds_flex: opts.worldpay_3ds_flex || undefined,
      gateway_account_credentials: options.accountCredentials
    }),
    ...additionalStubs])
}

describe('Switch Worldpay credentials setting', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('The settings nav', () => {
    beforeEach(() => {
      setupStubs({}, [])
      cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
    it('should show active "Switch Worldpay credentials" link', () => {
      checkSettingsNavigation('Switch Worldpay credentials', SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
  })

  describe('The page', () => {
    beforeEach(() => {
      setupStubs({}, [])
      cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
    it('should have the correct title and heading', () => {
      checkTitleAndHeading('Switch Worldpay credentials', SERVICE_NAME.en)
    })
  })

  describe('For a non-admin', () => {
    beforeEach(() => {
      setupStubs({
        role: 'view-and-refund',
        moto: true
      }, [])
      cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL, { failOnStatusCode: false })
    })

    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('For an admin', () => {
    describe('For a non-MOTO service', () => {
      describe('When no tasks have been completed', () => {
        beforeEach(() => {
          setupStubs()
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
        it('The task list should have the tasks required for switching Worldpay credentials', () => {
          checkDisplayedTasks([
            {
              name: 'Link your Worldpay account with GOV.UK Pay',
              status: taskStatus.NOT_STARTED,
              tagClass: 'govuk-tag govuk-tag--blue'
            },
            {
              name: 'Configure 3DS',
              status: taskStatus.NOT_STARTED,
              tagClass: 'govuk-tag govuk-tag--blue'
            },
            {
              name: 'Make a live payment to test your Worldpay PSP',
              status: taskStatus.CANNOT_START,
              tagClass: 'govuk-tag govuk-tag--grey'
            }
          ])
        })
      })

      describe('When worldpay credentials and 3DS flex tasks have been completed', () => {
        beforeEach(() => {
          setupStubs({
            moto: false,
            worldpay_3ds_flex: VALID_FLEX_CREDENTIALS,
            accountCredentials: [WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE, WORLDPAY_CREDENTIALS.ONE_OFF.PENDING]
          })
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })

        it('The task list should show the "Live Payment" task as available', () => {
          checkDisplayedTasks([
            {
              name: 'Link your Worldpay account with GOV.UK Pay',
              status: taskStatus.COMPLETE,
              tagClass: 'govuk-tag'
            },
            {
              name: 'Configure 3DS',
              status: taskStatus.COMPLETE,
              tagClass: 'govuk-tag'
            },
            {
              name: 'Make a live payment to test your Worldpay PSP',
              status: taskStatus.NOT_STARTED,
              tagClass: 'govuk-tag govuk-tag--blue'
            }
          ])
        })
        it('all tasks should be navigable', () => {
          checkTaskNavigation([
            {
              name: 'Link your Worldpay account with GOV.UK Pay',
              heading: 'Your Worldpay credentials'
            },
            {
              name: 'Configure 3DS',
              heading: 'Your Worldpay 3DS Flex credentials'
            },
            {
              name: 'Make a live payment to test your Worldpay PSP',
              heading: 'Test the connection between Worldpay and GOV.UK Pay'
            }
          ])
        })
      })

      describe('When all tasks have been completed', () => {
        beforeEach(() => {
          setupStubs({
            worldpay_3ds_flex: VALID_FLEX_CREDENTIALS,
            accountCredentials: [
              WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE,
              WORLDPAY_CREDENTIALS.ONE_OFF.VERIFIED
            ]
          }, [
            gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              type: LIVE_ACCOUNT_TYPE,
              payment_provider: WORLDPAY,
              provider_switch_enabled: true,
              allow_moto: false,
              worldpay_3ds_flex: VALID_FLEX_CREDENTIALS,
              gateway_account_credentials: [WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE, WORLDPAY_CREDENTIALS.ONE_OFF.VERIFIED]
            }),
            gatewayAccountStubs.postSwitchPspSuccessByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              userExternalId: USER_EXTERNAL_ID,
              credentialExternalId: WORLDPAY_CREDENTIALS.ONE_OFF.VERIFIED.external_id
            }),
            gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              type: LIVE_ACCOUNT_TYPE,
              payment_provider: WORLDPAY,
              provider_switch_enabled: false,
              allow_moto: false,
              worldpay_3ds_flex: VALID_FLEX_CREDENTIALS,
              gateway_account_credentials: [WORLDPAY_CREDENTIALS.ONE_OFF.RETIRED, WORLDPAY_CREDENTIALS.ONE_OFF.SWITCHED]
            })
          ])
        })

        it('The task list should not be present', () => {
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)

            cy.get('.govuk-task-list')
              .should('not.exist')
        })

        describe('Clicking the "Switch to Worldpay" button', () => {
          it('should be redirected to the worldpay details settings page with success message', () => {
            cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)

            cy.get('#switch-psp button[type=submit]')
              .click()

            cy.get('.govuk-notification-banner')
              .should('have.class', 'govuk-notification-banner--success')
              .should('have.class', 'system-messages')
              .contains('Service connected to Worldpay')
              .parent()
              .contains('This service can now take payments')

            checkTitleAndHeading('Worldpay details', SERVICE_NAME.en)
            checkSettingsNavigation('Worldpay details', WORLDPAY_DETAILS_SETTINGS_URL)
            cy.get('.service-nav').contains('Switch Worldpay credentials').should('not.exist')
          })
        })
      })
    })
    describe('For a MOTO service', () => {
      describe('When no tasks have been completed', () => {
        beforeEach(() => {
          setupStubs({
            moto: true
          })
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
        describe('The task list', () => {
          it('should have the tasks required for a MOTO service to switch to Worldpay', () => {
            checkDisplayedTasks([
              {
                name: 'Link your Worldpay account with GOV.UK Pay',
                status: taskStatus.NOT_STARTED,
                tagClass: 'govuk-tag govuk-tag--blue'
              },
              {
                name: 'Make a live payment to test your Worldpay PSP',
                status: taskStatus.CANNOT_START,
                tagClass: 'govuk-tag govuk-tag--grey'
              }
            ])
          })
        })
      })
      describe('When credentials have been entered ', () => {
        describe('The task list', () => {
          beforeEach(() => {
            setupStubs({
              moto: true,
              accountCredentials: [WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE, WORLDPAY_CREDENTIALS.ONE_OFF.PENDING]
            })
            cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
          })

          it('should show the "Live Payment" task as available', () => {
            checkDisplayedTasks([
              {
                name: 'Link your Worldpay account with GOV.UK Pay',
                status: taskStatus.COMPLETE,
                tagClass: 'govuk-tag'
              },
              {
                name: 'Make a live payment to test your Worldpay PSP',
                status: taskStatus.NOT_STARTED,
                tagClass: 'govuk-tag govuk-tag--blue'
              }
            ])
          })

          it('all tasks should be navigable', () => {
            checkTaskNavigation([
              {
                name: 'Link your Worldpay account with GOV.UK Pay',
                heading: 'Your Worldpay credentials'
              },
              {
                name: 'Make a live payment to test your Worldpay PSP',
                heading: 'Test the connection between Worldpay and GOV.UK Pay'
              }
            ])
          })
        })
      })

      describe('When all tasks have been completed', () => {
        beforeEach(() => {
          setupStubs({
            moto: true,
            accountCredentials: [
              WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE,
              WORLDPAY_CREDENTIALS.ONE_OFF.VERIFIED
            ]
          }, [
            gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              type: LIVE_ACCOUNT_TYPE,
              payment_provider: WORLDPAY,
              provider_switch_enabled: true,
              allow_moto: true,
              gateway_account_credentials: [WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE, WORLDPAY_CREDENTIALS.ONE_OFF.VERIFIED]
            }),
            gatewayAccountStubs.postSwitchPspSuccessByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              userExternalId: USER_EXTERNAL_ID,
              credentialExternalId: WORLDPAY_CREDENTIALS.ONE_OFF.VERIFIED.external_id
            }),
            gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              type: LIVE_ACCOUNT_TYPE,
              payment_provider: WORLDPAY,
              provider_switch_enabled: false,
              allow_moto: true,
              gateway_account_credentials: [WORLDPAY_CREDENTIALS.ONE_OFF.RETIRED, WORLDPAY_CREDENTIALS.ONE_OFF.SWITCHED]
            })
          ])
          setupStubs({
            moto: false,
            worldpay_3ds_flex: VALID_FLEX_CREDENTIALS,
            accountCredentials: [WORLDPAY_CREDENTIALS.ONE_OFF.ACTIVE, WORLDPAY_CREDENTIALS.ONE_OFF.VERIFIED]
          }, [

          ])
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
        describe('The task list', () => {
          it('should not be present', () => {
            cy.get('.govuk-task-list')
              .should('not.exist')
          })
        })
        describe('Clicking the "Switch to Worldpay" button', () => {
          it('should be redirected to the worldpay details settings page with success message', () => {

            cy.get('.service-nav').contains('Switch Worldpay credentials').should('exist')

            cy.get('#switch-psp button[type=submit]')
              .click()
            cy.get('.govuk-notification-banner')
              .should('have.class', 'govuk-notification-banner--success')
              .should('have.class', 'system-messages')
              .contains('Service connected to Worldpay')
              .parent()
              .contains('This service can now take payments')

            checkTitleAndHeading('Worldpay details', SERVICE_NAME.en)
            checkSettingsNavigation('Worldpay details', WORLDPAY_DETAILS_SETTINGS_URL)

            cy.get('.service-nav').contains('Switch Worldpay credentials').should('not.exist')
          })
        })
      })
    })
  })
})

const taskStatus = {
  NOT_STARTED: 'Not yet started',
  COMPLETE: 'Completed',
  CANNOT_START: 'Cannot start yet'
}

function checkDisplayedTasks (expectedTasks) {
  cy.get('.govuk-task-list__item').should('have.length', expectedTasks.length)
    .each((row, index) => {
      const task = expectedTasks[index]
      cy.wrap(row)
        .should('contain.text', task.name)
        .find('.govuk-task-list__status')
        .should('contain.text', task.status)
      if (task.status !== taskStatus.COMPLETE) {
        cy.wrap(row).find('strong')
          .should('have.class', task.tagClass)
      }
      cy.wrap(row)
        .find('a')
        .should(task.status === taskStatus.CANNOT_START ? 'not.exist' : 'exist')
    })
}

const checkTaskNavigation = (expectedTasks) => {
  cy.get('.govuk-task-list__item').find('a').should('have.length', expectedTasks.length)
    .then(links => {
      const hrefs = links.map((_, link) => link.href).get()
      hrefs.forEach((href, index) => {
        cy.visit(href)
        cy.get('h1').should('contain.text', expectedTasks[index].heading)
        cy.get('.govuk-back-link').click()
      })
    })
}
