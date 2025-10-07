import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { expect } from 'chai'
const mockResponse = sinon.stub()

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const { res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/organisation-details/organisation-details.controller'
)
  .withService({
    id: '123',
    externalId: SERVICE_EXTERNAL_ID,
  })
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/organisation-details', () => {
  describe('get', () => {
    describe('where organisation details have been set', () => {
      let thisCall: { req: unknown; result?: unknown; res?: unknown }

      beforeEach(async () => {
        nextRequest({
          service: {
            merchantDetails: {
              name: 'Compu-Global-Hyper-Mega-Net',
              addressLine1: '742 Evergreen Terrace',
              addressCity: 'Springfield',
              addressPostcode: 'SP21NG',
              addressCountry: 'US',
              telephoneNumber: '01234567890',
              url: 'https://www.cpghm.example.com',
            },
          },
          account: { type: ACCOUNT_TYPE },
        })
        thisCall = await call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse).to.have.been.calledOnce
      })

      it('should call the response method with req, res, template path, and context', () => {
        expect(mockResponse).to.have.been.calledWith(
          thisCall.req,
          res,
          'simplified-account/settings/organisation-details/index'
        )
      })

      it('should pass the context to the response method', () => {
        expect(mockResponse).to.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          messages: [],
          organisationDetails: {
            organisationName: 'Compu-Global-Hyper-Mega-Net',
            address: '742 Evergreen Terrace<br>Springfield<br>SP21NG',
            telephoneNumber: '01234567890',
            url: 'https://www.cpghm.example.com',
          },
          editOrganisationDetailsHref: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.organisationDetails.edit,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          ),
        })
      })
    })

    describe('where organisation details have not been set', () => {
      it('should call the redirect method with the edit organisation details url', async () => {
        await call('get')

        expect(res.redirect).to.have.been.calledOnce
        expect(res.redirect).to.have.been.calledWith(
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.organisationDetails.edit,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          )
        )
      })
    })
  })
})
