import userStubs from '@test/cypress/stubs/user-stubs'
import { WORLDPAY } from '@models/constants/payment-providers'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { checkServiceNavigation } from '../common/assertions'
import { TEST } from '@models/gateway-account/gateway-account-type'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'

const TRANSACTION = new TransactionFixture()

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = TRANSACTION.gatewayAccountId
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTIONS_LIST_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`

const sharedStubs = (gatewayAccountType = 'test') => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, gatewayAccountType, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: gatewayAccountType,
      payment_provider: WORLDPAY,
    }),
    gatewayAccountStubs.getCardTypesSuccess(),
  ])
}


describe('Transactions index', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Common page content', () => {
    beforeEach(() => {
      sharedStubs('test'),
        cy.task('setupStubs', [
          transactionStubs.getLedgerTransactionsSuccess({
            gatewayAccountId: GATEWAY_ACCOUNT_ID,
            transactions: [TRANSACTION],
            filters: { from_date: last12MonthsStartDate },
            displaySize: 20,
            transactionLength: 1
          })
        ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })
    })

    it('should show the transactions item in the side bar in an active state', () => {
      checkServiceNavigation('Transactions', TRANSACTIONS_LIST_URL)
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })
  })
})
