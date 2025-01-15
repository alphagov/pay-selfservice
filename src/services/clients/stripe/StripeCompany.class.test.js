'use strict'

const { expect } = require('chai')

const StripeCompany = require('./StripeCompany.class')

describe('StripeCompany', () => {
  it('should successfully create a StripeCompany object', () => {
    const vatId = '000000000'
    const taxId = '000000000'

    const stripeCompany = new StripeCompany({
      vat_id: vatId,
      tax_id: taxId,
      directors_provided: true,
      executives_provided: true
    })

    expect(stripeCompany.basicObject()).to.deep.equal({
      company: {
        vat_id: vatId,
        tax_id: taxId,
        directors_provided: true,
        executives_provided: true
      }
    })
  })

  it('should fail when vat_id is numeric', () => {
    const vatId = 123456789
    const taxId = '000000000'

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).to.throw('StripeCompany "vat_id" must be a string')
  })

  it('should fail when tax_id is numeric', () => {
    const vatId = '000000000'
    const taxId = 123456789

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).to.throw('StripeCompany "tax_id" must be a string')
  })

  it('should not fail when vat_id is undefined', () => {
    const vatId = undefined
    const taxId = '000000000'

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).not.to.throw('StripeCompany "vat_id" is required')

    expect(new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    }).basicObject()).to.deep.equal({
      company: {
        tax_id: taxId
      }
    })
  })

  it('should not fail when tax_id is undefined', () => {
    const vatId = '000000000'
    const taxId = undefined

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).not.to.throw('StripeCompany "tax_id" is required')

    expect(new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    }).basicObject()).to.deep.equal({
      company: {
        vat_id: vatId
      }
    })
  })

  it('should not fail when tax_id is not present', () => {
    const vatId = '000000000'

    expect(() => new StripeCompany({
      vat_id: vatId
    })).not.to.throw('StripeCompany "tax_id" is required')

    expect(new StripeCompany({
      vat_id: vatId
    }).basicObject()).to.deep.equal({
      company: {
        vat_id: vatId
      }
    })
  })

  it('should fail when vat_id is null', () => {
    const vatId = null
    const taxId = '000000000'

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).to.throw('StripeCompany "vat_id" must be a string')
  })

  it('should fail when tax_id is null', () => {
    const vatId = '000000000'
    const taxId = null

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).to.throw('StripeCompany "tax_id" must be a string')
  })

  it('should fail when vat_id is blank string', () => {
    const vatId = ''
    const taxId = '000000000'

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).to.throw('StripeCompany "vat_id" is not allowed to be empty')
  })

  it('should fail when tax_id is blank string', () => {
    const vatId = '000000000'
    const taxId = ''

    expect(() => new StripeCompany({
      vat_id: vatId,
      tax_id: taxId
    })).to.throw('StripeCompany "tax_id" is not allowed to be empty')
  })

  describe('directors_provided validation', () => {
    [12345, '', null, 'test'].forEach(async function (value) {
      const vatId = '000000000'
      const taxId = 'taxid'
      const directorsProvided = null
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripeCompany({
          vat_id: vatId,
          tax_id: taxId,
          directors_provided: directorsProvided
        })).to.throw(/StripeCompany "directors_provided" must be a boolean/)
      })
    })
  })

  describe('executives_provided validation', () => {
    [12345, '', null, 'test'].forEach(async function (value) {
      const vatId = '000000000'
      const taxId = 'taxid'
      const executivesProvided = null
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripeCompany({
          vat_id: vatId,
          tax_id: taxId,
          executives_provided: executivesProvided
        })).to.throw(/StripeCompany "executives_provided" must be a boolean/)
      })
    })
  })
})
