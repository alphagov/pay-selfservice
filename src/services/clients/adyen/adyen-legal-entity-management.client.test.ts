import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import { Types } from '@adyen/api-library'
import { TransferInstrumentInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrumentInfo'
import { TransferInstrument } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrument'
import { UKLocalAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/uKLocalAccountIdentification'
import { BankAccountAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/bankAccountAccountIdentification'

type LegalEntity = Types.legalEntityManagement.LegalEntity
type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType

interface LegalEntityManagementClient {
  createLegalEntity: (legalEntityInfo: LegalEntityInfoRequiredType) => Promise<LegalEntity>,
  createTransferInstrument: (transferInstrumentInfo: TransferInstrumentInfo) => Promise<TransferInstrument>
}

interface ClientConfig {
  apiKey: string
  environment: string
}

let createLegalEntityStub: sinon.SinonStub
let createTransferInstrumentStub: sinon.SinonStub

describe('Adyen legal entity management client', () => {
  function loadModule(): LegalEntityManagementClient {
    createLegalEntityStub = sinon.stub()
    createTransferInstrumentStub = sinon.stub()

    class MockAdyenClient {
      config: ClientConfig
      constructor(config: ClientConfig) {
        this.config = config
      }
    }

    class MockAdyenLegalEntityManagementAPI {
      client: MockAdyenClient
      LegalEntitiesApi: { createLegalEntity: sinon.SinonStub }
      TransferInstrumentsApi: { createTransferInstrument: sinon.SinonStub }
      constructor(client: MockAdyenClient) {
        this.client = client
        this.LegalEntitiesApi = { createLegalEntity: createLegalEntityStub }
        this.TransferInstrumentsApi = { createTransferInstrument: createTransferInstrumentStub }
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

  const accountIdentification: BankAccountAccountIdentification = {
    sortCode: '090102',
    accountNumber: '00000123',
    type: UKLocalAccountIdentification.TypeEnum.UkLocal,
  }

  const transferInstrumentInfo: TransferInstrumentInfo = {
    legalEntityId: 'LE123',
    type: TransferInstrumentInfo.TypeEnum.BankAccount,
    bankAccount: {
      accountIdentification,
    },
  }

  it('calls the Adyen API to create a legal entity', async () => {
    const { createLegalEntity } = loadModule()
    const apiResponse = { id: 'LE123', type: 'organization' } as LegalEntity
    createLegalEntityStub.resolves(apiResponse)

    const result = await createLegalEntity(legalEntityInfo)

    sinon.assert.calledOnce(createLegalEntityStub)
    sinon.assert.calledWithExactly(createLegalEntityStub, legalEntityInfo)

    expect(result).to.equal(apiResponse)
  })

  it('calls the Adyen API to create a transfer instrument', async () => {
    const { createTransferInstrument } = loadModule()
    const apiResponse = { id: 'SE321', type: 'bankAccount', legalEntityId: 'LE123' } as TransferInstrument
    createTransferInstrumentStub.resolves(apiResponse)

    const result = await createTransferInstrument(transferInstrumentInfo)

    sinon.assert.calledOnce(createTransferInstrumentStub)
    sinon.assert.calledWithExactly(createTransferInstrumentStub, transferInstrumentInfo)

    expect(result).to.equal(apiResponse)
  })
})
