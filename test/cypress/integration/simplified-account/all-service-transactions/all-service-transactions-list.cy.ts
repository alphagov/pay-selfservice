import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { TimeConstants } from '@utils/time/time-constants'
import gatewayAccountStubs, { getCardTypesSuccess } from '@test/cypress/stubs/gateway-account-stubs'
import { GatewayAccountType } from '@models/gateway-account/gateway-account-type'
import {
  getTransactionForGatewayAccount,
  searchTransactions,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceRoleFixture } from '@test/fixtures/user/service-role.fixture'
import { RoleFixture } from '@test/fixtures/service/role.fixture'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { searchByServiceExternalIds } from '@test/cypress/stubs/simplified-account/gateway-account-stubs'

const USER_EXTERNAL_ID = 'user123abc'
const USER_EMAIL = 's.mcduck@example.com'

const TEST_STRIPE_ACCOUNT = GatewayAccountFixture.forStripe({ type: 'test', id: 10 })
const TEST_SANDBOX_ACCOUNT = GatewayAccountFixture.forSandbox({ type: 'test', id: 20 })
const TEST_WORLDPAY_ACCOUNT = GatewayAccountFixture.forWorldpay({ type: 'test', id: 30 })

const STRIPE_SERVICE = new ServiceFixture({
  gatewayAccountIds: [`${TEST_STRIPE_ACCOUNT.id}`],
  externalId: 'stripe-service',
})
const SANDBOX_SERVICE = new ServiceFixture({
  gatewayAccountIds: [`${TEST_SANDBOX_ACCOUNT.id}`],
  externalId: 'sandbox-service',
})
const WORLDPAY_SERVICE = new ServiceFixture({
  gatewayAccountIds: [`${TEST_WORLDPAY_ACCOUNT.id}`],
  externalId: 'worldpay-service',
})

const userWithStripeService = new UserFixture({
  externalId: USER_EXTERNAL_ID,
  email: USER_EMAIL,
  serviceRoles: [SANDBOX_SERVICE, WORLDPAY_SERVICE, STRIPE_SERVICE].map(
    (service) => new ServiceRoleFixture({ service, role: RoleFixture.Admin() })
  ),
})

const userWithoutStripeService = new UserFixture({
  externalId: USER_EXTERNAL_ID,
  email: USER_EMAIL,
  serviceRoles: [SANDBOX_SERVICE, WORLDPAY_SERVICE].map(
    (service) => new ServiceRoleFixture({ service, role: RoleFixture.Admin() })
  ),
})

const STRIPE_TRANSACTION = new TransactionFixture({
  gatewayAccountId: `${TEST_STRIPE_ACCOUNT.id}`,
  amount: 1000,
  fee: 100,
  netAmount: 900,
  reference: 'Stripe transaction',
})
const SANDBOX_TRANSACTION = new TransactionFixture({
  gatewayAccountId: `${TEST_SANDBOX_ACCOUNT.id}`,
  amount: 1000,
  reference: 'Sandbox transaction',
})
const WORLDPAY_TRANSACTION = new TransactionFixture({
  gatewayAccountId: `${TEST_WORLDPAY_ACCOUNT.id}`,
  amount: 1000,
  reference: 'Worldpay transaction',
})

