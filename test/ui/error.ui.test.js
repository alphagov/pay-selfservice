const renderTemplate = require('@test/test-helpers/html-assertions').render

describe('The error view', function () {
  it('should render an error message', function () {
    const msg = 'shut up and take my money!'
    const body = renderTemplate('error', { message: msg })
    body.should.containSelector('#errorMsg').withText(msg)
  })
})
