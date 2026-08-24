import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'

const gatewayAccountFixture = GatewayAccountFixture.forSwitchingPsp(
  PaymentProvider.STRIPE,
  PaymentProvider.ADYEN,
  [],
  [
    {
      externalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
    },
  ],
  {
    id: GATEWAY_ACCOUNT_ID,
    serviceId: SERVICE_EXTERNAL_ID,
  }
)
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
  gatewayAccountIds: [`${gatewayAccountFixture.id}`],
  currentGoLiveStage: 'LIVE',
})
const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

const setStubs = (additionalStubs = []) => {
  cy.task('setupStubs', [
    getUser(USER_EXTERNAL_ID).success(userFixture),
    GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
      gatewayAccountFixture
    ),
    ...additionalStubs,
  ])
}

describe('switch to adyen task list', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('accessibility check', () => {
    setStubs()

    cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`)
    cy.a11yCheck()
  })

  it('should display correct page title and headings', () => {
    setStubs()

    cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`)
    checkServiceNavigation(
      'Switch provider to Adyen now',
      `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`
    )

    cy.title().should(
      'eq',
      `Switch your payment provider to Adyen - Settings - Power Plant Safety Inspection - GOV.UK Pay`
    )

    cy.get('h1').should('contain.text', 'Switch your payment provider to Adyen')
  })

  describe('for a service that has completed no migration tasks', () => {
    it('should show the task list with all tasks in the correct state', () => {
      setStubs()

      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`)

      cy.get('h2')
        .contains('1. Confirm your organisation')
        .next('.govuk-task-list')
        .within(() => {
          cy.get('.govuk-task-list__item').should('have.length', 1)

          cy.get('.govuk-task-list__item')
            .eq(0)
            .within(() => {
              cy.get('.govuk-task-list__link')
                .should('contain.text', 'Organisation details')
                .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`)
              cy.get('.govuk-task-list__status').should('contain.text', 'Not yet started')
            })
        })

      cy.get('h2')
        .contains('2. Accept the legal terms')
        .next('.govuk-task-list')
        .within(() => {
          cy.get('.govuk-task-list__item').should('have.length', 1)

          cy.get('.govuk-task-list__item')
            .eq(0)
            .within(() => {
              cy.get('.govuk-task-list__link')
                .should('contain.text', 'Read and accept Adyen’s legal terms')
                .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`)
              cy.get('.govuk-task-list__status').should('contain.text', 'Not yet started')
            })
        })

      cy.get('h2')
        .contains('3. Complete your organisation’s details')
        .next('.govuk-task-list')
        .within(() => {
          cy.get('.govuk-task-list__item').should('have.length', 4)

          cy.get('.govuk-task-list__item')
            .eq(0)
            .within(() => {
              cy.get('.govuk-task-list__link')
                .should('contain.text', 'Organisation’s bank details')
                .should(
                  'have.attr',
                  'href',
                  `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen/bank-details`
                )
              cy.get('.govuk-task-list__status').should('contain.text', 'Not yet started')
            })

          cy.get('.govuk-task-list__item')
            .eq(1)
            .within(() => {
              cy.get('.govuk-task-list__link')
                .should('contain.text', 'Responsible person')
                .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`)
              cy.get('.govuk-task-list__status').should('contain.text', 'Not yet started')
            })

          cy.get('.govuk-task-list__item')
            .eq(2)
            .within(() => {
              cy.get('.govuk-task-list__link')
                .should('contain.text', 'Service director')
                .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`)
              cy.get('.govuk-task-list__status').should('contain.text', 'Not yet started')
            })

          cy.get('.govuk-task-list__item')
            .eq(3)
            .within(() => {
              cy.get('.govuk-task-list__link')
                .should('contain.text', 'Tell us why your service takes payments')
                .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`)
              cy.get('.govuk-task-list__status').should('contain.text', 'Not yet started')
            })
        })
    })
  })

  describe('for a service not migrating to Adyen', () => {
    describe('where the service is switching to a different PSP', () => {
      const WORLDPAY_CREDENTIAL_EXTERNAL_ID = 'worldpay-credential-123-abc'

      beforeEach(() => {
        cy.task('clearStubs')

        const gatewayAccountSwitchingToWorldpay = GatewayAccountFixture.forSwitchingPsp(
          PaymentProvider.STRIPE,
          PaymentProvider.WORLDPAY,
          [],
          [
            {
              externalId: WORLDPAY_CREDENTIAL_EXTERNAL_ID,
            },
          ],
          {
            id: GATEWAY_ACCOUNT_ID,
            serviceId: SERVICE_EXTERNAL_ID,
          }
        )
        const serviceFixture = new ServiceFixture({
          externalId: SERVICE_EXTERNAL_ID,
          gatewayAccountIds: [`${gatewayAccountSwitchingToWorldpay.id}`],
          currentGoLiveStage: 'LIVE',
        })
        const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })
        cy.task('setupStubs', [
          getUser(USER_EXTERNAL_ID).success(userFixture),
          GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
            gatewayAccountSwitchingToWorldpay
          ),
        ])
      })

      it('should return a 404 when attempting to view the task list', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/live/settings/switch-psp/switch-to-adyen`,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })

    describe('where the service is not switching PSP', () => {
      beforeEach(() => {
        cy.task('clearStubs')
        const adyenGatewayAccount = GatewayAccountFixture.forAdyen({
          type: LIVE_ACCOUNT_TYPE,
        })

        const serviceFixture = new ServiceFixture({
          externalId: SERVICE_EXTERNAL_ID,
          gatewayAccountIds: [`${adyenGatewayAccount.id}`],
          currentGoLiveStage: 'LIVE',
        })
        const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

        cy.task('setupStubs', [
          getUser(USER_EXTERNAL_ID).success(userFixture),
          GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
            adyenGatewayAccount
          ),
        ])
      })

      it('should return a 404 when attempting to view the task list', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/live/settings/switch-psp/switch-to-adyen`,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
