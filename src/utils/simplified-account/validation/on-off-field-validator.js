function validateOnOffField (userInput) {
  if (userInput === 'on') {
    return { value: true }
  }
  if (userInput === 'off') {
    return { value: false }
  }
  return {
    error: true
  }
}

module.exports = {
  validateOnOffField
}
