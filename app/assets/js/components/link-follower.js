(function() {
  linkFollower = function() {
    var init = function() {
      Array.prototype.slice.call(document.querySelectorAll('[data-follow-link]')).forEach(
        function(link) {
          link.addEventListener('click', followLink, false)
        }
      )
    },

    followLink = function(event) {
      var link = event.target.parentNode.getAttribute('data-link');
      if (link) window.location.href = link
    };

    init();
  }
  linkFollower();
})();
