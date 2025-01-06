// TODO: we should probably do some browser testing in this project to prove this all works as intended
// Polyfills introduced as a temporary fix to make Smoketests pass. See PP-3489
require('./polyfills')
const nunjucks = require('nunjucks')

const multiSelectTemplate = `
<div id="{{ id }}__container" class="multi-select">
  <button type="button"
          class="multi-select__title"
          id="{{ id }}" aria-expanded="false">
    <div><span class="govuk-visually-hidden">Currently selected: </span><span
        class="multi-select-current-selections"></span></div>
  </button>
  <div role="group" aria-labelledby="option-select-title-{{ name }}"
       class="multi-select-dropdown"
       id="list-of-sectors-{{ name }}"
       style="visibility:hidden;">
    <button type="button" class="govuk-button govuk-button--secondary multi-select-dropdown__close-button">Close</button>
    <div class="multi-select-dropdown__inner-container govuk-checkboxes govuk-checkboxes--small" data-module="govuk-checkboxes">
      {% for item in items %}
        <div class="govuk-checkboxes__item">
          <input class="govuk-checkboxes__input" name="{{ name }}" value="{{ item.value }}" id="{{ item.id }}"
                 type="checkbox" {% if item.checked %}checked{% endif %}>
          <label for="{{ item.id }}" class="govuk-label govuk-checkboxes__label">{{ item.text }}</label>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
`

const MAXIMUM_VISIBLE_ITEMS = 8.5 // Maximum amount of items to show in dropdown
const MINIMUM_VISIBLE_ITEMS = 3.5 // Minimum amount of items to show in dropdown (assuming total is larger than this value)

const ENHANCEMENT_SELECTOR = [...document.querySelectorAll('select[data-enhance-multiple]')]
const TOP_LEVEL_SELECTOR = '.multi-select'
const OPEN_BUTTON_SELECTOR = '.multi-select__title'
const CLOSE_BUTTON_SELECTOR = '.multi-select-dropdown__close-button'
const DROPDOWN_SELECTOR = '.multi-select-dropdown'
const SCROLL_CONTAINER_SELECTOR = '.multi-select-dropdown__inner-container'
const ITEM_SELECTOR = '.govuk-checkboxes__input'
const CURRENT_SELECTIONS = '.multi-select-current-selections'

// http://youmightnotneedjquery.com/#ready
function ready (fn) {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}

exports.enableMultiSelects = () => {
  ready(progressivelyEnhanceSelects)
}

function progressivelyEnhanceSelects () {
  ENHANCEMENT_SELECTOR.forEach(select => {
    const configuration = {
      id: select.id || randomElementId(),
      name: select.getAttribute('name'),
      items: [...select.querySelectorAll('option')].map(option => {
        const text = option.innerText
        const value = option.value
        const id = option.id || randomElementId()
        const checked = option.hasAttribute('selected')
        return { value, id, checked, text }
      })
    }
    select.outerHTML = nunjucks.renderString(multiSelectTemplate, configuration)
    const newMultiSelect = document.getElementById(`${configuration.id}__container`)

    const openButton = [...newMultiSelect.querySelectorAll(OPEN_BUTTON_SELECTOR)][0]
    const closeButton = [...newMultiSelect.querySelectorAll(CLOSE_BUTTON_SELECTOR)][0]
    const items = [...newMultiSelect.querySelectorAll(ITEM_SELECTOR)]

    const dropdown = [...newMultiSelect.querySelectorAll(DROPDOWN_SELECTOR)][0]
    const scrollContainer = [...newMultiSelect.querySelectorAll(SCROLL_CONTAINER_SELECTOR)][0]

    openButton.addEventListener('click', onOpenButtonClick, false)
    closeButton.addEventListener('click', onCloseButtonClick, false)
    items.forEach(item => {
      item.addEventListener('change', onItemChange, false)
    })
    const itemHeight = ([...items].map(item => item.parentNode.offsetHeight).reduce((sum, value) => sum + value) / items.length)
    const maxVisibleItems = Math.min(Math.floor(((window.innerHeight - openButton.getBoundingClientRect().top) / itemHeight) - 0.5) + 0.5, MAXIMUM_VISIBLE_ITEMS)
    const visibleItems = Math.max(maxVisibleItems, MINIMUM_VISIBLE_ITEMS)
    if ((window.innerHeight - openButton.getBoundingClientRect().top) - itemHeight * items.length < 0) {
      scrollContainer.style.maxHeight = `${visibleItems * itemHeight}px`
    }
    updateDisplayedValue(dropdown.parentNode)
  })

  closeMultiSelectOnEscapeKeypress()
  closeMultiSelectOnOutOfBoundsClick()
}

