import { expect } from 'chai'
import { paymentLinkSchema } from './payment-link.schema'
import { validationResult } from 'express-validator'

describe('Payment Link Schema Validation', () => {
  let BASE_REQ: { body: Record<string, string> }

  beforeEach(() => {
    BASE_REQ = {
      body: {
        name: 'Test Payment Link',
        description: 'A valid payment link description',
        referenceTypeGroup: 'custom',
        referenceLabel: 'Order Number',
        referenceHint: 'Enter your order number'
      }
    }
  })

  describe('Payment Link Title Validation', () => {
    it('should pass with a valid title', async () => {
      await paymentLinkSchema.info.title.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true
    })

    it('should fail when title is empty', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, name: '' }
      }
      await paymentLinkSchema.info.title.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a title')
    })

    it('should fail when title is only whitespace', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, name: '   ' }
      }
      await paymentLinkSchema.info.title.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a title')
    })

    it('should fail when title exceeds 255 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, name: 'a'.repeat(256) }
      }
      await paymentLinkSchema.info.title.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Title must be 255 characters or fewer')
    })

    it('should pass with title at exactly 255 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, name: 'a'.repeat(255) }
      }
      await paymentLinkSchema.info.title.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from title', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, name: '  Valid Title  ' }
      }
      await paymentLinkSchema.info.title.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })

  describe('Payment Link Description Validation', () => {
    it('should pass with a valid description', async () => {
      await paymentLinkSchema.info.details.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true
    })

    it('should pass with empty description', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: '' }
      }
      await paymentLinkSchema.info.details.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should pass with undefined description', async () => {
      const validReq = {
        body: { ...BASE_REQ.body }
      }
      delete validReq.body.description
      await paymentLinkSchema.info.details.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail when description exceeds 5000 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'a'.repeat(5001) }
      }
      await paymentLinkSchema.info.details.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details must be less than 5000 characters')
    })

    it('should pass with description at exactly 5000 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: 'a'.repeat(5000) }
      }
      await paymentLinkSchema.info.details.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail with invalid characters - less than', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'Description with < character' }
      }
      await paymentLinkSchema.info.details.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details contains invalid characters')
    })

    it('should fail with invalid characters - greater than', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'Description with > character' }
      }
      await paymentLinkSchema.info.details.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details contains invalid characters')
    })

    it('should fail with invalid characters - pipe', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'Description with | character' }
      }
      await paymentLinkSchema.info.details.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details contains invalid characters')
    })

    it('should pass with valid special characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: 'Description with £$%^&*()_-+={}[]@#~:;"/.,? and more!' }
      }
      await paymentLinkSchema.info.details.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from description', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: '  Valid description  ' }
      }
      await paymentLinkSchema.info.details.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })

  describe('Reference Type Validation', () => {
    it('should pass with custom reference type', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceTypeGroup: 'custom' }
      }
      await paymentLinkSchema.reference.type.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should pass with standard reference type', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceTypeGroup: 'standard' }
      }
      await paymentLinkSchema.reference.type.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail when reference type is empty', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, referenceTypeGroup: '' }
      }
      await paymentLinkSchema.reference.type.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please select an option')
    })

    it('should fail with invalid reference type', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, referenceTypeGroup: 'invalid' }
      }
      await paymentLinkSchema.reference.type.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please select an option')
    })

    it('should fail when reference type is only whitespace', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, referenceTypeGroup: '   ' }
      }
      await paymentLinkSchema.reference.type.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please select an option')
    })

    it('should trim whitespace from reference type', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceTypeGroup: '  custom  ' }
      }
      await paymentLinkSchema.reference.type.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })

  describe('Reference Label Validation', () => {
    it('should pass with a valid reference label', async () => {
      await paymentLinkSchema.reference.label.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true
    })

    it('should fail when reference label is empty', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, referenceLabel: '' }
      }
      await paymentLinkSchema.reference.label.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please enter a reference')
    })

    it('should fail when reference label is only whitespace', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, referenceLabel: '   ' }
      }
      await paymentLinkSchema.reference.label.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please enter a reference')
    })

    it('should fail when reference label exceeds 50 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, referenceLabel: 'a'.repeat(51) }
      }
      await paymentLinkSchema.reference.label.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Reference must be be 50 characters or fewer')
    })

    it('should pass with reference label at exactly 50 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceLabel: 'a'.repeat(50) }
      }
      await paymentLinkSchema.reference.label.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from reference label', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceLabel: '  Valid Label  ' }
      }
      await paymentLinkSchema.reference.label.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })

  describe('Reference Hint Validation', () => {
    it('should pass with a valid hint', async () => {
      await paymentLinkSchema.reference.hint.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true
    })

    it('should pass with empty hint', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceHint: '' }
      }
      await paymentLinkSchema.reference.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should pass with undefined hint', async () => {
      const validReq = {
        body: { ...BASE_REQ.body }
      }
      delete validReq.body.referenceHint
      await paymentLinkSchema.reference.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail when hint exceeds 255 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, referenceHint: 'a'.repeat(256) }
      }
      await paymentLinkSchema.reference.hint.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Hint text must be be 255 characters or fewer')
    })

    it('should pass with hint at exactly 255 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceHint: 'a'.repeat(255) }
      }
      await paymentLinkSchema.reference.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from hint', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, referenceHint: '  Valid hint text  ' }
      }
      await paymentLinkSchema.reference.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })
})
