const path = require('path')
const sinon = require('sinon')
const { expect } = require('chai')
const experimentalFeatures = require(path.join(__dirname, '/../../../app/middleware/experimental-features.js'))

let res, next

describe('services experimental features middleware', () => {
  beforeEach(() => {
    res = {
      redirect: sinon.spy(),
      status: sinon.spy((code) => ({ render: sinon.spy() }))
    }
    next = sinon.spy()
  })

  it('restricts access if experimental features are disabled on the service configuration', () => {
    const req = {
      service: {
        experimentalFfeaturesEnabled: false
      }
    }
    experimentalFeatures(req, res, next)
    expect(res.status.calledWith(404))
    expect(next.called).to.be.false // eslint-disable-line
  })

  it('allows access if experimental features are enabled on the service configuration', () => {
    const req = {
      service: {
        experimentalFeaturesEnabled: true
      }
    }
    experimentalFeatures(req, res, next)
    expect(next.called).to.be.true // eslint-disable-line
  })
})
