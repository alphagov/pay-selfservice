// Works in combination with the following data-attributes
// data-click-events - this just sets the thing up designed to work with A, INPUT[type~="button radio checkbox"], BUTTON
// OR you can put it on a whole div/form and it will track all the aforementioned elements within it
// data-click-category="Header" - this is the category GA will put it in
// data-click-action="Navigation link clicked" - this is the action GA will label it

'use strict'

module.exports.init = () => {
  const elementsToTrack = Array.prototype.slice.call(document.querySelectorAll('[data-click-events]'))

  if (elementsToTrack && typeof ga === 'function') {
    setupTracking(elementsToTrack)
  }
}

const setupTracking = elements => {
  elements.forEach(element => {
    const eventCategory = element.dataset.clickCategory
    let eventAction = element.dataset.clickAction

    switch (element.tagName) {
      case 'A':
      case 'BUTTON':
      case 'INPUT':
        const label = element.tagName === 'INPUT' ? element.value : element.innerText
        addListener(element, eventCategory, eventAction, label)
        break
      default:
        const childClickables = Array.prototype.slice.call(element.querySelectorAll(
          'a, button, input[type~="button radio checkbox"], summary'
        ))

        if (childClickables.length) {
          childClickables.forEach(element => {
            let label
            switch (element.tagName) {
              case 'A':
              case 'BUTTON':
              case 'SUMMARY':
                label = element.innerText
                break
              default:
                label = element.value
                break
            }

            addListener(element, eventCategory, eventAction, label)
          })
        }
        break
    }
  })
}

const addListener = (element, category, action, label) => {
  if (element.tagName === 'SUMMARY') {
    action = `${action} opened`
  }
  element.addEventListener('click', () => {
    action = toggleAction(element, action)
    ga('send', 'event', category, action, label) // eslint-disable-line no-undef
  })
}

const toggleAction = (element, action) => {
  const actionWords = action.split(' ')
  const oldState = actionWords[actionWords.length - 1]
  const newState = element.parentElement.hasAttribute('open') ? 'closed' : 'opened'
  return action.replace(oldState, newState)
}
