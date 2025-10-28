// TODO: we should probably do some browser testing in this project to prove this all works as intended
import multiSelectTemplate from '@views/includes/multi-select.njk'
import { renderString } from 'nunjucks'

const SELECTORS = {
  enhance: 'select[data-enhance-multiple]',
  topLevel: '.multi-select',
  openButton: '.multi-select__title',
  closeButton: '.multi-select-dropdown__close-button',
  dropdown: '.multi-select-dropdown',
  scrollContainer: '.multi-select-dropdown__inner-container',
  item: '.govuk-checkboxes__input',
  currentSelections: '.multi-select-current-selections',
}

// http://youmightnotneedjquery.com/#ready
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}

const randomElementId = () => `el-${Math.floor(Math.random() * 100000 + 1)}`

const updateDisplayedValue = (elem) => {
  const allItems = [...elem.querySelectorAll(SELECTORS.item)]
  const selectedItemNames = allItems.filter((item) => item.checked).map((item) => item.labels[0].innerHTML.trim())
  elem.querySelector(SELECTORS.currentSelections).innerText = selectedItemNames.length
    ? selectedItemNames.join(', ')
    : allItems[0].labels[0].innerHTML.trim()
}

const onItemChange = (event) => {
  const { target } = event
  const topLevel = target.closest(SELECTORS.topLevel)
  const allItems = [...topLevel.querySelectorAll(SELECTORS.item)]
  const items = allItems.filter((item) => item.value)
  const allCheckbox = allItems.find((item) => !item.value)

  target.focus()

  if (target.value) {
    allCheckbox.checked = false
  } else {
    items.forEach((item) => {
      item.checked = !target.checked
    })
  }

  updateDisplayedValue(topLevel)
}

const onOpenButtonClick = (event) => {
  const { target } = event
  event.stopPropagation()

  // Close all other dropdowns first
  document.querySelectorAll(SELECTORS.dropdown).forEach((dropdown) => {
    dropdown.style.visibility = 'hidden'
    dropdown.closest(SELECTORS.topLevel).querySelector(SELECTORS.openButton).setAttribute('aria-expanded', 'false')
  })

  const topLevel = target.closest(SELECTORS.topLevel)
  const dropdown = topLevel.querySelector(SELECTORS.dropdown)
  dropdown.style.visibility = 'visible'
  dropdown.querySelector(SELECTORS.item).focus()
  target.setAttribute('aria-expanded', 'true')
}

const onCloseButtonClick = (event) => {
  const { target } = event
  event.stopPropagation()
  const multiSelect = target.closest(SELECTORS.topLevel)
  const dropdown = multiSelect.querySelector(SELECTORS.dropdown)
  const openButton = multiSelect.querySelector(SELECTORS.openButton)
  dropdown.style.visibility = 'hidden'
  openButton.setAttribute('aria-expanded', 'false')
  openButton.focus()
}

const closeMultiSelectOnEscapeKeypress = () => {
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll(SELECTORS.dropdown).forEach((element) => {
        if (element.style.visibility === 'visible') {
          element.style.visibility = 'hidden'
          element.closest(SELECTORS.topLevel).querySelector(SELECTORS.openButton).focus()
        }
      })
    }
  })
}

function setDropdownHeight(openButton, scrollContainer, items) {
  const minVisibleItems = 3.5

  const itemHeight = items.length > 0 ? items[0].offsetHeight : 0
  if (!itemHeight) return

  const availableSpace = window.innerHeight - openButton.getBoundingClientRect().top
  const maxVisibleItems = Math.max(minVisibleItems, Math.floor(availableSpace / itemHeight) - 1.5)

  if (availableSpace - itemHeight * items.length < 0) {
    scrollContainer.style.maxHeight = `${maxVisibleItems * itemHeight}px`
  } else {
    scrollContainer.style.maxHeight = ''
  }
}

const closeMultiSelectOnOutOfBoundsClick = () => {
  document.addEventListener('click', (event) => {
    document.querySelectorAll(SELECTORS.dropdown).forEach((dropdown) => {
      if (!dropdown.contains(event.target) && !event.target.closest(SELECTORS.openButton)) {
        dropdown.style.visibility = 'hidden'
        dropdown.closest(SELECTORS.topLevel).querySelector(SELECTORS.openButton).setAttribute('aria-expanded', false)
      }
    })
  })
}

const progressivelyEnhanceSelects = () => {
  document.querySelectorAll(SELECTORS.enhance).forEach((select) => {
    const configuration = {
      id: select.id || randomElementId(),
      name: select.getAttribute('name'),
      items: [...select.querySelectorAll('option')].map((option) => ({
        text: option.innerText,
        value: option.value,
        id: option.id || randomElementId(),
        checked: option.hasAttribute('selected'),
      })),
    }

    select.outerHTML = renderString(multiSelectTemplate, configuration)
    const newMultiSelect = document.getElementById(`${configuration.id}__container`)

    const openButton = newMultiSelect.querySelector(SELECTORS.openButton)
    const closeButton = newMultiSelect.querySelector(SELECTORS.closeButton)
    const items = newMultiSelect.querySelectorAll(SELECTORS.item)
    const dropdown = newMultiSelect.querySelector(SELECTORS.dropdown)
    const scrollContainer = newMultiSelect.querySelector(SELECTORS.scrollContainer)

    setDropdownHeight(openButton, scrollContainer, items)

    openButton.addEventListener('click', (event) => {
      setDropdownHeight(openButton, scrollContainer, items)
      onOpenButtonClick(event)
    })
    closeButton.addEventListener('click', onCloseButtonClick)
    items.forEach((item) => item.addEventListener('change', onItemChange))

    updateDisplayedValue(dropdown.parentNode)

    window.addEventListener('resize', () => {
      setDropdownHeight(openButton, scrollContainer, items)
    })
  })

  closeMultiSelectOnEscapeKeypress()
  closeMultiSelectOnOutOfBoundsClick()
}

export const initMultiSelects = () => {
  ready(progressivelyEnhanceSelects)
}

export default initMultiSelects
