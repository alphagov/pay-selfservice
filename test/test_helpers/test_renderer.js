const nunjucks = require('nunjucks')
const nunjucksFilters = require('../../app/utils/nunjucks-filters')

const environment = nunjucks.configure([
  './app/views',
  './govuk_modules/govuk_template/views/layouts'
], {
  trimBlocks: true, // automatically remove trailing newlines from a block/tag
  lstripBlocks: true // automatically remove leading whitespace from a block/tag
})

// Load custom Nunjucks filters
for (let name in nunjucksFilters) {
  let filter = nunjucksFilters[name]
  environment.addFilter(name, filter)
}

function render (templateName, templateData) {
  const pathToTemplate = templateName + '.njk'
  return environment.render(pathToTemplate, templateData)
}

module.exports = {
  render: render
}
