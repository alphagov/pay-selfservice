'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const getController = function getContsroller (mockServiceService) {
  return proxyquire('./post.controller', {
    '../../../services/service.service': {
      updateCurrentGoLiveStage: Promise.resolve(),
      updateService: Promise.resolve()
    }
  })
}

describe('organisation name - post controller', () => {
  let req, res, next, controller

  beforeEach(() => {
    req = {
      service: { externalId: 'service-external-id' }
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
    controller = getController()
  })

  it('should return error where organisation name is more than 100 characters', () => {
    const invalidName = 'a'.repeat(101)
    req.body = {
      'organisation-name': invalidName
    }

    controller(req, res, next)

    sinon.assert.calledWith(res.redirect, 303, `/service/${req.service.externalId}/request-to-go-live/organisation-name`)
    expect(req.session.pageData.requestToGoLive.organisationName.errors['organisation-name']).to.equal('Organisation name must be 100 characters or fewer')
  })
})
