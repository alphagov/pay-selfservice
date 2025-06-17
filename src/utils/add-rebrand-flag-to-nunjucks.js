module.exports = function (nunjucksEnvironment) {
  if (process.env.ENABLE_REBRAND === 'true') {
    nunjucksEnvironment.addGlobal('govukRebrand', true)
  }
}
