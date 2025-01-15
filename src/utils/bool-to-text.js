const boolToText = (input, trueText, falseText) => {
  return input === true ? trueText : falseText
}

module.exports = {
  boolToText,
  boolToOnOrOff: (input) => boolToText(input, 'On', 'Off')
}
