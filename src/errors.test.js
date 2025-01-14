'use strict'

const { expect } = require('chai')
const { NotAuthenticatedError, UserAccountDisabledError, NotAuthorisedError, NotFoundError } = require('./errors')

describe('Error classes', () => {
  it('should construct NotAuthenticatedError', () => {
    const error = new NotAuthenticatedError('not authenticated')
    expect(error.message).to.equal('not authenticated')
    expect(error.name).to.equal('NotAuthenticatedError')
    expect(error.stack).to.not.be.null // eslint-disable-line
  })

  it('should construct UserAccountDisabledError', () => {
    const error = new UserAccountDisabledError('user disabled')
    expect(error.message).to.equal('user disabled')
    expect(error.name).to.equal('UserAccountDisabledError')
    expect(error.stack).to.not.be.null // eslint-disable-line
  })

  it('should construct NotAuthorisedError', () => {
    const error = new NotAuthorisedError('not authorised')
    expect(error.message).to.equal('not authorised')
    expect(error.name).to.equal('NotAuthorisedError')
    expect(error.stack).to.not.be.null // eslint-disable-line
  })

  it('should construct NotFoundError', () => {
    const error = new NotFoundError('not found')
    expect(error.message).to.equal('not found')
    expect(error.name).to.equal('NotFoundError')
    expect(error.stack).to.not.be.null // eslint-disable-line
  })
})
