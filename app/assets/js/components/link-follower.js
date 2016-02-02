(function(){
  linkFollower = function(){
    var init = function(){
      $(document.body).on('click','[data-follow-link]',followLink);
    },

    followLink = function(){
      var link = $(this).attr('data-link');
      if (link) location.assign(link)
    };

    init();
  }
  linkFollower();

})();

