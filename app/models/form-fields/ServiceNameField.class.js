'use strict'

const FormField = require('./FormField.class')

class ServiceNameField extends FormField {
  constructor(value) {
    super('service-name', true)
    if(value !== undefined) this.value = value;

  }
}

module.exports = ServiceNameField