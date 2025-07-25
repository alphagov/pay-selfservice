import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import AgreementStatus from '@models/agreements/agreement-status'
import { DateTime } from 'luxon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const SERVICE_EXTERNAL_ID = 'service123abc'
const AGREEMENT_EXTERNAL_ID = 'agreement123abc'
const GATEWAY_ACCOUNT_ID = 117
const mockResponse = sinon.spy()
const mockAgreementsService = {
  searchAgreements: sinon.stub().resolves({
    total: 1,
    count: 1,
    page: 1,
    agreements: [{
      externalId: AGREEMENT_EXTERNAL_ID,
      reference: 'blah',
      status: AgreementStatus.ACTIVE,
      paymentInstrument: {
        cardBrand: 'visa',
        lastDigitsCardNumber: '4242',
        expiryDate: DateTime.now(),
      }
    }],
  }),
}

const { nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/agreements/agreements.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/agreements.service': mockAgreementsService,
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST
  })
  .build()


describe('controller: services/agreements', () => {
  describe('get', () => {
    describe('agreements exist for service, no filters', () => {
      before(async () => {
        await call('get')
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass correct template path to the response method', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/agreements/index'
        )
      })

      it('should set results on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const results = context.results as {
          count: number
          total: number
          agreements: { detailUrl: string; [key: string]: unknown }[]
        }
        sinon.assert.match(results.count, 1)
        sinon.assert.match(results.total, 1)
        sinon.assert.match(results.agreements, sinon.match.array.and(sinon.match.has('length', 1)))
        sinon.assert.match(results.agreements[0], sinon.match.has('detailUrl', sinon.match.string))
        sinon.assert.match(results.agreements[0], sinon.match.has('externalId', AGREEMENT_EXTERNAL_ID))
      })

      it('should set pagination on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const pagination = context.pagination as Record<string, number | Record<string, unknown>>
        sinon.assert.match(pagination, sinon.match.object)
      })

      it('should set clearRedirect URL on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.clearRedirect, sinon.match.string)
      })
    })

    describe('with valid status filter', () => {
      it('should pass status filter to searchAgreements service', async () => {
        nextRequest({
          query: { status: AgreementStatus.ACTIVE }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          { status: AgreementStatus.ACTIVE }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { status: AgreementStatus.CANCELLED }
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, { status: AgreementStatus.CANCELLED })
      })
    })

    describe('with invalid status filter', () => {
      it('should ignore invalid status and not pass filter', async () => {
        nextRequest({
          query: { status: 'INVALID_STATUS' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          {}
        )
      })
    })

    describe('with valid reference filter', () => {
      it('should pass reference filter to searchAgreements service', async () => {
        nextRequest({
          query: { reference: 'REF-123' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          { reference: 'REF-123' }
        )
      })

      it('should trim whitespace from reference', async () => {
        nextRequest({
          query: { reference: '  REF-123  ' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          { reference: 'REF-123' }
        )
      })

      it('should accept alphanumeric characters with spaces, hyphens, and underscores', async () => {
        nextRequest({
          query: { reference: 'ABC 123-test_ref' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          { reference: 'ABC 123-test_ref' }
        )
      })
    })

    describe('with invalid reference filter', () => {
      it('should return validation errors for invalid characters', async () => {
        nextRequest({
          query: { reference: 'REF@123!' }
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })
    })

    describe('with combined filters', () => {
      it('should pass multiple filters to searchAgreements service', async () => {
        nextRequest({
          query: {
            status: AgreementStatus.ACTIVE,
            reference: 'REF-123'
          }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          {
            status: AgreementStatus.ACTIVE,
            reference: 'REF-123'
          }
        )
      })

      it('should include both filters in context', async () => {
        nextRequest({
          query: {
            status: AgreementStatus.INACTIVE,
            reference: 'TEST-456'
          }
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, {
          status: AgreementStatus.INACTIVE,
          reference: 'TEST-456'
        })
      })
    })

    describe('with page parameter', () => {
      it('should pass valid page number to searchAgreements service', async () => {
        nextRequest({
          query: { page: '2' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          2,
          {}
        )
      })

      it('should default to page 1 for invalid page parameter', async () => {
        nextRequest({
          query: { page: 'invalid' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          {}
        )
      })

      it('should default to page 1 for negative page number', async () => {
        nextRequest({
          query: { page: '-1' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          {}
        )
      })
    })

    describe('with empty reference filter', () => {
      it('should not include empty reference in filters', async () => {
        nextRequest({
          query: { reference: '' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          {}
        )
      })

      it('should not include whitespace-only reference in filters', async () => {
        nextRequest({
          query: { reference: '   ' }
        })

        await call('get')

        sinon.assert.calledWith(
          mockAgreementsService.searchAgreements,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT_ID,
          GatewayAccountType.TEST,
          1,
          {}
        )
      })
    })

    describe('pagination URL generation', () => {
      before(() => {
        mockAgreementsService.searchAgreements.resolves({
          total: 50,
          count: 20,
          page: 1,
          agreements: Array(20).fill(null).map((_, i) => ({
            externalId: `agreement${i}`,
            reference: `ref${i}`,
            status: AgreementStatus.ACTIVE,
            paymentInstrument: {
              cardBrand: 'visa',
              lastDigitsCardNumber: '4242',
              expiryDate: DateTime.now(),
            }
          }))
        })
      })

      after(() => {
        mockAgreementsService.searchAgreements.resolves({
          total: 1,
          count: 1,
          page: 1,
          agreements: [{
            externalId: AGREEMENT_EXTERNAL_ID,
            reference: 'blah',
            status: AgreementStatus.ACTIVE,
            paymentInstrument: {
              cardBrand: 'visa',
              lastDigitsCardNumber: '4242',
              expiryDate: DateTime.now(),
            }
          }],
        })
      })

      it('should preserve filters', async () => {
        nextRequest({
          query: {
            status: AgreementStatus.ACTIVE,
            reference: 'REF-123'
          }
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        const pagination = context.pagination as { items: { href: string }[] }

        sinon.assert.match(pagination, sinon.match.has('items'))
        sinon.assert.match(pagination.items, sinon.match.array)
        sinon.assert.match(pagination.items.length > 1, true)

        sinon.assert.match(pagination.items[1].href, sinon.match(/status=ACTIVE/))
        sinon.assert.match(pagination.items[1].href, sinon.match(/reference=REF-123/))
      })
    })
  })
})

