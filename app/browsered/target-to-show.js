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
  const toggles = document.querySelectorAll('.target-to-show--toggle')

  if (toggles) {
    toggles.forEach(toggle => {
      const toggleTarget = toggle.parentElement.querySelector('.target-to-show')
      const cancel = toggle.parentElement.querySelector('.target-to-show--cancel')

      toggle.addEventListener('click', e => {
        e.preventDefault()
        toggleTarget.style.display = 'block'
      }, false)

      if (cancel) {
        cancel.addEventListener('click', e => {
          e.preventDefault()
          toggleTarget.style.display = 'none'
        }, false)
      }
    })
  }
}
