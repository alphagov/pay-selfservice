let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('Invite a team member view', () => {
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

  it('should render error, with back link', () => {
    templateData.enable_link = true
    let body = renderTemplate('error-logged-in', templateData)

    expect(body).containSelector('#error-title').withText('Not so big error')
    expect(body).containSelector('#error-message').withText('error, but do not worry')
    expect(body).containSelector('#back-link')
      .withAttribute('href', '/back-to-the-future')
    expect(body).containSelector('#back-link').withText('Back to the future')
  })

  it('should render error, without back link', () => {
    templateData.enable_link = false
    let body = renderTemplate('error-logged-in', templateData)

    expect(body).containSelector('#error-title').withText('Not so big error')
    expect(body).containSelector('#error-message').withText('error, but do not worry')
    expect(body).containNoSelector('#back-link')
  })
})
