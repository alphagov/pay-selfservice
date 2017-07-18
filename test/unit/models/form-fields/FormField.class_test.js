'use strict';
const {expect} = require('chai')
const FormField = require('../../../../app/models/form-fields/FormField.class')
let err, result;

describe('Class: FormField', () => {

  beforeEach(() => {
    err = result = undefined
  })

  describe('Constructor', () => {

    it(`should instantiate if provided a 'name'`, () => {
      try {
        result = new FormField('test')
      } catch(e) {
        err = e
      }
      expect(err).to.be.undefined
      expect(result instanceof FormField).to.equal(true)
    })

    it(`should not instantiate if not provided a 'name'`, () => {
      try {
        result = new FormField()
      } catch(e) {
        err = e
      }
      expect(err instanceof TypeError).to.equal(true)
      expect(result).to.be.undefined
    })

  })

  describe('Method: addValidator', () => {

    it('should add the validation function if the name is unique', () => {
      try {
        result = new FormField('test')
        result.addValidator('new-validator', () => true)
      } catch(e) {
        err = e
      }
      expect(err).to.be.undefined
      expect(result.___.validators).to.have.property('new-validator')
    })

    it('should not add the validation function if the name is not unique', () => {
      try {
        result = new FormField('test')
        result.addValidator('new-validator', () => true)
        result.addValidator('new-validator', () => false)
      } catch(e) {
        err = e
      }
      expect(err instanceof Error).to.equal(true)
    })
  })

  describe('Method: validate', () => {

    it('should return true if valid and set the errors object to be an empty object', () => {

      result = new FormField('test')
      result.addValidator('new-validator', () => true)
      result.errors = {'error-example': true}

      expect(result.validate()).to.equal(true)
      expect(result.errors).to.deep.equal({})
    })

    it('should return false if invalid and add the keys of any errors to the errors object', () => {

      result = new FormField('test')
      result.addValidator('new-error', () => false)

      expect(result.validate()).to.equal(false)
      expect(result.errors).to.deep.equal({
        'new-error': true
      })
    })
  })



})