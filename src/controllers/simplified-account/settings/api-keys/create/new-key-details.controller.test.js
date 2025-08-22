const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

const SERVICE_EXTERNAL_ID = 'service123abc'
const ACCOUNT_TYPE = 'live'

const mockResponse = sinon.stub()

const {
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/create/new-key-details.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/api-keys//create/new-key-details', () => {
  describe('get', () => {
    describe('key details present on session', () => {
      let thisCall
      beforeEach(async () => {
        nextRequest({
          session: {
            formState: {
              newApiKey: {
                details: {
                  name: 'S MCDUCK PROD CI',
                  key: 'api_live_dontleakme1234'
                }
              }
            }
          }
        })
        thisCall = await call('get')
      })

      it('should delete the key details from the session', () => {
        expect(thisCall.req.session).to.not.have.property('newApiKey')
      })

      it('should call the response method with context', () => {
        sinon.assert.calledOnceWithExactly(mockResponse,
          thisCall.req,
          res,
          'simplified-account/settings/api-keys/create/new-api-key-details',
          {
            details: {
              name: 'S MCDUCK PROD CI',
              key: 'api_live_dontleakme1234'
            },
            backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
          }
        )
      })
    })
    describe('key details not present on session', () => {
      beforeEach(async () => {
        await call('get')
      })

      it('should not call the response method', () => {
        sinon.assert.notCalled(mockResponse)
      })

      it('should redirect the user', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })
  })
})
