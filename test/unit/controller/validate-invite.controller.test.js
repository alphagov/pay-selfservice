'use strict'

const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')


// Constants

describe('Error handler', function () {
  let correlationId, req, res, setHeaderStub, statusStub, renderStub

  beforeEach(() => {
    correlationId = 'abcde12345'
    req = {
      correlationId: correlationId,
      params: {
        code: 'ndjkadh3182wdoq'
      }
    }

    setHeaderStub = sinon.spy()
    statusStub = sinon.spy()
    renderStub = sinon.spy()

    res = {
      setHeader: setHeaderStub,
      status: statusStub,
      render: renderStub
    }
  })

  afterEach(() => {
    setHeaderStub = sinon.spy()
    statusStub = sinon.spy()
    renderStub = sinon.spy()
  })

  const controller = function (errorCode) {
    return proxyquire(path.join(__dirname, '/../../../app/controllers/invite-validation.controller.js'),
      {
        '../services/validate-invite.service': {
          getValidatedInvite: () => {
            /* eslint-disable prefer-promise-reject-errors */
            return new Promise(function (resolve, reject) {
              reject({ errorCode: errorCode })
            })
            /* eslint-enable prefer-promise-reject-errors */
          }
        }
      })
  }

  it('should handle 404 as unable to process registration at this time', function () {
    const errorCode = 404

    return controller(errorCode).validateInvite(req, res)
      .then(() => {
        expect(statusStub.calledWith(errorCode)).to.eq(true)
        expect(renderStub.calledWith('error', { message: 'Unable to process registration at this time' })).to.eq(true)
      })
  })

  it('should handle 410 as this invitation link has expired', function () {
    const errorCode = 410

    return controller(errorCode).validateInvite(req, res)
      .then(() => {
        expect(statusStub.calledWith(errorCode)).to.eq(true)
        expect(renderStub.calledWith('error', { message: 'This invitation is no longer valid' })).to.eq(true)
      })
  })

  it('should handle undefined as unable to process registration at this time with error code 500', function () {
    const errorCode = undefined

    return controller(errorCode).validateInvite(req, res)
      .then(() => {
        expect(statusStub.calledWith(500)).to.eq(true)
        expect(renderStub.calledWith('error', { message: 'Unable to process registration at this time' })).to.eq(true)
      })
  })
})
