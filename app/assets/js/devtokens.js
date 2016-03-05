$(document).ready(function(){
  "use strict";

  $('.js-toggle-description').on('click', toggleDescription);
  $('.js-toggle-revoke').on('click', toggleRevoke);
  $('.js-save-description').on('click', saveDescription);
  $('.js-revoke-token').on('click', revokeToken);

  function toggleDescription(evt) {
    toggle.call(this, '.js-edit-description');
    toggle.call(this, '.js-edit-controls');
    evt.preventDefault();
  }

  function toggleRevoke(evt) {
    toggle.call(this, '.js-revoke-confirmation');
    toggle.call(this, '.js-edit-controls');
    evt.preventDefault();
  }

  function toggle(selector) {
    getListItem(this).find(selector).toggle();
  }

  function getListItem(element) {
    return $(element).parents('.key-list-item');
  }

  function saveDescription(evt) {

    var self = this,
        $container = getListItem(self),
        tokenLink = $container.attr('id'),
        newDescription = $container.find('.js-new-description').val();

    evt.preventDefault();
    $container.removeClass('yellow-fade');
    $container.find('.error').removeClass('error');

    $.ajax({
        type: 'PUT',
        url: '/tokens',
        data: {
            'token_link': tokenLink,
            'description': newDescription
        },
        dataType : 'json',
        success: function(responseData) {
          $container.find('.js-old-description').text(newDescription);
          toggleDescription.call(self, evt);
          $container.addClass('yellow-fade');
        },
        error: function(xhr, status) {
          $container.find('.form').addClass('error');
        }
    });
  }

  function revokeToken(evt) {
    var self = this,
        $container = getListItem(self),
        accountId = $('#accountId').text(),
        tokenLink = $container.attr('id'),
        deleteUrl = '/tokens/?token_link=' + tokenLink;

    evt.preventDefault();
    $container.find('.error').removeClass('error');

    $.ajax({
      type: 'DELETE',
      url: deleteUrl,
      dataType : 'json',
      success: function(responseData) {
        $container.find('.js-revoke-confirmation, .js-edit-controls').remove();
        $container.find('.js-revoke-confirmed').show();
        $container.addClass('yellow-fade').removeClass('js-active');
        updateActiveDevTokensHeader();
      },
      error: function() {
        $container.find('.js-revoke-confirmation').addClass('error');
      }
    });
  }

  function updateActiveDevTokensHeader() {
    var activeTokens = $(".key-list-item.js-active").length,
        $heading = $("#available-tokens");

    if (activeTokens == 0) {
      $heading.text("There are no active API keys");
    } else if (activeTokens == 1) {
      $heading.text("There is 1 active API key");
    } else {
      $heading.text("There are " + activeTokens + " active API keys");
    }
  }

});
