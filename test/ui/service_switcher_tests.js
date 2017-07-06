const path = require('path')
const should = require('chai').should()   // eslint-disable-line
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The account switcher link', function () {
  it('should display My Services link', function () {
    let body = renderTemplate('layout', {})

    body.should.containSelector('#my-services').withExactText('My Services')
  })

  it(`should render a blank h2 tag if service name is blank`, function () {
    let templateData = {
      'serviceName': ''
    }

    let body = renderTemplate('services/index', templateData)

    body.should.containSelector('h2#service-name').withExactText('')
  })

  it(`should render the service name in a h2 tag if service name is defined`, function () {
    let templateData = {
      'serviceName': 'Super Mega Service'
    }

    let body = renderTemplate('services/index', templateData)

    body.should.containSelector('h2#service-name').withExactText('Super Mega Service')
  })

  it('should display View Team Members link in switcher page', function () {
    let templateData = {}

    let body = renderTemplate('services/index', templateData)

    body.should.containSelector('a#view-team-members').withExactText('View team members')
  })

  it('should display Manage Team Members link in switcher page when user has permission to create users', function () {
    let templateData = {
      permissions: {
        users_service_create: true
      }
    }

    let body = renderTemplate('services/index', templateData)

    body.should.containSelector('a#manage-team-members').withExactText('Manage team members')
  })
})
