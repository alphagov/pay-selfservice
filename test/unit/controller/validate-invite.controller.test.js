'use strict'

const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('Error handler', function () {
  let correlationId, req, res

  beforeEach(() => {
    correlationId = 'abcde12345'
    req = {
      correlationId: correlationId,
      params: {
        code: 'ndjkadh3182wdoq'
      }
    }

    res = {
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: sinon.spy()
    }
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

  it('should handle 404 as unable to process registration at this time', async () => {
    const errorCode = 404

    await controller(errorCode).validateInvite(req, res)
    sinon.assert.calledWith(res.status, errorCode)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'Unable to process registration at this time' }))
  })

  it('should handle 410 as this invitation link has expired', async () => {
    const errorCode = 410

    await controller(errorCode).validateInvite(req, res)
    sinon.assert.calledWith(res.status, errorCode)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'This invitation is no longer valid' }))
  })

  it('should handle undefined as unable to process registration at this time with error code 500', async () => {
    const errorCode = undefined

    await controller(errorCode).validateInvite(req, res)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'Unable to process registration at this time' }))
  })
})