const closeMultiSelectOnEscapeKeypress = function () {
  document.body.addEventListener('keydown', checkForEscapeKeyHandler, false)

  function checkForEscapeKeyHandler (e) {
    const keyCode = e.keyCode
    if (keyCode === 27) {
      const mulitSelectElements = document.querySelectorAll(DROPDOWN_SELECTOR)

      mulitSelectElements.forEach(element => {
        if (element.style.visibility === 'visible') {
          element.style.visibility = 'hidden'
          element.closest(TOP_LEVEL_SELECTOR).querySelector(OPEN_BUTTON_SELECTOR).focus()
        }
      })
    }
  }
}

const closeMultiSelectOnOutOfBoundsClick = function () {
  // close if user clicks outside the dropdown
  document.addEventListener('click', (event) => {
    const dropdowns = document.querySelectorAll(DROPDOWN_SELECTOR)
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(event.target) &&
        !event.target.closest(OPEN_BUTTON_SELECTOR)) {
        dropdown.style.visibility = 'hidden'
        dropdown.closest(TOP_LEVEL_SELECTOR)
          .querySelector(OPEN_BUTTON_SELECTOR)
          .setAttribute('aria-expanded', false)
      }
    })
  }, false)
}

const onCloseButtonClick = event => {
  const { target } = event
  event.stopPropagation()
  const multiSelect = target.closest(TOP_LEVEL_SELECTOR)
  const dropdown = multiSelect.querySelector(DROPDOWN_SELECTOR)
  const openButton = multiSelect.querySelector(OPEN_BUTTON_SELECTOR)
  dropdown.style.visibility = 'hidden'
  openButton.setAttribute('aria-expanded', false)
  openButton.focus()
}

const onOpenButtonClick = event => {
  const { target } = event
  event.stopPropagation()

  // close all other dropdowns first
  document.querySelectorAll(DROPDOWN_SELECTOR).forEach(dropdown => {
    dropdown.style.visibility = 'hidden'
    dropdown.closest(TOP_LEVEL_SELECTOR)
      .querySelector(OPEN_BUTTON_SELECTOR)
      .setAttribute('aria-expanded', false)
  })

  const dropdown = target.closest(TOP_LEVEL_SELECTOR).querySelector(DROPDOWN_SELECTOR)
  dropdown.style.visibility = 'visible'
  dropdown.querySelector(ITEM_SELECTOR).focus()
  target.setAttribute('aria-expanded', true)
}

const onItemChange = event => {
  const { target } = event
  const allItems = [...target.closest(TOP_LEVEL_SELECTOR)
    .querySelectorAll(ITEM_SELECTOR)]
  const items = allItems.filter(item => item.value)
  const allCheckbox = allItems.filter(item => !item.value)[0]

  target.focus()

  if (target.value) {
    allCheckbox.checked = false
  } else {
    (
      items.forEach(item => {
        item.checked = !target.checked
      })
    )
  }

  updateDisplayedValue(target.closest(TOP_LEVEL_SELECTOR))
}

const updateDisplayedValue = elem => {
  const allItems = [...elem.querySelectorAll(ITEM_SELECTOR)]
  const selectedItemNames = allItems.filter(item => item.checked).map(item => {
    return item.labels[0].innerHTML.trim()
  })
  const buttonText = selectedItemNames.length ? selectedItemNames.join(', ') : allItems[0].labels[0].innerHTML.trim();

  [...elem.querySelectorAll(CURRENT_SELECTIONS)][0].innerText = buttonText
}

const randomElementId = () => {
  return `el-${Math.floor((Math.random() * 100000) + 1)}`
}
