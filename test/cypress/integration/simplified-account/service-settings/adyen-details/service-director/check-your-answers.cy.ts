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

const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`
const SERVICE_DIRECTOR_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/service-director/details`
const SERVICE_DIRECTOR_ADDRESS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/service-director/address`
const SERVICE_DIRECTOR_ANSWERS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/service-director/check-your-answers`

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
    type: LIVE_ACCOUNT_TYPE,
    serviceId: SERVICE_EXTERNAL_ID,
  }
)
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
  gatewayAccountIds: [`${gatewayAccountFixture.id}`],
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

describe(`Service director - check your answers`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('accessibility check', () => {
    setStubs()

    cy.visit(SERVICE_DIRECTOR_ANSWERS_PATH)
    cy.a11yCheck()
  })

  it('should display correct page title and headings', () => {
    setStubs()

    cy.visit(SERVICE_DIRECTOR_ANSWERS_PATH)

    checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
    cy.get('h1').should('contain.text', `Check your answers`)
  })

  describe('for a service that is migrating to adyen', () => {
    it('should display a back link to service director details', () => {
      setStubs()

      cy.visit(SERVICE_DIRECTOR_ANSWERS_PATH)

      cy.get('.govuk-back-link').should('have.attr', 'href', SERVICE_DIRECTOR_ADDRESS_PATH)
    })

    it('should redirect to personal details page when change link is clicked in details card', () => {
      setStubs()

      cy.visit(SERVICE_DIRECTOR_ANSWERS_PATH)

      cy.get(`[data-cy='edit-director-details']`).click()
      cy.location('pathname').should('eq', SERVICE_DIRECTOR_DETAILS_PATH)
    })

    it('should redirect to address page when change link is clicked in address card', () => {
      setStubs()

      cy.visit(SERVICE_DIRECTOR_ANSWERS_PATH)

      cy.get(`[data-cy='edit-director-address']`).click()
      cy.location('pathname').should('eq', SERVICE_DIRECTOR_ADDRESS_PATH)
    })

    it('should redirect to the task list page when continue is pressed', () => {
      setStubs()

      cy.visit(SERVICE_DIRECTOR_ANSWERS_PATH)

      cy.get('#service-director-confirm').click()

      cy.location('pathname').should('eq', TASK_LIST_PATH)
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

      it('should return a 404 when attempting to view service director details', () => {
        cy.request({
          url: SERVICE_DIRECTOR_ANSWERS_PATH,
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

      it('should return a 404 when attempting to view bank details', () => {
        cy.request({
          url: SERVICE_DIRECTOR_ANSWERS_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
