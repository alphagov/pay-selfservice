import sinon from 'sinon'
import _ from 'lodash'

import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { beforeEach } from 'mocha'
import { array } from '@test/utils/custom-matchers'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import TokenUsageType from '@models/public-auth/token-usage-type'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import { ServiceRequest } from '@utils/types/express'
import { SESSION_KEY } from '@controllers/simplified-account/services/test-with-your-users/constants'
import { ProductType } from '@models/products/product-type'

const mockResponse = sinon.stub()

const GATEWAY_ACCOUNT_ID = 100
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'
const USER_EMAIL = 'homer.simpson@example.com'

const createProductStub = sinon.stub()
const createTokenStub = sinon.stub()

const { call, res, req, nextRequest, validate } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/test-with-your-users/create.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/products.service': {
      createProduct: createProductStub,
    },
    '@services/tokens.service': {
      createToken: createTokenStub,
    },
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
  .withUser({
    email: USER_EMAIL,
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
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.testWithYourUsers.links,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST
        ),
        confirmLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.testWithYourUsers.confirm,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST
        ),
      })
    })
  })

  describe('post', () => {
    describe('when there are validation errors', () => {
      beforeEach(() => {
        nextRequest({
          body: {
            description: '',
            paymentAmount: 'not a number',
            confirmationPage: 'http://not.a.https.url/ohno',
          },
        })
      })

      it('should call the response method with the create template', async () => {
        await validate('postValidation')
        await call('post')

        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/test-with-your-users/create'
        )
      })

      it('should pass the errors to the response method', async () => {
        await validate('postValidation')
        await call('post')

        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            errors: {
              summary: array.inAnyOrder([
                {
                  text: 'Enter a description',
                  href: '#description',
                },
                {
                  text: 'Enter a valid payment amount',
                  href: '#payment-amount',
                },
                {
                  text: 'Enter a valid URL starting with https://',
                  href: '#confirmation-page',
                },
              ]),
              formErrors: {
                description: 'Enter a description',
                paymentAmount: 'Enter a valid payment amount',
                confirmationPage: 'Enter a valid URL starting with https://',
              },
            },
          })
        )
      })

      it('should pass the user input back to the response method', async () => {
        await validate('postValidation')
        await call('post')

        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            prototypeLinkData: {
              description: '',
              paymentAmount: 'not a number',
              confirmationPage: 'http://not.a.https.url/ohno',
            },
          })
        )
      })
    })

    describe('when the input is valid', () => {
      beforeEach(() => {
        nextRequest({
          body: {
            description: 'This is a valid description',
            paymentAmount: '10.00',
            confirmationPage: 'https://this.is.a.valid.url.example.com',
          },
        })

        createTokenStub.resolves('api_key_test_productapikey')
        createProductStub.resolves({
          links: {
            pay: {
              href: 'https://payment.link.url.example.com/paymentlink',
            },
          },
        })
      })

      it('should call createToken', async () => {
        await call('post')

        createTokenStub.should.have.been.calledOnce
        createTokenStub.should.have.been.calledWith(
          new CreateTokenRequest()
            .withGatewayAccountId(`${GATEWAY_ACCOUNT_ID}`)
            .withServiceExternalId(SERVICE_EXTERNAL_ID)
            .withServiceMode(GatewayAccountType.TEST)
            .withDescription(`Token for Prototype: This is a valid description`)
            .withCreatedBy(USER_EMAIL)
            .withTokenUsageType(TokenUsageType.PRODUCTS)
        )
      })

      it('should call createProduct', async () => {
        await call('post')

        createProductStub.should.have.been.calledOnce
        createProductStub.should.have.been.calledWith(
          new CreateProductRequest()
            .withName('This is a valid description')
            .withPrice(1000)
            .withReturnUrl('https://this.is.a.valid.url.example.com')
            .withType(ProductType.PROTOTYPE)
            .withGatewayAccountId(GATEWAY_ACCOUNT_ID)
            .withApiToken('api_key_test_productapikey')
        )
      })

      it('should set the payment link URL on the session', async () => {
        const { req } = (await call('post')) as { req: ServiceRequest }

        _.get(req, SESSION_KEY, '').should.equal('https://payment.link.url.example.com/paymentlink')
      })
    })
  })
})
