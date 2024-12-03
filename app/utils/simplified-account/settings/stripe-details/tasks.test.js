const { expect } = require('chai')
const { friendlyStripeTasks } = require('./tasks')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

describe('friendlyStripeTasks', () => {
  const account = {
    type: ACCOUNT_TYPE
  }
  const service = {
    externalId: SERVICE_EXTERNAL_ID
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

    expect(result.governmentEntityDocument).to.deep.include({
      friendlyName: 'Government entity document',
      status: true
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

    const bankAccountIndex = resultKeys.indexOf('bankAccount')
    const governmentEntityDocumentIndex = resultKeys.indexOf('governmentEntityDocument')
    expect(bankAccountIndex).to.equal(0) // bankAccount should be the first task
    expect(governmentEntityDocumentIndex).to.equal(resultKeys.length - 1) // governmentEntityDocument should be the last task
  })

  it('should format paths correctly for task', () => {
    const accountWithSingleTask = {
      ...account,
      connectorGatewayAccountStripeProgress: {
        director: true
      }
    }

    const result = friendlyStripeTasks(accountWithSingleTask, service)

    expect(result.director.href)
      .to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.director, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
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

    expect(result.vatNumber.status).to.be.true // eslint-disable-line
    expect(result.companyNumber.status).to.be.false // eslint-disable-line
    expect(result.governmentEntityDocument.status).to.equal('disabled')
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
