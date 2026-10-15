import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import { Types } from '@adyen/api-library'

type AccountHolder = Types.balancePlatform.AccountHolder
type AccountHolderInfo = Types.balancePlatform.AccountHolderInfo

interface ConfigurationClient {
  createAccountHolder: (accountHolderInfo: AccountHolderInfo) => Promise<AccountHolder>
}

interface ClientConfig {
  apiKey: string
  environment: string
}

let createAccountHolderStub: sinon.SinonStub

describe('Adyen configuration client', () => {
  function loadModule(): ConfigurationClient {
    createAccountHolderStub = sinon.stub()

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
      constructor(client: MockAdyenClient) {
        this.client = client
        this.AccountHoldersApi = {
          createAccountHolder: createAccountHolderStub,
        }
      }
    }

    return proxyquire('./adyen-configuration.client', {
      '@adyen/api-library': {
        Client: MockAdyenClient,
        BalancePlatformAPI: MockAdyenBalancePlatformAPI,
        EnvironmentEnum: { TEST: 'TEST' },
      },
    }) as ConfigurationClient
  }

  afterEach(() => {
    createAccountHolderStub.resetHistory()
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
})
