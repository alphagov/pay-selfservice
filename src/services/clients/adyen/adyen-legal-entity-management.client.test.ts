import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import { Types } from '@adyen/api-library'

type LegalEntity = Types.legalEntityManagement.LegalEntity
type LegalEntityInfo = Types.legalEntityManagement.LegalEntityInfo
type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType

interface LegalEntityManagementClient {
  createLegalEntity: (legalEntityInfo: LegalEntityInfoRequiredType) => Promise<LegalEntity>
  getLegalEntity: (id: string) => Promise<LegalEntity>
  updateLegalEntity: (id: string, legalEntityInfo: LegalEntityInfo) => Promise<LegalEntity>
}

interface ClientConfig {
  apiKey: string
  environment: string
}

let createLegalEntityStub: sinon.SinonStub
let getLegalEntityStub: sinon.SinonStub
let updateLegalEntityStub: sinon.SinonStub

describe('Adyen legal entity management client', () => {
  function loadModule(): LegalEntityManagementClient {
    createLegalEntityStub = sinon.stub()
    getLegalEntityStub = sinon.stub()
    updateLegalEntityStub = sinon.stub()

    class MockAdyenClient {
      config: ClientConfig
      constructor(config: ClientConfig) {
        this.config = config
      }
    }

    class MockAdyenLegalEntityManagementAPI {
      client: MockAdyenClient
      LegalEntitiesApi: {
        createLegalEntity: sinon.SinonStub
        getLegalEntity: sinon.SinonStub
        updateLegalEntity: sinon.SinonStub
      }
      constructor(client: MockAdyenClient) {
        this.client = client
        this.LegalEntitiesApi = {
          createLegalEntity: createLegalEntityStub,
          getLegalEntity: getLegalEntityStub,
          updateLegalEntity: updateLegalEntityStub,
        }
      }
    }

    return proxyquire('./adyen-legal-entity-management.client', {
      '@adyen/api-library': {
        Client: MockAdyenClient,
        LegalEntityManagementAPI: MockAdyenLegalEntityManagementAPI,
        EnvironmentEnum: { TEST: 'TEST' },
      },
    }) as LegalEntityManagementClient
  }

  beforeEach(() => {
    process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY
    createLegalEntityStub.resetHistory()
    getLegalEntityStub.resetHistory()
    updateLegalEntityStub.resetHistory()
  })

  const legalEntityInfo: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Individual,
    individual: {
      name: { firstName: 'John', lastName: 'Smith' },
      residentialAddress: {
        country: 'UK',
        city: 'London',
        postalCode: 'N11NN',
        street: '1 Test St',
      },
      birthData: { dateOfBirth: '1990-01-01' },
    },
  }

  it('calls the Adyen API to CREATE a legal entity', async () => {
    const { createLegalEntity } = loadModule()
    const apiResponse = { id: 'LE123', type: 'organization' } as LegalEntity
    createLegalEntityStub.resolves(apiResponse)

    const result = await createLegalEntity(legalEntityInfo)

    sinon.assert.calledOnce(createLegalEntityStub)
    sinon.assert.calledWithExactly(createLegalEntityStub, legalEntityInfo)

    expect(result).to.equal(apiResponse)
  })

  it('calls the Adyen API to GET a legal entity', async () => {
    const { getLegalEntity } = loadModule()
    const apiResponse = { id: 'LE123', type: 'organization' } as LegalEntity
    getLegalEntityStub.resolves(apiResponse)

    const result = await getLegalEntity('LE123')

    sinon.assert.calledOnceWithExactly(getLegalEntityStub, 'LE123')
    expect(result).to.equal(apiResponse)
  })

  it('calls the Adyen API to UPDATE a legal entity', async () => {
    const { updateLegalEntity } = loadModule()
    const apiResponse = { id: 'LE123', type: 'organization' } as LegalEntity
    const update: LegalEntityInfo = {
      entityAssociations: [
        {
          legalEntityId: 'LE456',
          type: Types.legalEntityManagement.LegalEntityAssociation.TypeEnum.Signatory,
        },
      ],
    }
    updateLegalEntityStub.resolves(apiResponse)

    const result = await updateLegalEntity('LE123', update)

    sinon.assert.calledOnceWithExactly(updateLegalEntityStub, 'LE123', update)
    expect(result).to.equal(apiResponse)
  })
})
