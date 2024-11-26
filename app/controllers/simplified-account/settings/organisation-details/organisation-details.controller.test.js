const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const chai = require('chai')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const expect = chai.expect
const Service = require('@models/Service.class')
const ExperimentalTestBuilder = require('@test/test-helpers/simplified-account/controllers/ExperimentalTestBuilder.class')

const mockResponse = sinon.spy()

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const controllerTest = new ExperimentalTestBuilder('@controllers/simplified-account/settings/organisation-details/organisation-details.controller')
  .withService(new Service({
    id: '123',
    external_id: SERVICE_ID,
    merchant_details: {
      name: 'Compu-Global-Hyper-Mega-Net',
      address_line1: '742 Evergreen Terrace',
      address_city: 'Springfield',
      address_postcode: 'SP21NG',
      address_country: 'US',
      telephone_number: '01234567890',
      url: 'https://www.cpghm.example.com'
    }
  }))
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/organisation-details', () => {
  describe('get', () => {
    describe('where organisation details have been set', () => {
      it('should call the response method', () => {
        controllerTest.callMethod('get')
        expect(mockResponse).to.have.been.calledOnce // eslint-disable-line no-unused-expressions
      })

      it('should call the response method with req, res, template path, and context', () => {
        controllerTest.callMethod('get')
        expect(mockResponse).to.have.been.calledWith(controllerTest.req, controllerTest.res, 'simplified-account/settings/organisation-details/index')
      })

      it('should pass the context to the response method', () => {
        controllerTest.callMethod('get')
        expect(mockResponse).to.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          messages: [],
          organisationDetails: {
            organisationName: 'Compu-Global-Hyper-Mega-Net',
            address: '742 Evergreen Terrace<br>Springfield<br>SP21NG',
            telephoneNumber: '01234567890',
            url: 'https://www.cpghm.example.com'
          },
          editOrganisationDetailsHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, SERVICE_ID, ACCOUNT_TYPE)
        })
      })
    })

    describe('where organisation details have not been set', () => {
      const controllerTestWithoutOrgDetails = ExperimentalTestBuilder.copy(controllerTest)
        .withService(new Service({
          id: '123',
          external_id: SERVICE_ID
        }))
        .build()

      it('should call the redirect method with the edit organisation details url', () => {
        controllerTestWithoutOrgDetails.callMethod('get')
        expect(controllerTestWithoutOrgDetails.res.redirect).to.have.been.calledOnce // eslint-disable-line no-unused-expressions
        expect(controllerTestWithoutOrgDetails.res.redirect).to.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, SERVICE_ID, ACCOUNT_TYPE))
      })
    })
  })
})