describe('All Service Transactions list', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('if user has a stripe service', () => {
    beforeEach(() => {
      const accountIds = [TEST_STRIPE_ACCOUNT, TEST_SANDBOX_ACCOUNT, TEST_WORLDPAY_ACCOUNT].map((account) => account.id)
      cy.task('setupStubs', [
        getUser(USER_EXTERNAL_ID).success(userWithStripeService),
        searchTransactions(TransactionSearchParams.fromSearchQuery(accountIds, {}, true, 20)).success([
          STRIPE_TRANSACTION,
          WORLDPAY_TRANSACTION,
          SANDBOX_TRANSACTION,
        ]),
        searchByServiceExternalIds([
          SANDBOX_SERVICE.externalId,
          WORLDPAY_SERVICE.externalId,
          STRIPE_SERVICE.externalId,
        ]).success([TEST_STRIPE_ACCOUNT, TEST_SANDBOX_ACCOUNT, TEST_WORLDPAY_ACCOUNT]),
        getCardTypesSuccess(),
      ])
    })

    it('should show the provider fee and net amount columns', () => {
      cy.visit('/transactions/test')

      cy.get('table#transactions-list').within(() => {
        cy.get('thead > tr').within(() => {
          cy.get('th').eq(0).should('contain.text', 'Reference number')
          cy.get('th').eq(1).should('contain.text', 'Email')
          cy.get('th').eq(2).should('contain.text', 'Amount')
          cy.get('th').eq(3).should('contain.text', 'Provider fee')
          cy.get('th').eq(4).should('contain.text', 'Net')
          cy.get('th').eq(5).should('contain.text', 'Card brand')
          cy.get('th').eq(6).should('contain.text', 'Payment Status')
          cy.get('th').eq(7).should('contain.text', 'Date created')
        })

        cy.get('tbody > tr')
          .eq(0)
          .within(() => {
            cy.get('th').eq(0).should('contain.text', 'Stripe transaction')
            cy.get('td').eq(0).should('contain.text', STRIPE_TRANSACTION.email)
            cy.get('td').eq(1).should('contain.text', '£10.00')
            cy.get('td').eq(2).should('contain.text', '£1.00')
            cy.get('td').eq(3).should('contain.text', '£9.00')
            cy.get('td').eq(4).should('contain.text', 'Visa')
            cy.get('td').eq(5).should('contain.text', 'Success')
          })

        cy.get('tbody > tr')
          .eq(1)
          .within(() => {
            cy.get('th').eq(0).should('contain.text', 'Worldpay transaction')
            cy.get('td').eq(0).should('contain.text', WORLDPAY_TRANSACTION.email)
            cy.get('td').eq(1).should('contain.text', '£10.00')
            cy.get('td').eq(2).should('not.contain.text')
            cy.get('td').eq(3).should('not.contain.text')
            cy.get('td').eq(4).should('contain.text', 'Visa')
            cy.get('td').eq(5).should('contain.text', 'Success')
          })

        cy.get('tbody > tr')
          .eq(2)
          .within(() => {
            cy.get('th').eq(0).should('contain.text', 'Sandbox transaction')
            cy.get('td').eq(0).should('contain.text', SANDBOX_TRANSACTION.email)
            cy.get('td').eq(1).should('contain.text', '£10.00')
            cy.get('td').eq(2).should('not.contain.text')
            cy.get('td').eq(3).should('not.contain.text')
            cy.get('td').eq(4).should('contain.text', 'Visa')
            cy.get('td').eq(5).should('contain.text', 'Success')
          })
      })
    })
  })

  describe('if the user has no stripe services', () => {
    beforeEach(() => {
      const accountIds = [TEST_SANDBOX_ACCOUNT, TEST_WORLDPAY_ACCOUNT].map((account) => account.id)
      cy.task('setupStubs', [
        getUser(USER_EXTERNAL_ID).success(userWithoutStripeService),
        searchTransactions(TransactionSearchParams.fromSearchQuery(accountIds, {}, true, 20)).success([
          WORLDPAY_TRANSACTION,
          SANDBOX_TRANSACTION,
        ]),
        searchByServiceExternalIds([SANDBOX_SERVICE.externalId, WORLDPAY_SERVICE.externalId]).success([
          TEST_SANDBOX_ACCOUNT,
          TEST_WORLDPAY_ACCOUNT,
        ]),
        getCardTypesSuccess(),
      ])
    })

    it('should not show the provider fee or net amount columns', () => {
      cy.visit('/transactions/test')

      cy.get('table#transactions-list').within(() => {
        cy.get('thead > tr').within(() => {
          cy.get('th').eq(0).should('contain.text', 'Reference number')
          cy.get('th').eq(1).should('contain.text', 'Email')
          cy.get('th').eq(2).should('contain.text', 'Amount')
          cy.get('th').eq(3).should('contain.text', 'Card brand')
          cy.get('th').eq(4).should('contain.text', 'Payment Status')
          cy.get('th').eq(5).should('contain.text', 'Date created')
        })
      })

      cy.get('tbody > tr')
        .eq(0)
        .within(() => {
          cy.get('th').eq(0).should('contain.text', 'Worldpay transaction')
          cy.get('td').eq(0).should('contain.text', WORLDPAY_TRANSACTION.email)
          cy.get('td').eq(1).should('contain.text', '£10.00')
          cy.get('td').eq(2).should('contain.text', 'Visa')
          cy.get('td').eq(3).should('contain.text', 'Success')
        })

      cy.get('tbody > tr')
        .eq(1)
        .within(() => {
          cy.get('th').eq(0).should('contain.text', 'Sandbox transaction')
          cy.get('td').eq(0).should('contain.text', SANDBOX_TRANSACTION.email)
          cy.get('td').eq(1).should('contain.text', '£10.00')
          cy.get('td').eq(2).should('contain.text', 'Visa')
          cy.get('td').eq(3).should('contain.text', 'Success')
        })
    })
  })
})
