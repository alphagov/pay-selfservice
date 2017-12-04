const nunjucks = require('nunjucks')
const environment = nunjucks.configure([
  './app/views',
  './govuk_modules/govuk_template/views/layouts'
], {
  trimBlocks: true, // automatically remove trailing newlines from a block/tag
  lstripBlocks: true // automatically remove leading whitespace from a block/tag
})

function render (templateName, templateData) {
  const pathToTemplate = templateName + '.njk'
  return environment.render(pathToTemplate, templateData)
}

module.exports = {
  render: render
}
