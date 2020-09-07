'use strict'

const { expect } = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const serviceFixtures = require('../../../fixtures/service.fixtures')
const paths = require('../../../../app/paths.js')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')
const Service = require('../../../../app/models/Service.class')

const mockResponse = {}
const getController = function getController (mockServiceService) {
  return proxyquire('../../../../app/controllers/edit-merchant-details/post-edit.controller', {
    '../../services/service.service': mockServiceService,
    '../../utils/response': mockResponse
  })
}

const setupMocks = () => {
  const res = {
    setHeader: sinon.stub(),
    status: sinon.spy(),
    redirect: sinon.spy(),
    render: sinon.spy(),
    flash: sinon.spy()
  }
  mockResponse.renderErrorView = sinon.spy()
  return res
}

const getMockServiceService = (serviceExternalId, shouldSucceed = true) => {
  const updatedService = new Service(serviceFixtures.validServiceResponse({
    external_id: serviceExternalId
  }).getPlain())

  const mockUpdateService = sinon.spy(() => {
    return new Promise((resolve, reject) => {
      if (shouldSucceed) {
        resolve(updatedService)
      } else {
        reject(new Error())
      }
    })
  })

  return { updateService: mockUpdateService }
}

const buildServiceModel = (serviceExternalId) => {
  return new Service(serviceFixtures.validServiceResponse({
    external_id: serviceExternalId
  }).getPlain())
}

