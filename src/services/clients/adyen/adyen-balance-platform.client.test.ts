import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import { Types } from '@adyen/api-library'

type AccountHolder = Types.balancePlatform.AccountHolder
type AccountHolderInfo = Types.balancePlatform.AccountHolderInfo
type BalanceAccount = Types.balancePlatform.BalanceAccount
type BalanceAccountInfo = Types.balancePlatform.BalanceAccountInfo

interface BalancePlatformClient {
  createAccountHolder: (accountHolderInfo: AccountHolderInfo) => Promise<AccountHolder>
  createBalanceAccount: (balanceAccountInfo: BalanceAccountInfo) => Promise<BalanceAccount>
}

interface ClientConfig {
  apiKey: string
  environment: string
}

let createAccountHolderStub: sinon.SinonStub
let createBalanceAccountStub: sinon.SinonStub

describe('Adyen balance platform client', () => {
  function loadModule(): BalancePlatformClient {
    createAccountHolderStub = sinon.stub()
    createBalanceAccountStub = sinon.stub()

    class MockAdyenClient {
      config: ClientConfig
      constructor(config: ClientConfig) {
        this.config = config
      }
    }

    class MockAdyenBalancePlatformAPI {
      client: MockAdyenClient
      AccountHoldersApi: {
        createAccountHolder: sinon.SinonStub
      }
      BalanceAccountsApi: {
        createBalanceAccount: sinon.SinonStub
      }
      constructor(client: MockAdyenClient) {
        this.client = client
        this.AccountHoldersApi = {
          createAccountHolder: createAccountHolderStub,
        }
        this.BalanceAccountsApi = {
          createBalanceAccount: createBalanceAccountStub,
        }
      }
    }

    return proxyquire('./adyen-balance-platform.client', {
      '@adyen/api-library': {
        Client: MockAdyenClient,
        BalancePlatformAPI: MockAdyenBalancePlatformAPI,
        EnvironmentEnum: { TEST: 'TEST' },
      },
    }) as BalancePlatformClient
  }

  afterEach(() => {
    createAccountHolderStub.resetHistory()
    createBalanceAccountStub.resetHistory()
  })

  it('calls the Adyen API to CREATE an account holder', async () => {
    const { createAccountHolder } = loadModule()
    const accountHolderInfo: AccountHolderInfo = {
      legalEntityId: 'LE123',
      balancePlatform: 'BP123',
      description: 'Test Service',
    }
    const apiResponse = { id: 'AH123', legalEntityId: 'LE123' } as AccountHolder
    createAccountHolderStub.resolves(apiResponse)

    const result = await createAccountHolder(accountHolderInfo)

    sinon.assert.calledOnceWithExactly(createAccountHolderStub, accountHolderInfo)
    expect(result).to.equal(apiResponse)
  })

  it('calls the Adyen API to CREATE a balance account', async () => {
    const { createBalanceAccount } = loadModule()
    const balanceAccountInfo: BalanceAccountInfo = {
      accountHolderId: 'ABC123',
      defaultCurrencyCode: 'GBP',
      description: 'Test Service',
    }
    const apiResponse = { id: 'ABC123', accountHolderId: 'ABC123' } as BalanceAccount
    createBalanceAccountStub.resolves(apiResponse)

    const result = await createBalanceAccount(balanceAccountInfo)

    sinon.assert.calledOnceWithExactly(createBalanceAccountStub, balanceAccountInfo)
    expect(result).to.equal(apiResponse)
  })
})
