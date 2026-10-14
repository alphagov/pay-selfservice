import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'

const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`
const STATEMENT_DESCRIPTOR_USER_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/statement-descriptors/user`
const STATEMENT_DESCRIPTOR_PAYOUT_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/statement-descriptors/payout`
const STATEMENT_DESCRIPTOR_REVIEW_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/statement-descriptors/check-your-answers`

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

const adyenAccountSetup = AdyenAccountSetupFixture.NotStarted({
  serviceExternalId: SERVICE_EXTERNAL_ID,
  credentialExternalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
})

const setStubs = (additionalStubs = []) => {
  cy.task('setupStubs', [
    getUser(USER_EXTERNAL_ID).success(userFixture),
    GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
      gatewayAccountFixture
    ),
    GatewayAccountStubs.getAdyenSetupTasks(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      adyenAccountSetup.toAdyenAccountSetupData().tasks
    ).success(),
    ...additionalStubs,
  ])
}

describe(`Statement descriptors - check your answers`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a service that is migrating to adyen', () => {
    context('when the user descriptor page and the payout descriptor page have been completed', () => {
      beforeEach(() => {
        setStubs()

        cy.log('complete the user descriptor page')
        cy.visit(STATEMENT_DESCRIPTOR_USER_PATH)
        cy.get('#user-descriptor').type('our user descriptor')
        cy.get('#user-descriptor-submit').click()

        cy.log('complete the payout descriptor page')
        cy.get('#payout-descriptor').type('our payout descriptor')
        cy.get('#payout-descriptor-submit').click()
      })

      it('shows the page correctly', () => {
        cy.visit(STATEMENT_DESCRIPTOR_REVIEW_PATH)

        cy.log('accessibility check')
        cy.a11yCheck()

        cy.log('should display correct page title and headings')
        checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)

        cy.get('h1').should('contain.text', 'Check your answers')

        cy.log('should display a back link to payout descriptor page')
        cy.get('.govuk-back-link').should('have.attr', 'href', STATEMENT_DESCRIPTOR_PAYOUT_PATH)

        cy.log('should redirect to the adyen index page when continue is pressed')
        cy.get('#statement-descriptors-confirm').click()

        cy.location('pathname').should('eq', TASK_LIST_PATH)
      })

      it('shows the correct descriptor values and change journey', () => {
        cy.visit(STATEMENT_DESCRIPTOR_REVIEW_PATH)

        cy.contains('our user descriptor')
        cy.contains('our payout descriptor')

        cy.get('a').contains('Change what your paying users will see on their bank statements').click()

        cy.location('pathname').should('eq', STATEMENT_DESCRIPTOR_USER_PATH)

        cy.get('#user-descriptor').type('new user descriptor')
        cy.get('#user-descriptor-submit').click()

        cy.location('pathname').should('eq', STATEMENT_DESCRIPTOR_REVIEW_PATH)
        cy.contains('new user descriptor')
      })
    })

    context('when the descriptor pages have not been completed', () => {
      it('redirects to the task list', () => {
        setStubs()

        cy.visit(STATEMENT_DESCRIPTOR_REVIEW_PATH)
        cy.location('pathname').should('eq', TASK_LIST_PATH)
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

      it('should return a 404 when attempting to get the statement descriptor payout page', () => {
        cy.request({
          url: STATEMENT_DESCRIPTOR_REVIEW_PATH,
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

      it('should return a 404 when attempting to get the statement descriptor payout page', () => {
        cy.request({
          url: STATEMENT_DESCRIPTOR_REVIEW_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
