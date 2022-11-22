'use strict'

const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('Error handler', function () {
  let req, res, next

  beforeEach(() => {
    req = {
      params: {
        code: 'ndjkadh3182wdoq'
      }
    }

    res = {
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  const controller = function (errorCode) {
    return proxyquire(path.join(__dirname, './invite-validation.controller.js'),
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

    await controller(errorCode).validateInvite(req, res, next)
    sinon.assert.calledWith(res.status, errorCode)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'There has been a problem proceeding with this registration. Please try again.' }))
  })

  it('should handle 410 as this invitation link has expired', async () => {
    const errorCode = 410

    await controller(errorCode).validateInvite(req, res, next)
    sinon.assert.calledWith(res.status, errorCode)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'This invitation is no longer valid' }))
  })

  it('should handle unexpected error by calling next', async () => {
    const errorCode = undefined

    await controller(errorCode).validateInvite(req, res, next)
    sinon.assert.notCalled(res.render)
    sinon.assert.called(next)
  })
})
