let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('Invite a team member view', function () {
  let templateData
  beforeEach(() => {
    templateData = {
      error: {
        title: 'Not so big error',
        message: 'error, but do not worry'
      },
      link: {
        link: '/back-to-the-future',
        text: 'Back to the future'
      }
    }
  })

  it('should render error, with back link', function () {
    templateData.enable_link = true
    let body = renderTemplate('error_logged_in', templateData)

    body.should.containSelector('#error-title').withText('Not so big error')
    body.should.containSelector('#error-message').withText('error, but do not worry')
    body.should.containSelector('#back-link')
      .withAttribute('href', '/back-to-the-future')
    body.should.containSelector('#back-link').withText('Back to the future')
  })

  it('should render error, without back link', function () {
    templateData.enable_link = false
    let body = renderTemplate('error_logged_in', templateData)

    body.should.containSelector('#error-title').withText('Not so big error')
    body.should.containSelector('#error-message').withText('error, but do not worry')
    body.should.containNoSelector('#back-link')
  })
})
