'use strict'

const sinon = require('sinon')
const getController = require('./get.controller')
const {
  NOT_STARTED, ENTERED_ORGANISATION_NAME, ENTERED_ORGANISATION_ADDRESS, CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY, TERMS_AGREED_STRIPE, TERMS_AGREED_GOV_BANKING_WORLDPAY, LIVE,
  DENIED, GOV_BANKING_MOTO_OPTION_COMPLETED
} = require('../../../models/go-live-stage')

const User = require('../../../models/User.class')
const userFixtures = require('../../../../test/fixtures/user.fixtures')

describe('Request to go live - choose takes payments over phone - GET controller', () => {
  let req, res, next

  const user = new User(userFixtures.validUserResponse())
  const service = user.serviceRoles[0].service

  beforeEach(() => {
    req = {
      user,
      service: service
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  const goLiveStagesNotApplicableForGetController = [
    NOT_STARTED,
    ENTERED_ORGANISATION_NAME,
    ENTERED_ORGANISATION_ADDRESS,
    CHOSEN_PSP_STRIPE,
    GOV_BANKING_MOTO_OPTION_COMPLETED,
    TERMS_AGREED_STRIPE,
    TERMS_AGREED_GOV_BANKING_WORLDPAY,
    LIVE,
    DENIED
  ]

  goLiveStagesNotApplicableForGetController.forEach(goLiveStage => {
    it(`should redirect to 'request to go live' index page if current go live stage is ${goLiveStage}`, async () => {
      req.service.currentGoLiveStage = goLiveStage

      await getController(req, res, next)

      sinon.assert.calledWith(res.redirect, 303, `/service/${service.externalId}/request-to-go-live`)
    })
  })

  it(`should redirect to 'choose takes payments over phone' page if current go live stage is CHOSEN_PSP_GOV_BANKING_WORLDPAY`, async () => {
    req.service.currentGoLiveStage = CHOSEN_PSP_GOV_BANKING_WORLDPAY

    await getController(req, res, next)

    sinon.assert.notCalled(res.redirect)
    sinon.assert.calledWith(res.render, 'request-to-go-live/choose-takes-payments-over-phone')
  })
})
