"use strict"
// TODO: we should probably do some browser testing in this project to prove this all works as intended

// NPM Dependencies
const $ = require('jquery')

// Local Dependencies
const multiSelect = require('../views/includes/multi-select.html')

// Variables
// Selectors
const DOCUMENT_SELECTOR = window.document
const ENHANCEMENT_SELECTOR = "select[data-enhance-multiple]"
const TOP_LEVEL_SELECTOR = 'div.multi-select'
const OPEN_BUTTON_SELECTOR = 'button.multi-select-title'
const CLOSE_BUTTON_SELECTOR = 'div.multi-select-dropdown-close-area'
const DROPDOWN_SELECTOR = 'div.multi-select-dropdown'
const ITEM_SELECTOR = 'input.multi-select-item'
const ALL_SELECTOR = `${ITEM_SELECTOR}[value=""]`

exports.enableMultiSelects = () => $(DOCUMENT_SELECTOR).ready(progressivelyEnhanceSelects)

function progressivelyEnhanceSelects() {
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
        return {value,id,checked,text}
      })
    }
    select.replaceWith(multiSelect.render(configuration))
    const newMultiSelect = $(`${TOP_LEVEL_SELECTOR}#${configuration.id}`)

    newMultiSelect.find(OPEN_BUTTON_SELECTOR).click(onOpenButtonClick)
    newMultiSelect.find(CLOSE_BUTTON_SELECTOR).click(onCloseAreaClick)
    newMultiSelect.find(ITEM_SELECTOR).change(onItemChange)
    newMultiSelect.find(ITEM_SELECTOR).blur(onItemBlur)
    updateDisplayedValue.call(newMultiSelect.find(DROPDOWN_SELECTOR));

  })
}

function onItemBlur() {
  setTimeout(() => {
    if (![...$(this).closest(DROPDOWN_SELECTOR).find(`${ITEM_SELECTOR}:focus`)].length > 0) {
      dropdown.css('visibility', 'hidden')
    }
  }, 100)
}

function onOpenButtonClick() {
  $(this).closest(TOP_LEVEL_SELECTOR).find(OPEN_BUTTON_SELECTOR).blur()
  $(this).closest(TOP_LEVEL_SELECTOR).find(DROPDOWN_SELECTOR).css('visibility', 'visible')
  $(this).closest(TOP_LEVEL_SELECTOR).find(DROPDOWN_SELECTOR).find(ITEM_SELECTOR)[0].focus()
}

function onCloseAreaClick() {
  const OPEN_BUTTON = $(this).closest(TOP_LEVEL_SELECTOR).find(OPEN_BUTTON_SELECTOR)
  const DROPDOWN = $(this).closest(TOP_LEVEL_SELECTOR).find(DROPDOWN_SELECTOR)
  DROPDOWN.css('visibility', 'hidden')
  OPEN_BUTTON.focus()
}

function onItemChange() {
  const checked = this.checked
  const items = [...$(this).closest(TOP_LEVEL_SELECTOR).find(ITEM_SELECTOR)]
    .filter(item => item.value)

  if (this.value) {
    $(this).closest(TOP_LEVEL_SELECTOR).find(ALL_SELECTOR)
      .prop('checked', !items.map(item => item.checked).includes(true))
  } else {
    items.forEach(item => $(item).prop('checked', !checked))
  }

  updateDisplayedValue.call(this)
}

function updateDisplayedValue() {
  const TOP_LEVEL = $(this).closest(TOP_LEVEL_SELECTOR)
  const buttonText = [...TOP_LEVEL.find(DROPDOWN_SELECTOR).find(ITEM_SELECTOR)]
    .filter(item => item.checked)
    .map(item => $(item).parent().text().trim())
    .join(', ')

  TOP_LEVEL.find(OPEN_BUTTON_SELECTOR).text(buttonText)
}

function randomElementId() {
  return `el-${Math.floor((Math.random() * 100000) + 1)}`
}