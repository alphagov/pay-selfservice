import sinon from 'sinon'

import ControllerTestBuilder from "@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class";
import GatewayAccountType from "@models/gateway-account/gateway-account-type";
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import paths from "@root/paths";
import {beforeEach} from "mocha";
import {array} from "@test/utils/custom-matchers";

const mockResponse = sinon.stub()

const GATEWAY_ACCOUNT_ID = '100'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'

const createProductStub = sinon.stub()
const createTokenStub = sinon.stub()

const { call, res, req, nextRequest, validate } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/test-with-your-users/create.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/products.service': {
      createProduct: createProductStub
    },
    '@services/tokens.service': {
      createToken: createTokenStub
    }
  })
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.TEST,
  })
  .withService({
    name: 'Test Service',
    externalId: SERVICE_EXTERNAL_ID,
  })
  .build()

describe('test-with-your-users/create controller tests', () => {
  describe('get', () => {
    it('should call the response method', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
    })

    it('should call the response method with the request, response, and template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledWith(req, res, 'simplified-account/services/test-with-your-users/create')
    })

    it('should call the response method with the context object', async () => {
      await call('get')

      mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
        backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  SERVICE_EXTERNAL_ID, GatewayAccountType.TEST),
        confirmLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.confirm,  SERVICE_EXTERNAL_ID, GatewayAccountType.TEST),
      })
    })
  })

  describe('post' , () => {
    describe('when there are validation errors', () => {
      beforeEach(() => {
        nextRequest({
          body: {
            description: '',
            paymentAmount: 'not a number',
            confirmationPage: 'http://not.a.https.url/ohno'
          }
        })
      })

      it('should call the response method with the create template', async () => {
        await validate('postValidation')
        await call('post')

        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, 'simplified-account/services/test-with-your-users/create')
      })

      it('should pass the errors to the response method', async () => {
        await validate('postValidation')
        await call('post')

        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, sinon.match({
          errors: {
            summary: array.inAnyOrder([{
              text: 'Enter a description',
              href: '#description'
            }, {
              text: 'Enter a valid payment amount',
              href: '#payment-amount'
            }, {
              text: 'Enter a valid URL starting with https://',
              href: '#confirmation-page'
            }]),
            formErrors: {
              description: 'Enter a description',
              paymentAmount: 'Enter a valid payment amount',
              confirmationPage: 'Enter a valid URL starting with https://'
            },
          }
        }))
      })

      it('should pass the user input back to the response method',  async () => {
        await validate('postValidation')
        await call('post')

        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, sinon.match({
          prototypeLinkData: {
            description: '',
            paymentAmount: 'not a number',
            confirmationPage: 'http://not.a.https.url/ohno'
          }
        }))
      })
    })

    describe('when the input is valid', () => {
      beforeEach(() => {
        nextRequest({
          body: {
            description: 'This is a valid description',
            paymentAmount: '10.00',
            confirmationPage: 'https://this.is.a.valid.url.example.com'
          }
        })
        createTokenStub.resolves('api_key_test_productapikey')

        createProductStub.resolves({
          links: {
            pay: {
              href: 'blah'
            }
          }
        })
      })

      it('should call createToken', async () => {
        await call('post')

        createProductStub.should.have.been.calledOnce
      })

      it('should call createProduct', async () => {
        await call('post')

        createProductStub.should.have.been.calledOnce
      })
    })
  })
})
