const path = require('path')
const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The error view', function () {
  it('should render an error message', function () {
    const msg = 'shut up and take my money!'
    const body = renderTemplate('error', { message: msg })
    body.should.containSelector('#errorMsg').withText(msg)
  })
})
