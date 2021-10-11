'use strict'

const { expect } = require('chai')

const { isNotVatNumber } = require('./field-validation-checks')

describe('UK VAT number validations', () => {
  it('should validate that standard VAT numbers are valid', () => {
    expect(isNotVatNumber('GB999 9999 73')).to.be.false // eslint-disable-line
  })

  it('should validate that standard VAT numbers in non-standard format are valid', () => {
    expect(isNotVatNumber(' g B 9  99 999 9 7 3 ')).to.be.false // eslint-disable-line
  })

  it('should validate that standard VAT numbers without GB prefix are not valid', () => {
    expect(isNotVatNumber('999999973')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that standard VAT numbers that are too short are not valid', () => {
    expect(isNotVatNumber('GB99999997')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that standard VAT numbers that are too long are not valid', () => {
    expect(isNotVatNumber('GB9999999731')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that branch trader VAT numbers are valid', () => {
    expect(isNotVatNumber('GB123 4567 891 23')).to.be.false // eslint-disable-line
  })

  it('should validate that branch trader VAT numbers in non-standard format are valid ()', () => {
    expect(isNotVatNumber(' gb 123456789 123 ')).to.be.false // eslint-disable-line
  })

  it('should validate that branch trader VAT numbers that are too short are not valid ()', () => {
    expect(isNotVatNumber('GB12345678912')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that branch trader VAT numbers that are too long are not valid ()', () => {
    expect(isNotVatNumber('GB1234567891231')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that government department VAT numbers are valid', () => {
    expect(isNotVatNumber('GBGD001')).to.be.false // eslint-disable-line
  })

  it('should validate that government department VAT numbers in non-standard format are valid', () => {
    expect(isNotVatNumber(' g BG d 001 ')).to.be.false // eslint-disable-line
  })

  it('should validate that health authority VAT numbers that don’t begin with 1–4 are not valid', () => {
    expect(isNotVatNumber('GBGD500')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that government department VAT numbers without GB prefix are not valid', () => {
    expect(isNotVatNumber('GD001')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that government department VAT numbers that are too short are not valid', () => {
    expect(isNotVatNumber('GBGD12')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that government department VAT numbers that are too long are not valid', () => {
    expect(isNotVatNumber('GBGD0123')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that health authority VAT numbers are valid', () => {
    expect(isNotVatNumber('GBHA599')).to.be.false // eslint-disable-line
  })

  it('should validate that health authority VAT numbers in non-standard format are valid ()', () => {
    expect(isNotVatNumber(' gb HA 599 ')).to.be.false // eslint-disable-line
  })

  it('should validate that health authority VAT numbers in non-standard format are valid ()', () => {
    expect(isNotVatNumber(' gb HA 599 ')).to.be.false // eslint-disable-line
  })

  it('should validate that health authority VAT numbers that don’t begin with 5–9 are not valid', () => {
    expect(isNotVatNumber('GBHA499')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that government department VAT numbers without GB prefix are not valid', () => {
    expect(isNotVatNumber('HA599')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that government department VAT numbers that are too short are not valid', () => {
    expect(isNotVatNumber('GBHA59')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should validate that government department VAT numbers that are too long are not valid', () => {
    expect(isNotVatNumber('GBHA5991')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start') // eslint-disable-line
  })

  it('should not be valid when mandatory text is blank', () => {
    expect(isNotVatNumber('')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start')
  })

  it('should not be valid when wrong prefix', () => {
    expect(isNotVatNumber('GBAB123')).to.be.equal('Enter a valid VAT number, including ‘GB’ at the start')
  })
})
