const boolToText = (input, trueText, falseText) => {
  return input === true ? trueText : falseText
}

const boolToOnOrOff = (input) => boolToText(input, 'On', 'Off')

const onOrOffToBool = (userInput) => {
  if (userInput === 'on') {
    return { value: true }
  }
  if (userInput === 'off') {
    return { value: false }
  }
  return { error: true }
}

module.exports = {
  boolToText,
  boolToOnOrOff,
  onOrOffToBool
}
