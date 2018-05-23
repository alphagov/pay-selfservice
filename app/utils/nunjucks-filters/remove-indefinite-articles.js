// removes indefinite articles (a/an)
// removes definite articles (the)

module.exports = string => {
  return string.replace(/\ba\s|\ban\s|\bthe\s/gi, '')
}
