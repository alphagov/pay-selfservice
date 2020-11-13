'use strict'
// TODO: we should probably do some browser testing in this project to prove this all works as intended

const multiSelect = require('../views/includes/multi-select.njk')

// Polyfills introduced as a temporary fix to make Smoketests pass. See PP-3489
require('./polyfills')

// Variables
const MAXIMUM_VISIBLE_ITEMS = 8.5 // Maximum amount of items to show in dropdown
const MINIMUM_VISIBLE_ITEMS = 3.5 // Minimum amount of items to show in dropdown (assuming total is larger than this value)

// Selectors
const ENHANCEMENT_SELECTOR = [...document.querySelectorAll('select[data-enhance-multiple]')]
const TOP_LEVEL_SELECTOR = '.multi-select'
const OPEN_BUTTON_SELECTOR = '.multi-select-title'
const CLOSE_BUTTON_SELECTOR = '.multi-select-dropdown-close-area'
const DROPDOWN_SELECTOR = '.multi-select-dropdown'
const SCROLL_CONTAINER_SELECTOR = '.multi-select-dropdown-inner-container'
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
    select.outerHTML = multiSelect(configuration)
    const newMultiSelect = document.getElementById(`${configuration.id}__container`)

    const openButton = [...newMultiSelect.querySelectorAll(OPEN_BUTTON_SELECTOR)][0]
    const closeButton = [...newMultiSelect.querySelectorAll(CLOSE_BUTTON_SELECTOR)][0]
    const items = [...newMultiSelect.querySelectorAll(ITEM_SELECTOR)]

    const dropdown = [...newMultiSelect.querySelectorAll(DROPDOWN_SELECTOR)][0]
    const scrollContainer = [...newMultiSelect.querySelectorAll(SCROLL_CONTAINER_SELECTOR)][0]
    openButton.addEventListener('click', onOpenButtonClick, false)
    closeButton.addEventListener('click', onCloseAreaClick, false)
    items.forEach(item => {
      item.addEventListener('change', onItemChange, false)
      item.addEventListener('blur', onItemBlur, false)
    })
    const itemHeight = ([...items].map(item => item.parentNode.offsetHeight).reduce((sum, value) => sum + value) / items.length)
    const maxVisibleItems = Math.min(Math.floor(((window.innerHeight - openButton.getBoundingClientRect().top) / itemHeight) - 0.5) + 0.5, MAXIMUM_VISIBLE_ITEMS)
    const visibleItems = Math.max(maxVisibleItems, MINIMUM_VISIBLE_ITEMS)
    if ((window.innerHeight - openButton.getBoundingClientRect().top) - itemHeight * items.length < 0) {
      scrollContainer.style.maxHeight = `${visibleItems * itemHeight}px`
    }
    updateDisplayedValue(dropdown.parentNode)
  })
}

const onItemBlur = event => {
  const dropdown = event.target.closest(DROPDOWN_SELECTOR)
  setTimeout(() => {
    if ([...dropdown.querySelectorAll(`${ITEM_SELECTOR}:focus`)].length <= 0) {
      dropdown.style.visibility = 'hidden'
    }
  }, 100)
}

const onOpenButtonClick = event => {
  const { target } = event
  target.blur();
  [...target.closest(TOP_LEVEL_SELECTOR).querySelectorAll(DROPDOWN_SELECTOR)][0].style.visibility = 'visible';
  [...target.closest(TOP_LEVEL_SELECTOR).querySelectorAll(ITEM_SELECTOR)][0].focus()
  target.setAttribute('aria-expanded', true)
}

const onCloseAreaClick = event => {
  const { target } = event;
  [...target.closest(TOP_LEVEL_SELECTOR).querySelectorAll(OPEN_BUTTON_SELECTOR)][0].focus();
  [...target.closest(TOP_LEVEL_SELECTOR).querySelectorAll(DROPDOWN_SELECTOR)][0].style.visibility = 'hidden'
  target.setAttribute('aria-expanded', false)
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
