'use strict'

const path = require('path')

const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The email body view', function () {
  it('should display the automatically generate email disclaimer', function () {
    const templateData = {
      'customEmailText': 'Custom text'
    }
    const body = renderTemplate('email-notifications/email-confirmation-body', templateData)

    body.should.not.containSelector('span.grey.push-bottom.qa-custom-p')
    body.should.containSelector('.qa-custom-p').withText('Custom text')
    body.should.containSelector('p').withText('This email address is not monitored. If you have any questions about your payment, contact the service you made the payment to directly.')
  })

  it('should indicate custom text is optional by default', function () {
    const templateData = {
      'serviceName': 'service name'
    }

    const body = renderTemplate('email-notifications/email-confirmation-body', templateData)

    body.should.containSelector('.qa-custom-p').withText('*Optional custom paragraph - add this below*')
  })
})
