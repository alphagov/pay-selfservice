// removes indefinate articles (a/an)
// removes definate articles (the)

module.exports = string => {
  return string.replace(/\ba\s|\ban\s|\bthe\s/gi, '')
}