describe('edit merchant details controller - post', () => {
  const correlationId = 'correlation-id'
  const serviceExternalId = 'dsfkbskjalksjdlk342'
  const validName = 'An organisation'
  const validTelephoneNumber = '01134960000'
  const validLine1 = 'A building'
  const validLine2 = 'A street'
  const validCity = 'A city'
  const countryGB = 'GB'
  const validPostcode = 'E1 8QS'
  const validEmail = 'foo@example.com'

  describe('successful submission for a service with only a card gateway account', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      res = setupMocks()
      req = {
        correlationId,
        service: buildServiceModel(serviceExternalId),
        body: {
          'merchant-name': validName,
          'telephone-number': validTelephoneNumber,
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': countryGB
        },
        flash: sinon.spy(),
        session: {}
      }

      mockServiceService = getMockServiceService(serviceExternalId)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })

    it('should update merchant details', () => {
      const expectedUpdateServiceRequest = [
        {
          'op': 'replace',
          'path': 'merchant_details/name',
          'value': validName
        },
        {
          'op': 'replace',
          'path': 'merchant_details/telephone_number',
          'value': validTelephoneNumber
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_line1',
          'value': validLine1
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_line2',
          'value': validLine2
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_city',
          'value': validCity
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_postcode',
          'value': validPostcode
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_country',
          'value': countryGB
        }
      ]
      expect(mockServiceService.updateService.calledWith(serviceExternalId, expectedUpdateServiceRequest, correlationId)).to.equal(true)
    })

    it('should redirect back to the index page', () => {
      expect(res.redirect.calledWith(formattedPathFor(paths.merchantDetails.index, serviceExternalId))).to.equal(true)
    })

    it('should set the success notification in the session', () => {
      expect(req.flash.calledWith('generic', 'Organisation details updated')).to.equal(true)
    })
  })

  describe('successful submission for a service with a direct debit gateway account', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      const service = buildServiceModel(serviceExternalId)
      service.hasDirectDebitGatewayAccount = true

      res = setupMocks()
      req = {
        correlationId,
        service: service,
        body: {
          'merchant-name': validName,
          'telephone-number': validTelephoneNumber,
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': countryGB,
          'merchant-email': validEmail
        },
        flash: sinon.spy(),
        session: {}
      }

      mockServiceService = getMockServiceService(serviceExternalId)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })

    it('should update merchant details', () => {
      const expectedUpdateServiceRequest = [
        {
          'op': 'replace',
          'path': 'merchant_details/name',
          'value': validName
        },
        {
          'op': 'replace',
          'path': 'merchant_details/telephone_number',
          'value': validTelephoneNumber
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_line1',
          'value': validLine1
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_line2',
          'value': validLine2
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_city',
          'value': validCity
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_postcode',
          'value': validPostcode
        },
        {
          'op': 'replace',
          'path': 'merchant_details/address_country',
          'value': countryGB
        },
        {
          'op': 'replace',
          'path': 'merchant_details/email',
          'value': validEmail
        }
      ]
      expect(mockServiceService.updateService.calledWith(serviceExternalId, expectedUpdateServiceRequest, correlationId)).to.equal(true)
    })

    it('should redirect back to the index page', () => {
      expect(res.redirect.calledWith(formattedPathFor(paths.merchantDetails.index, serviceExternalId))).to.equal(true)
    })

    it('should set the success notification in the session', () => {
      expect(req.flash.calledWith('generic', 'Organisation details updated')).to.equal(true)
    })
  })

  describe('when missing mandatory fields for a service without a direct debit gateway account', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      res = setupMocks()
      req = {
        correlationId,
        service: buildServiceModel(serviceExternalId),
        body: {
          'merchant-name': '',
          'telephone-number': '',
          'address-line1': '',
          'address-line2': '',
          'address-city': '',
          'address-postcode': '',
          'address-country': '',
          'merchant-email': ''
        },
        flash: sinon.spy()
      }

      mockServiceService = getMockServiceService(serviceExternalId)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })

    it(`should redirect back to the page`, () => {
      expect(res.redirect.calledWith(formattedPathFor(paths.merchantDetails.edit, serviceExternalId))).to.equal(true)
    })

    it(`should the errors in the session`, () => {
      expect(req.session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
      expect(req.session.pageData.editMerchantDetails.errors).to.deep.equal({
        'merchant-name': 'This field cannot be blank',
        'telephone-number': 'Enter a telephone number',
        'address-line1': 'This field cannot be blank',
        'address-city': 'This field cannot be blank',
        'address-postcode': 'Enter a postcode',
        'address-country': 'This field cannot be blank'
      })
    })
  })

  describe('when missing mandatory fields for a service with a direct debit gateway account', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      const service = buildServiceModel(serviceExternalId)
      service.hasDirectDebitGatewayAccount = true

      res = setupMocks()
      req = {
        correlationId,
        service: service,
        body: {
          'merchant-name': '',
          'telephone-number': '',
          'address-line1': '',
          'address-line2': '',
          'address-city': '',
          'address-postcode': '',
          'address-country': '',
          'merchant-email': ''
        },
        flash: sinon.spy()
      }

      mockServiceService = getMockServiceService(serviceExternalId)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })

    it(`should redirect back to the page`, () => {
      expect(res.redirect.calledWith(formattedPathFor(paths.merchantDetails.edit, serviceExternalId))).to.equal(true)
    })

    it(`should the errors in the session`, () => {
      expect(req.session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
      expect(req.session.pageData.editMerchantDetails.errors).to.deep.equal({
        'merchant-name': 'This field cannot be blank',
        'address-line1': 'This field cannot be blank',
        'address-city': 'This field cannot be blank',
        'address-postcode': 'Enter a postcode',
        'address-country': 'This field cannot be blank',
        'telephone-number': 'Enter a telephone number',
        'merchant-email': 'Enter an email address'
      })
    })
  })

  describe('when the update merchant details call has invalid postcode and the country is GB', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      res = setupMocks()
      req = {
        correlationId,
        service: buildServiceModel(serviceExternalId),
        body: {
          'merchant-name': validName,
          'telephone-number': validTelephoneNumber,
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': 'invalid',
          'address-country': countryGB,
          'merchant-email': validEmail
        },
        flash: sinon.spy()
      }

      mockServiceService = getMockServiceService(serviceExternalId)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })

    it(`should redirect back to the page`, () => {
      expect(res.redirect.calledWith(formattedPathFor(paths.merchantDetails.edit, serviceExternalId))).to.equal(true)
    })

    it(`should set errors in the session`, () => {
      expect(req.session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
      expect(req.session.pageData.editMerchantDetails.errors).to.deep.equal({
        'address-postcode': 'Please enter a real postcode'
      })
    })
  })
  describe('when the update merchant details call has invalid telephone number for a direct debit account', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      const service = buildServiceModel(serviceExternalId)

      res = setupMocks()
      req = {
        correlationId,
        service: service,
        body: {
          'merchant-name': validName,
          'telephone-number': 'invalid',
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': countryGB,
          'merchant-email': validEmail
        },
        flash: sinon.spy()
      }

      mockServiceService = getMockServiceService(serviceExternalId)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })
    it(`should redirect back to the page`, () => {
      expect(res.redirect.calledWith(formattedPathFor(paths.merchantDetails.edit, serviceExternalId))).to.equal(true)
    })
    it(`should set errors in the session`, () => {
      expect(req.session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
      expect(req.session.pageData.editMerchantDetails.errors).to.deep.equal({
        'telephone-number': 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
      })
    })
  })
  describe('when the update merchant details call has invalid email', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      const service = buildServiceModel(serviceExternalId)
      service.hasDirectDebitGatewayAccount = true

      res = setupMocks()
      req = {
        correlationId,
        service: service,
        body: {
          'merchant-name': validName,
          'telephone-number': validTelephoneNumber,
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': countryGB,
          'merchant-email': 'invalid'
        },
        flash: sinon.spy()
      }

      mockServiceService = getMockServiceService(serviceExternalId)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })

    it(`should redirect back to the page`, () => {
      expect(res.redirect.calledWith(formattedPathFor(paths.merchantDetails.edit, serviceExternalId))).to.equal(true)
    })

    it(`should set errors in the session`, () => {
      expect(req.session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
      expect(req.session.pageData.editMerchantDetails.errors).to.deep.equal({
        'merchant-email': 'Please use a valid email address'
      })
    })
  })
  describe('when the update merchant details call is unsuccessful', () => {
    let mockServiceService
    let req
    let res
    before(async function () {
      const service = buildServiceModel(serviceExternalId)
      service.hasDirectDebitGatewayAccount = true

      res = setupMocks()
      req = {
        correlationId,
        service: service,
        body: {
          'merchant-name': validName,
          'telephone-number': validTelephoneNumber,
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': countryGB,
          'merchant-email': validEmail
        },
        flash: sinon.spy()
      }

      mockServiceService = getMockServiceService(serviceExternalId, false)
      const controller = getController(mockServiceService)
      await controller(req, res)
    })

    it('should render error page', () => {
      expect(mockResponse.renderErrorView.called).to.equal(true)
    })
  })
})
