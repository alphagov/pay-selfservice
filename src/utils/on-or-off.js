const boolToText = (input, trueText, falseText) => {
  return input === true ? trueText : falseText
}

const boolToOnOrOff = (input) => boolToText(input, 'On', 'Off')

const onOrOffToBool = (userInput) => {
  if (userInput === 'on') {
    return true
  }
  if (userInput === 'off') {
    return false
  }
  throw new Error('Value other than "on" or "off" used for boolean input.')
}

module.exports = {
  boolToText,
  boolToOnOrOff,
  onOrOffToBool
}
