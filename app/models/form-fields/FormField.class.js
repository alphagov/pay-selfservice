'use strict'

const requiredFieldLeftBlank = require('./validators/required-field-left-blank')

class FormField {
  constructor (name, required) {
    if (!name || typeof name !== 'string') throw new TypeError('parameter \'name\' must be of type string')

    this.name = name
    this.errors = {}

    // Private Props
    Object.defineProperty(this, '___', {value: {}})
    this.___.validators = {}
    this.required = !!required
  }

  get required () {
    return this.___.required
  }

  set required (value) {
    this.___.required = !!value

    if (value) {
      this.addValidator('required-field-left-blank', requiredFieldLeftBlank)
    }
  }

  get value () {
    return this.___.value
  }

  set value (value) {
    this.___.value = value
  }

  addValidator (name, validationFunction) {
    if (this.___.validators[name]) throw new Error('Cannot set validator \'' + name + '\': validator already exists')
    this.___.validators[name] = validationFunction
  }

  validate () {
    this.errors = {}
    for (let validatorName in this.___.validators) {
      if (this.___.validators.hasOwnProperty(validatorName)) {
        if (!this.___.validators[validatorName](this.value)) this.errors[validatorName] = true
      }
    }

    return Object.keys(this.errors).length <= 0
  }
}

module.exports = FormField
