'use strict'
// TODO: we should probably do some browser testing in this project to prove this all works as intended

// NPM Dependencies
const $ = require('jquery')

// Local Dependencies
const multiSelect = require('../views/includes/multi-select.njk')

// Variables
const MAXIMUM_VISIBLE_ITEMS = 8.5 // Maximum amount of items to show in dropdown
const MINIMUM_VISIBLE_ITEMS = 3.5 // Minimum amount of items to show in dropdown (assuming total is larger than this value)

// Selectors
const DOCUMENT_SELECTOR = window.document
const ENHANCEMENT_SELECTOR = 'select[data-enhance-multiple]'
const TOP_LEVEL_SELECTOR = '.multi-select'
const OPEN_BUTTON_SELECTOR = '.multi-select-title'
const CLOSE_BUTTON_SELECTOR = '.multi-select-dropdown-close-area'
const DROPDOWN_SELECTOR = '.multi-select-dropdown'
const SCROLL_CONTAINER_SELECTOR = '.multi-select-dropdown-inner-container'
const ITEM_SELECTOR = '.multi-select-item'
const ALL_SELECTOR = `${ITEM_SELECTOR}[value=""]`
const CURRENT_SELECTIONS = '.multi-select-current-selections'

exports.enableMultiSelects = () => $(DOCUMENT_SELECTOR).ready(progressivelyEnhanceSelects)

function progressivelyEnhanceSelects () {
  [...$(ENHANCEMENT_SELECTOR)].forEach(select => {
    select = $(select)
    const configuration = {
      id: select.id || randomElementId(),
      items: [...select.find('option')].map(option => {
        option = $(option)
        const text = option.text()
        const value = option.val()
        const id = option.id || randomElementId()
        const checked = option.attr('selected') === 'selected' || option.prop('selected')
        return {value, id, checked, text}
      })
    }
    select.replaceWith(multiSelect(configuration))
    const newMultiSelect = $(`${TOP_LEVEL_SELECTOR}#${configuration.id}`)
    const openButton = newMultiSelect.find(OPEN_BUTTON_SELECTOR)
    const closeButton = newMultiSelect.find(CLOSE_BUTTON_SELECTOR)
    const items = newMultiSelect.find(ITEM_SELECTOR)
    const dropdown = newMultiSelect.find(DROPDOWN_SELECTOR)
    const scrollContainer = newMultiSelect.find(SCROLL_CONTAINER_SELECTOR)
    openButton.click(onOpenButtonClick)
    closeButton.click(onCloseAreaClick)
    items.change(onItemChange)
    items.blur(onItemBlur)
    const itemHeight = ([...items].map(item => $(item).parent().height()).reduce((sum, value) => sum + value) / items.length)
    const maxVisibleItems = Math.min(Math.floor((($(window).height() - openButton.offset().top) / itemHeight) - 0.5) + 0.5, MAXIMUM_VISIBLE_ITEMS)
    const visibleItems = Math.max(maxVisibleItems, MINIMUM_VISIBLE_ITEMS)
    if (($(window).height() - openButton.offset().top) - itemHeight * items.length < 0) {
      scrollContainer.css('max-height', visibleItems * itemHeight)
    }
    updateDisplayedValue.call(dropdown)
  })
}

function onItemBlur () {
  setTimeout(() => {
    const dropdown = $(this).closest(DROPDOWN_SELECTOR)
    if ([...dropdown.find(`${ITEM_SELECTOR}:focus`)].length <= 0) {
      dropdown.css('visibility', 'hidden')
    }
  }, 100)
}

function onOpenButtonClick () {
  $(this).closest(TOP_LEVEL_SELECTOR).find(OPEN_BUTTON_SELECTOR).blur()
  $(this).closest(TOP_LEVEL_SELECTOR).find(DROPDOWN_SELECTOR).css('visibility', 'visible')
  $(this).closest(TOP_LEVEL_SELECTOR).find(DROPDOWN_SELECTOR).find(ITEM_SELECTOR)[0].focus()
}

function onCloseAreaClick () {
  const OPEN_BUTTON = $(this).closest(TOP_LEVEL_SELECTOR).find(OPEN_BUTTON_SELECTOR)
  const DROPDOWN = $(this).closest(TOP_LEVEL_SELECTOR).find(DROPDOWN_SELECTOR)
  DROPDOWN.css('visibility', 'hidden')
  OPEN_BUTTON.focus()
}

function onItemChange () {
  const checked = this.checked
  const items = [...$(this).closest(TOP_LEVEL_SELECTOR)
    .find(ITEM_SELECTOR)]
    .filter(item => item.value)

  $(this).focus()

  if (this.value) {
    $(this)
      .closest(TOP_LEVEL_SELECTOR)
      .find(ALL_SELECTOR)
      .prop('checked', !items.map(item => item.checked).includes(true))
  } else {
    items.forEach(item => $(item).prop('checked', !checked))
  }

  updateDisplayedValue.call(this)
}

function updateDisplayedValue () {
  const TOP_LEVEL = $(this).closest(TOP_LEVEL_SELECTOR)
  const buttonText = [...TOP_LEVEL.find(DROPDOWN_SELECTOR).find(ITEM_SELECTOR)]
    .filter(item => item.checked)
    .map(item => $(item).parent().text().trim())
    .join(', ')

  TOP_LEVEL.find(`${CURRENT_SELECTIONS}`).text(buttonText)
}

function randomElementId () {
  return `el-${Math.floor((Math.random() * 100000) + 1)}`
}
