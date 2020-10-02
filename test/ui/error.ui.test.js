var path = require('path')
var renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The error view', () => {
  it('should render an error message', () => {
    var msg = 'shut up and take my money!'
    var body = renderTemplate('error', { 'message': msg })
    expect(body).containSelector('#errorMsg').withText(msg)
  })
})
