const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const checkTitleAndHeading = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-title-and-heading')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const {
  WORLDPAY_CREDENTIAL_IN_CREATED_STATE,
  STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
  WORLDPAY_CREDENTIAL_IN_ENTERED_STATE,
  WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE,
  WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE,
} = require('@test/fixtures/credentials.fixtures')

// test constants
const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = { en: 'McDuck Enterprises', cy: 'Mentrau McDuck' }
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const WORLDPAY_DETAILS_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/worldpay-details`
const SWITCH_TO_WORLDPAY_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay`
const SWITCHING_CREDENTIAL_EXTERNAL_ID = WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE.external_id
// ---

const setStubs = (opts = {}, additionalStubs = []) => {
  const pendingCredential = opts.pendingCredential || WORLDPAY_CREDENTIAL_IN_CREATED_STATE
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin'],
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: STRIPE,
      provider_switch_enabled: true,
      allow_moto: opts.moto || false,
      worldpay_3ds_flex: opts.worldpay_3ds_flex || undefined,
      gateway_account_credentials: [STRIPE_CREDENTIAL_IN_ACTIVE_STATE, pendingCredential],
    }),
    ...additionalStubs,
  ])
}

describe('Switch to Worldpay setting', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The settings nav', () => {
    beforeEach(() => {
      setStubs({}, [])
      cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
    it('should show active "Switch to Worldpay" link', () => {
      checkSettingsNavigation('Switch to Worldpay', SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
  })
  describe('The page', () => {
    beforeEach(() => {
      setStubs({}, [])
      cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
    it('should have the correct title and heading', () => {
      checkTitleAndHeading('Switch to Worldpay', SERVICE_NAME.en)
    })
  })
  describe('For a non-admin', () => {
    beforeEach(() => {
      setStubs(
        {
          role: 'view-and-refund',
          moto: true,
        },
        []
      )
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
          setStubs()
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
        it('The task list should have the tasks required for a service to switch to Worldpay', () => {
          checkDisplayedTasks([
            {
              name: 'Link your Worldpay account with GOV.UK Pay',
              status: taskStatus.NOT_STARTED,
              tagClass: 'govuk-tag govuk-tag--blue',
            },
            {
              name: 'Configure 3DS',
              status: taskStatus.NOT_STARTED,
              tagClass: 'govuk-tag govuk-tag--blue',
            },
            {
              name: 'Make a live payment to test your Worldpay PSP',
              status: taskStatus.CANNOT_START,
              tagClass: 'govuk-tag govuk-tag--grey',
            },
          ])
        })
      })

      describe('When worldpay credentials and 3DS flex tasks have been completed', () => {
        beforeEach(() => {
          setStubs({
            moto: false,
            worldpay_3ds_flex: {
              organisational_unit_id: '5bd9b55e4444761ac0af1c80',
              issuer: '5bd9e0e4444dce15fed8c940', // pragma: allowlist secret
              jwt_mac_key: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0',
            },
            pendingCredential: WORLDPAY_CREDENTIAL_IN_ENTERED_STATE,
          })
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })

        it('The task list should show the "Live Payment" task as available', () => {
          checkDisplayedTasks([
            {
              name: 'Link your Worldpay account with GOV.UK Pay',
              status: taskStatus.COMPLETE,
              tagClass: 'govuk-tag',
            },
            {
              name: 'Configure 3DS',
              status: taskStatus.COMPLETE,
              tagClass: 'govuk-tag',
            },
            {
              name: 'Make a live payment to test your Worldpay PSP',
              status: taskStatus.NOT_STARTED,
              tagClass: 'govuk-tag govuk-tag--blue',
            },
          ])
        })

        it('all tasks should be navigable', () => {
          checkTaskNavigation([
            {
              name: 'Link your Worldpay account with GOV.UK Pay',
              heading: 'Your Worldpay credentials',
            },
            {
              name: 'Configure 3DS',
              heading: 'Your Worldpay 3DS Flex credentials',
            },
            {
              name: 'Make a live payment to test your Worldpay PSP',
              heading: 'Test the connection between Worldpay and GOV.UK Pay',
            },
          ])
        })
      })

      describe('When all tasks have been completed', () => {
        beforeEach(() => {
          setupStubsForAllTasksCompleted()
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
        it('The task list should not be present', () => {
          it('should not be present', () => {
            cy.get('.govuk-task-list').should('not.exist')
          })
        })
        describe('Clicking the "Switch to Worldpay" button', () => {
          it('should be redirected to the worldpay details settings page with success message', () => {
            cy.get('#switch-psp button[type=submit]').click()
            cy.get('.govuk-notification-banner')
              .should('have.class', 'govuk-notification-banner--success')
              .should('have.class', 'system-messages')
              .contains('Service connected to Worldpay')
              .parent()
              .parent()
              .contains('This service can now take payments')
            checkTitleAndHeading('Worldpay details', SERVICE_NAME.en)
            checkSettingsNavigation('Worldpay details', WORLDPAY_DETAILS_SETTINGS_URL)
          })
        })
      })
    })
    describe('For a MOTO service', () => {
      describe('When no tasks have been completed', () => {
        beforeEach(() => {
          setStubs({
            moto: true,
          })
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
        describe('The task list', () => {
          it('should have the tasks required for a MOTO service to switch to Worldpay', () => {
            checkDisplayedTasks([
              {
                name: 'Link your Worldpay account with GOV.UK Pay',
                status: taskStatus.NOT_STARTED,
                tagClass: 'govuk-tag govuk-tag--blue',
              },
              {
                name: 'Make a live payment to test your Worldpay PSP',
                status: taskStatus.CANNOT_START,
                tagClass: 'govuk-tag govuk-tag--grey',
              },
            ])
          })
        })
      })
      describe('When credentials have been entered ', () => {
        describe('The task list', () => {
          beforeEach(() => {
            setStubs({
              moto: true,
              pendingCredential: WORLDPAY_CREDENTIAL_IN_ENTERED_STATE,
            })
            cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
          })

          it('should show the "Live Payment" task as available', () => {
            checkDisplayedTasks([
              {
                name: 'Link your Worldpay account with GOV.UK Pay',
                status: taskStatus.COMPLETE,
                tagClass: 'govuk-tag',
              },
              {
                name: 'Make a live payment to test your Worldpay PSP',
                status: taskStatus.NOT_STARTED,
                tagClass: 'govuk-tag govuk-tag--blue',
              },
            ])
          })

          it('all tasks should be navigable', () => {
            checkTaskNavigation([
              {
                name: 'Link your Worldpay account with GOV.UK Pay',
                heading: 'Your Worldpay credentials',
              },
              {
                name: 'Make a live payment to test your Worldpay PSP',
                heading: 'Test the connection between Worldpay and GOV.UK Pay',
              },
            ])
          })
        })
      })
      describe('When all tasks have been completed', () => {
        beforeEach(() => {
          setupStubsForAllTasksCompleted()
          cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
        describe('The task list', () => {
          it('should not be present', () => {
            cy.get('.govuk-task-list').should('not.exist')
          })
        })
        describe('Clicking the "Switch to Worldpay" button', () => {
          it('should be redirected to the worldpay details settings page with success message', () => {
            cy.get('#switch-psp button[type=submit]').click()
            cy.get('.govuk-notification-banner')
              .should('have.class', 'govuk-notification-banner--success')
              .should('have.class', 'system-messages')
              .contains('Service connected to Worldpay')
              .parent()
              .parent()
              .contains('This service can now take payments')
            checkTitleAndHeading('Worldpay details', SERVICE_NAME.en)
            checkSettingsNavigation('Worldpay details', WORLDPAY_DETAILS_SETTINGS_URL)
          })
        })
      })
    })

    function setupStubsForAllTasksCompleted() {
      setStubs(
        {
          moto: true,
          pendingCredential: WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE,
        },
        [
          gatewayAccountStubs.postSwitchPspSuccessByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            userExternalId: USER_EXTERNAL_ID,
            credentialExternalId: SWITCHING_CREDENTIAL_EXTERNAL_ID,
          }),
          gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
            gateway_account_id: GATEWAY_ACCOUNT_ID,
            type: LIVE_ACCOUNT_TYPE,
            payment_provider: STRIPE,
            provider_switch_enabled: true,
            allow_moto: true,
            gateway_account_credentials: [STRIPE_CREDENTIAL_IN_ACTIVE_STATE, WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE],
          }),
          gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
            gateway_account_id: GATEWAY_ACCOUNT_ID,
            type: LIVE_ACCOUNT_TYPE,
            payment_provider: WORLDPAY,
            provider_switch_enabled: false,
            allow_moto: true,
            gateway_account_credentials: [WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE],
          }),
        ]
      )
    }
  })
})

const taskStatus = {
  NOT_STARTED: 'Not yet started',
  COMPLETE: 'Completed',
  CANNOT_START: 'Cannot start yet',
}

function checkDisplayedTasks(expectedTasks) {
  cy.get('.govuk-task-list__item')
    .should('have.length', expectedTasks.length)
    .each((row, index) => {
      const task = expectedTasks[index]
      cy.wrap(row)
        .should('contain.text', task.name)
        .find('.govuk-task-list__status')
        .should('contain.text', task.status)
      if (task.status !== taskStatus.COMPLETE) {
        cy.wrap(row).find('strong').should('have.class', task.tagClass)
      }
      cy.wrap(row)
        .find('a')
        .should(task.status === taskStatus.CANNOT_START ? 'not.exist' : 'exist')
    })
}

const checkTaskNavigation = (expectedTasks) => {
  cy.get('.govuk-task-list__item')
    .find('a')
    .should('have.length', expectedTasks.length)
    .then((links) => {
      const hrefs = links.map((_, link) => link.href).get()
      hrefs.forEach((href, index) => {
        cy.visit(href)
        cy.get('h1').should('contain.text', expectedTasks[index].heading)
        cy.get('.govuk-back-link').click()
      })
    })
}
