$(document).ready(function(){
  "use strict";

  var keyList = $('.key-list');
  keyList.on('click', '.js-toggle-description', toggleDescription);
  keyList.on('click', '.js-toggle-revoke', toggleRevoke);
  keyList.on('click', '.js-save-description', saveDescription);
  keyList.on('click', '.js-revoke-token', revokeToken);


  function toggleDescription(evt) {
    var oldDescription = getListItem(this).find('.js-old-description').text();
    getListItem(this).find('.js-new-description').val(oldDescription);
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
        csrf = $container.attr('data-csrf'),
        newDescription = $container.find('.js-new-description').val();

    evt.preventDefault();
    $container.removeClass('yellow-fade');
    $container.find('.error').removeClass('error');

    $.ajax({
        type: 'PUT',
        url: '/api-keys',
        data: {
            'token_link': tokenLink,
            'description': newDescription,
            csrfToken: csrf
        },
        success: function(responseData) {
          $($container).replaceWith(responseData);
        },
        error: function(xhr, status) {
          $container.find('.form').addClass('error');
        }
    });
  }

  function revokeToken(evt) {
    var self        = this,
        $container  = getListItem(self),
        accountId   = $('#accountId').text(),
        tokenLink   = $container.attr('id'),
        csrf        = $container.attr('data-csrf'),
        deleteUrl   = '/api-keys/?token_link=' + tokenLink;

    evt.preventDefault();
    $container.find('.error').removeClass('error');

    $.ajax({
      type: 'DELETE',
      url: deleteUrl,
      dataType : 'json',
      data: {
        csrfToken: csrf
      },
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
