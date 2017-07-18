var Hogan = require('hogan.js')
var fs = require('fs')
var path = require('path')
var govukDir = path.normalize(path.join(__dirname, '/../govuk_modules'))
var govukConfig = require(path.join(__dirname, '/template-config'))
var compiledTemplate
var govukTemplate

module.exports = {
  convert: function () {
    govukTemplate = fs.readFileSync(govukDir + '/govuk_template/views/layouts/govuk_template.html', { encoding: 'utf-8' })
    compiledTemplate = Hogan.compile(govukTemplate)
    fs.writeFileSync(govukDir + '/govuk_template/views/layouts/govuk_template.html', compiledTemplate.render(govukConfig), { encoding: 'utf-8' })
  }
}
