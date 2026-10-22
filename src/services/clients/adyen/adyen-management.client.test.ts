import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import { Types } from '@adyen/api-library'
import { Store } from '@adyen/api-library/lib/src/typings/management/store'

type StoreCreationWithMerchantCodeRequest = Types.management.StoreCreationWithMerchantCodeRequest

interface ManagementClient {
  createStore: (storeCreationRequest: StoreCreationWithMerchantCodeRequest) => Promise<Store>
}

interface ClientConfig {
  apiKey: string
  environment: string
}

let createStoreStub: sinon.SinonStub

describe('Adyen management client', () => {
  function loadModule(): ManagementClient {
    createStoreStub = sinon.stub()

    class MockAdyenClient {
      config: ClientConfig
      constructor(config: ClientConfig) {
        this.config = config
      }
    }

    class MockAdyenManagementAPI {
      client: MockAdyenClient
      AccountStoreLevelApi: {
        createStore: sinon.SinonStub
      }
      constructor(client: MockAdyenClient) {
        this.client = client
        this.AccountStoreLevelApi = {
          createStore: createStoreStub,
        }
      }
    }

    return proxyquire('./adyen-management.client', {
      '@adyen/api-library': {
        Client: MockAdyenClient,
        ManagementAPI: MockAdyenManagementAPI,
        EnvironmentEnum: { TEST: 'TEST' },
      },
    }) as ManagementClient
  }

  afterEach(() => {
    createStoreStub.resetHistory()
  })

  it('calls the Adyen API to CREATE a store', async () => {
    const { createStore } = loadModule()
    const storeCreationRequest: StoreCreationWithMerchantCodeRequest = {
      merchantId: 'MERCHANT123',
      description: 'Test Service',
      shopperStatement: 'TEST SERVICE',
      phoneNumber: '+441234567890',
      address: {
        line1: '1 Test St',
        city: 'London',
        postalCode: 'N1 1NN',
        country: 'GB',
      },
      businessLineIds: ['BL123'],
    }
    const apiResponse = { id: 'ST123', businessLineIds: ['BL123'] } as Store
    createStoreStub.resolves(apiResponse)

    const result = await createStore(storeCreationRequest)

    sinon.assert.calledOnceWithExactly(createStoreStub, storeCreationRequest)
    expect(result).to.equal(apiResponse)
  })
})
