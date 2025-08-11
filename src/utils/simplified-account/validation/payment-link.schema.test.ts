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
      await paymentLinkSchema.info.name.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true
    })

    it('should fail when title is empty', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, name: '' }
      }
      await paymentLinkSchema.info.name.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a title')
    })

    it('should fail when title is only whitespace', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, name: '   ' }
      }
      await paymentLinkSchema.info.name.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a title')
    })

    it('should fail when title exceeds 230 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, name: 'a'.repeat(231) }
      }
      await paymentLinkSchema.info.name.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Title must be 230 characters or fewer')
    })

    it('should pass with title at exactly 230 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, name: 'a'.repeat(230) }
      }
      await paymentLinkSchema.info.name.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from title', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, name: '  Valid Title  ' }
      }
      await paymentLinkSchema.info.name.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })

  describe('Payment Link Description Validation', () => {
    it('should pass with a valid description', async () => {
      await paymentLinkSchema.info.description.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true
    })

    it('should pass with empty description', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: '' }
      }
      await paymentLinkSchema.info.description.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should pass with undefined description', async () => {
      const validReq = {
        body: { ...BASE_REQ.body }
      }
      delete validReq.body.description
      await paymentLinkSchema.info.description.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail when description exceeds 5000 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'a'.repeat(5001) }
      }
      await paymentLinkSchema.info.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details must be less than 5000 characters')
    })

    it('should pass with description at exactly 5000 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: 'a'.repeat(5000) }
      }
      await paymentLinkSchema.info.description.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail with invalid characters - less than', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'Description with < character' }
      }
      await paymentLinkSchema.info.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details contains invalid characters')
    })

    it('should fail with invalid characters - greater than', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'Description with > character' }
      }
      await paymentLinkSchema.info.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details contains invalid characters')
    })

    it('should fail with invalid characters - pipe', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, description: 'Description with | character' }
      }
      await paymentLinkSchema.info.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Details contains invalid characters')
    })

    it('should pass with valid special characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: 'Description with £$%^&*()_-+={}[]@#~:;"/.,? and more!' }
      }
      await paymentLinkSchema.info.description.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from description', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, description: '  Valid description  ' }
      }
      await paymentLinkSchema.info.description.validate.run(validReq)
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

  describe('Amount Type Validation', () => {
    it('should pass with fixed amount type', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, amountTypeGroup: 'fixed' }
      }
      await paymentLinkSchema.amount.type.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should pass with variable amount type', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, amountTypeGroup: 'variable' }
      }
      await paymentLinkSchema.amount.type.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail when amount type is empty', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, amountTypeGroup: '' }
      }
      await paymentLinkSchema.amount.type.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please select an option')
    })

    it('should fail with invalid amount type', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, amountTypeGroup: 'invalid' }
      }
      await paymentLinkSchema.amount.type.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please select an option')
    })

    it('should fail when amount type is only whitespace', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, amountTypeGroup: '   ' }
      }
      await paymentLinkSchema.amount.type.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Please select an option')
    })

    it('should trim whitespace from amount type', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, amountTypeGroup: '  fixed  ' }
      }
      await paymentLinkSchema.amount.type.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })

  describe('Amount Hint Validation', () => {
    it('should pass with a valid amount hint', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, amountHint: 'Enter your amount' }
      }
      await paymentLinkSchema.amount.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should pass with empty amount hint', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, amountHint: '' }
      }
      await paymentLinkSchema.amount.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should pass with undefined amount hint', async () => {
      const validReq = {
        body: { ...BASE_REQ.body }
      }
      delete validReq.body.amountHint
      await paymentLinkSchema.amount.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail when amount hint exceeds 255 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, amountHint: 'a'.repeat(256) }
      }
      await paymentLinkSchema.amount.hint.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Hint text must be be 255 characters or fewer')
    })

    it('should pass with amount hint at exactly 255 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, amountHint: 'a'.repeat(255) }
      }
      await paymentLinkSchema.amount.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from amount hint', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, amountHint: '  Valid amount hint  ' }
      }
      await paymentLinkSchema.amount.hint.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })

  describe('Metadata Column Header Validation', () => {
    const existingMetadata = {
      'existing_column': 'existing_value',
      'another_column': 'another_value'
    }

    describe('Adding new column', () => {
      it('should pass with valid new column header', async () => {
        const validReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'new_column' }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(existingMetadata).run(validReq)
        expect(validationResult(validReq).isEmpty()).to.be.true
      })

      it('should fail when column header is empty', async () => {
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: '' }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(existingMetadata).run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('Enter the column header')
      })

      it('should fail when column header is only whitespace', async () => {
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: '   ' }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(existingMetadata).run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('Enter the column header')
      })

      it('should fail when column header exceeds 30 characters', async () => {
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'a'.repeat(31) }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(existingMetadata).run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('Column header must be 30 characters or fewer')
      })

      it('should pass with column header at exactly 30 characters', async () => {
        const validReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'a'.repeat(30) }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(existingMetadata).run(validReq)
        expect(validationResult(validReq).isEmpty()).to.be.true
      })

      it('should fail when column header already exists', async () => {
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'existing_column' }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(existingMetadata).run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('Column header must not already exist')
      })

      it('should fail when trying to add more than 15 columns', async () => {
        const maxMetadata = Array.from({ length: 15 }, (_, i) => [`column_${i}`, `value_${i}`])
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
        
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'new_column' }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(maxMetadata).run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('You have already set 15 reporting columns for this payment link, remove one to set another')
      })

      it('should trim whitespace from column header', async () => {
        const validReq = {
          body: { ...BASE_REQ.body, reportingColumn: '  new_column  ' }
        }
        await paymentLinkSchema.metadata.columnHeader.add.validate(existingMetadata).run(validReq)
        expect(validationResult(validReq).isEmpty()).to.be.true
      })
    })

    describe('Editing existing column', () => {
      it('should pass when editing column header to same value', async () => {
        const validReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'existing_column' }
        }
        await paymentLinkSchema.metadata.columnHeader.edit.validate(existingMetadata, 'existing_column').run(validReq)
        expect(validationResult(validReq).isEmpty()).to.be.true
      })

      it('should pass when editing column header to new value', async () => {
        const validReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'updated_column' }
        }
        await paymentLinkSchema.metadata.columnHeader.edit.validate(existingMetadata, 'existing_column').run(validReq)
        expect(validationResult(validReq).isEmpty()).to.be.true
      })

      it('should fail when editing column header to duplicate existing value', async () => {
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'another_column' }
        }
        await paymentLinkSchema.metadata.columnHeader.edit.validate(existingMetadata, 'existing_column').run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('Column header must not already exist')
      })

      it('should fail when editing column header is empty', async () => {
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: '' }
        }
        await paymentLinkSchema.metadata.columnHeader.edit.validate(existingMetadata, 'existing_column').run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('Enter the column header')
      })

      it('should fail when editing column header exceeds 30 characters', async () => {
        const invalidReq = {
          body: { ...BASE_REQ.body, reportingColumn: 'a'.repeat(31) }
        }
        await paymentLinkSchema.metadata.columnHeader.edit.validate(existingMetadata, 'existing_column').run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.array()[0].msg).to.equal('Column header must be 30 characters or fewer')
      })
    })
  })

  describe('Metadata Cell Content Validation', () => {
    it('should pass with valid cell content', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, cellContent: 'Valid cell content' }
      }
      await paymentLinkSchema.metadata.cellContent.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should fail when cell content is empty', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, cellContent: '' }
      }
      await paymentLinkSchema.metadata.cellContent.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter the cell content')
    })

    it('should fail when cell content is only whitespace', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, cellContent: '   ' }
      }
      await paymentLinkSchema.metadata.cellContent.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter the cell content')
    })

    it('should fail when cell content exceeds 100 characters', async () => {
      const invalidReq = {
        body: { ...BASE_REQ.body, cellContent: 'a'.repeat(101) }
      }
      await paymentLinkSchema.metadata.cellContent.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Cell content must be 100 characters or fewer')
    })

    it('should pass with cell content at exactly 100 characters', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, cellContent: 'a'.repeat(100) }
      }
      await paymentLinkSchema.metadata.cellContent.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })

    it('should trim whitespace from cell content', async () => {
      const validReq = {
        body: { ...BASE_REQ.body, cellContent: '  Valid content  ' }
      }
      await paymentLinkSchema.metadata.cellContent.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true
    })
  })
})
