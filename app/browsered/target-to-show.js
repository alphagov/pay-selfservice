'use strict'

// The following works without JS as it uses CSS :target pseudo selector.
// But with JS it will be a enhanced to be a little smoother (as href targets make the page jump)
// <div>
//   <a class="target-to-show--toggle" href="#delete-{{ product.externalId }}">Delete</a>
//   <div class="target-to-show" id="delete-{{ product.externalId }}">
//     <a class="button delete" href="manage/delete/{{ product.externalId }}">Yes, delete this link</a>
//     <a class="target-to-show--cancel" href="#main">Cancel</a>
//   </div>
// </div>

module.exports.init = () => {
  const toggles = Array.prototype.slice.call(document.querySelectorAll('.target-to-show--toggle'))

  if (toggles) {
    toggles.forEach(toggle => {
      const allToggleTargets = Array.prototype.slice.call(document.getElementsByClassName('target-to-show'))
      const toggleTarget = document.getElementById(toggle.getAttribute('href').split('#')[1])
      const cancel = Array.prototype.slice.call(toggleTarget.getElementsByClassName('target-to-show--cancel'))[0]
      const toggleContainer = Array.prototype.slice.call(document.getElementsByClassName('target-to-show--toggle-container'))[0]

      toggle.addEventListener('click', e => {
        e.preventDefault()
        allToggleTargets.forEach(target => {
          target.style.display = 'none'
        })
        toggleTarget.style.display = 'block'

        const targetHeading = toggleTarget.querySelector('.target-to-show__heading')
        if (targetHeading) targetHeading.focus()

        if (toggleContainer) toggleContainer.style.display = 'none'
      }, false)

      if (cancel) {
        cancel.addEventListener('click', e => {
          e.preventDefault()
          toggleTarget.style.display = 'none'
          if (toggleContainer) toggleContainer.style.display = 'block'
        }, false)
      }
    })
  }
}
