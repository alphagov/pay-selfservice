const { expect } = require('chai')
const { friendlyStripeTasks } = require('./tasks')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { COMPLETED_CANNOT_START, CANNOT_START, NOT_STARTED } = require('@models/task-status')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

describe('friendlyStripeTasks', () => {
  const account = {
    type: ACCOUNT_TYPE
  }
  const service = {
    externalId: SERVICE_EXTERNAL_ID
  }

  it('should return empty array when stripeAccountSetup is not present', () => {
    const result = friendlyStripeTasks(null, account.type, service.externalId)
    expect(result).to.be.an('array')
    expect(result).to.be.empty // eslint-disable-line
  })

  it('should transform stripe tasks with all tasks completed', () => {
    const stripeAccountSetup = {
      bankAccount: true,
      responsiblePerson: true,
      director: true,
      vatNumber: true,
      companyNumber: true,
      organisationDetails: true,
      governmentEntityDocument: true
    }

    const result = friendlyStripeTasks(stripeAccountSetup, account.type, service.externalId)

    expect(result).to.be.an('array')
    expect(result).to.have.lengthOf(7)
    expect(result[result.length - 1]).to.deep.include({
      linkText: 'Government entity document',
      status: COMPLETED_CANNOT_START
    })
  })

  it('should set task order according to stripeDetailsTasks key order', () => {
    const setupObjectWithMixedProgress = {
      governmentEntityDocument: false,
      responsiblePerson: true,
      organisationDetails: false,
      director: false,
      companyNumber: false,
      bankAccount: true,
      vatNumber: true
    }

    const result = friendlyStripeTasks(setupObjectWithMixedProgress, account.type, service.externalId)
    expect(result[0]).to.deep.include({
      linkText: 'Organisation\'s bank details', // bankAccount should be the first task
      complete: true,
      status: COMPLETED_CANNOT_START
    })
    expect(result[result.length - 1]).to.deep.include({
      linkText: 'Government entity document', // governmentEntityDocument should be the last task
      complete: false,
      status: CANNOT_START
    })
  })

  it('should format paths correctly for task', () => {
    const setupObjectWithSingleTask = {
      director: true
    }

    const result = friendlyStripeTasks(setupObjectWithSingleTask, account.type, service.externalId)

    expect(result[0].href).to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.director, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
  })

  it('should handle status values correctly', () => {
    const setupObjectWithMixedStatus = {
      vatNumber: true,
      companyNumber: false,
      governmentEntityDocument: false
    }

    const result = friendlyStripeTasks(setupObjectWithMixedStatus, account.type, service.externalId)

    expect(result[0].status).to.equal(COMPLETED_CANNOT_START) // eslint-disable-line
    expect(result[1].status).to.equal(NOT_STARTED) // eslint-disable-line
    expect(result[2].status).to.equal(CANNOT_START)
  })

  it('should handle empty progress object', () => {
    const emptySetupObject = {}

    const result = friendlyStripeTasks(emptySetupObject, account.type, service.externalId)
    expect(result).to.be.an('array')
    expect(result).to.be.empty // eslint-disable-line
  })
})
