'use strict'

const path = require('path')
const sinon = require('sinon')
const paths = require('../../../app/paths')
const hasServices = require(path.join(__dirname, '/../../../app/middleware/has-services.js'))
const userFixtures = require('../../fixtures/user.fixtures')

let res, next

describe('user has services middleware', () => {
  beforeEach(() => {
    res = {
      redirect: sinon.spy(),
      status: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should call next when user has services', done => {
    const user = userFixtures.validUserResponse({
      services_roles: [{ service: { external_id: '1' } }],
      external_id: 'external-id'
    }).getAsObject()

    const req = { user: user, headers: {} }

    hasServices(req, res, next)

    expect(next.called).toBe(true) // eslint-disable-line

    done()
  })

  it(
    'should redirect to service switcher if the user has no services',
    done => {
      const req = { user: { services: [] }, headers: {} }

      hasServices(req, res, next)

      expect(next.notCalled).toBe(true) // eslint-disable-line
      expect(res.redirect.called).toBe(true)
      expect(res.redirect.calledWith(paths.serviceSwitcher.index))

      done()
    }
  )
})
