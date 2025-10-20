import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import { expect } from 'chai'

const ACCOUNT_TYPE = 'test'
const ACCOUNT_ID = '1337'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const SERVICE_NAME = 'My Service'

const mockResponse = sinon.stub()
const updateCustomParagraphStub = sinon.stub().resolves()

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/email-notifications/templates/custom-paragraph.controller'
)
  .withService({
    externalId: SERVICE_EXTERNAL_ID,
    name: SERVICE_NAME,
  })
  .withAccount({
    type: ACCOUNT_TYPE,
    id: ACCOUNT_ID,
    emailCollectionMode: 'MANDATORY',
    emailNotifications: {
      paymentConfirmed: {
        enabled: true,
        templateBody: 'Do this next',
      },
    },
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/email.service': { updateCustomParagraphByServiceIdAndAccountType: updateCustomParagraphStub },
  })
  .build()

describe('Controller: settings/email-notifications/templates/custom-paragraph', () => {
  describe('get', () => {
    it('should call the response method', async () => {
      await call('get')
      mockResponse.should.have.been.calledOnce
    })

    it('should pass req, res and template path to the response method', async () => {
      await call('get')

      mockResponse.should.have.been.calledWith(
        req,
        res,
        'simplified-account/settings/email-notifications/custom-paragraph'
      )
    })

    it('should pass context data to the response method', async () => {
      await call('get')

      expect(mockResponse.args[0][3]).to.have.property('customParagraph').to.equal('Do this next')
      expect(mockResponse.args[0][3]).to.have.property('serviceName').to.equal(SERVICE_NAME)
      expect(mockResponse.args[0][3])
        .to.have.property('backLink')
        .to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })

  describe('post', () => {
    describe('with empty body', () => {
      beforeEach(() => {
        nextRequest({
          body: { customParagraph: '' },
        })
      })

      it('should update the confirmation template', async () => {
        await call('post')

        expect(updateCustomParagraphStub.calledOnce).to.be.true
        expect(updateCustomParagraphStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, '')).to.be.true
      })

      it('should not set success message', async () => {
        await call('post')

        sinon.assert.notCalled(req.flash)
      })

      it('should redirect to the templates page', async () => {
        await call('post')

        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.templates)
      })
    })

    describe('without validation error', () => {
      beforeEach(() => {
        nextRequest({
          body: { customParagraph: 'a test custom paragraph' },
        })
      })

      it('should update the confirmation template', async () => {
        await call('post')

        expect(updateCustomParagraphStub.calledOnce).to.be.true
        expect(updateCustomParagraphStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'a test custom paragraph')).to.be
          .true
      })

      it('should set success message', async () => {
        await call('post')

        sinon.assert.calledOnceWithExactly(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Custom paragraph updated',
        })
      })

      it('should redirect to the templates page', async () => {
        await call('post')

        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.templates)
      })
    })

    describe('with validation error', () => {
      beforeEach(() => {
        nextRequest({
          body: { customParagraph: 'hi'.repeat(5000) },
        })
      })

      it('should call the response method', async () => {
        await call('post')

        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { req: thisReq } = await call('post')

        expect(mockResponse.args[0]).to.include(thisReq)
        expect(mockResponse.args[0]).to.include(res)
        expect(mockResponse.args[0]).to.include('simplified-account/settings/email-notifications/custom-paragraph')
      })

      it('should pass context data to the response method', async () => {
        await call('post')

        expect(mockResponse.args[0][3].errors.summary).to.deep.equal([
          {
            text: 'Custom paragraph name must be 5000 characters or fewer',
            href: '#custom-paragraph',
          },
        ])
        expect(mockResponse.args[0][3].errors.formErrors).to.deep.equal({
          customParagraph: 'Custom paragraph name must be 5000 characters or fewer',
        })
        expect(mockResponse.args[0][3]).to.have.property('customParagraph').to.equal('hi'.repeat(5000))
        expect(mockResponse.args[0][3]).to.have.property('serviceName').to.equal(SERVICE_NAME)
        expect(mockResponse.args[0][3])
          .to.have.property('backLink')
          .to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
        expect(mockResponse.args[0][3])
          .to.have.property('removeCustomParagraphLink')
          .to.contain(paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph)
      })
    })
  })
})
