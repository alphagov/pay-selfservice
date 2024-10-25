const { expect } = require('chai')
const friendlyStripeTasks = require('./tasks')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

describe('friendlyStripeTasks', () => {
  const account = {
    type: ACCOUNT_TYPE
  }
  const service = {
    externalId: SERVICE_ID
  }

  it('should return empty object when connectorGatewayAccountStripeProgress is not present', () => {
    const result = friendlyStripeTasks(account, service)
    expect(result).to.be.an('object')
    expect(result).to.be.empty // eslint-disable-line
  })

  it('should transform stripe tasks with all tasks completed', () => {
    const accountWithProgress = {
      ...account,
      connectorGatewayAccountStripeProgress: {
        bankAccount: true,
        responsiblePerson: true,
        director: true,
        vatNumber: true,
        companyNumber: true,
        organisationDetails: true,
        governmentEntityDocument: true
      }
    }

    const result = friendlyStripeTasks(accountWithProgress, service)

    expect(result).to.be.an('object')
    expect(Object.keys(result)).to.have.lengthOf(7)

    expect(result['Government entity document']).to.deep.include({
      status: true,
      id: 'governmentEntityDocument'
    })
  })

  it('should set task order according to stripeDetailsTasks key order', () => {
    const accountWithMixedProgress = {
      ...account,
      connectorGatewayAccountStripeProgress: {
        governmentEntityDocument: false,
        responsiblePerson: true,
        organisationDetails: false,
        director: false,
        companyNumber: false,
        bankAccount: true,
        vatNumber: true
      }
    }

    const result = friendlyStripeTasks(accountWithMixedProgress, service)
    const resultKeys = Object.keys(result)

    const bankAccountIndex = resultKeys.indexOf('Organisation\'s bank details')
    const governmentEntityDocumentIndex = resultKeys.indexOf('Government entity document')
    expect(bankAccountIndex).to.equal(0) // bankAccount should be the first task
    expect(governmentEntityDocumentIndex).to.equal(resultKeys.length - 1) // governmentEntityDocument should be the last task
  })

  it('should handle unexpected tasks not defined in stripeDetailsTasks', () => {
    const accountWithExtraTask = {
      ...account,
      connectorGatewayAccountStripeProgress: {
        responsiblePerson: true,
        unknownTaskFromTheFuture: false
      }
    }

    const result = friendlyStripeTasks(accountWithExtraTask, service)

    expect(Object.keys(result)).to.have.lengthOf(1)
    expect(result['Responsible person']).to.exist // eslint-disable-line
  })

  it('should format paths correctly for task', () => {
    const accountWithSingleTask = {
      ...account,
      connectorGatewayAccountStripeProgress: {
        director: true
      }
    }

    const result = friendlyStripeTasks(accountWithSingleTask, service)

    expect(result['Service director'].href)
      .to.include(service.externalId)
      .and.include(account.type)
  })

  it('should handle status values correctly', () => {
    const accountWithMixedStatus = {
      ...account,
      connectorGatewayAccountStripeProgress: {
        vatNumber: true,
        companyNumber: false,
        governmentEntityDocument: false
      }
    }

    const result = friendlyStripeTasks(accountWithMixedStatus, service)

    expect(result['VAT registration number'].status).to.be.true // eslint-disable-line
    expect(result['Company registration number'].status).to.be.false // eslint-disable-line
    expect(result['Government entity document'].status).to.equal('disabled')
  })

  it('should handle empty progress object', () => {
    const accountWithEmptyProgress = {
      ...account,
      connectorGatewayAccountStripeProgress: {}
    }

    const result = friendlyStripeTasks(accountWithEmptyProgress, service)
    expect(result).to.be.an('object')
    expect(result).to.be.empty // eslint-disable-line
  })
})
