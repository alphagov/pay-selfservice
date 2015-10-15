require(__dirname + '/utils/html_assertions.js');

var renderTemplate = require(__dirname + '/utils/test_renderer.js').render;

describe('The error view', function () {
  it('should render an error message', function () {
    var msg = 'shut up and take my money!';
    var body = renderTemplate('error', {'message': msg});
    body.should.containSelector('#errorMsg').withText(msg);
  });
});
