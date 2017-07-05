const path = require('path')
const Hogan = require('hogan.js')
const fs = require('fs')
const govukDir = path.normalize(path.join(__dirname, '/../govuk_modules'))
const govukConfig = require(path.join(__dirname, '/template-config'))
let compiledTemplate
let govukTemplate

module.exports = {
  convert: function () {
    govukTemplate = fs.readFileSync(govukDir + '/govuk_template/views/layouts/govuk_template.html', { encoding: 'utf-8' })
    compiledTemplate = Hogan.compile(govukTemplate)
    fs.writeFileSync(govukDir + '/govuk_template/views/layouts/govuk_template.html', compiledTemplate.render(govukConfig), { encoding: 'utf-8' })
  }
}
