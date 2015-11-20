$(document).ready(function(){
    "use strict";

    var descriptionBeforeEditing = {};

    $("a#edit").click(function(event){
        var tokenDiv = $(this).closest("[name=token-description]");
        var tokenLink = tokenDiv.attr("id");
        var descriptionDiv = descendant(tokenDiv,"#description");
        var descriptionDivText = descriptionDiv.text();
        descriptionBeforeEditing[tokenLink] = descriptionDivText;
        descriptionDiv.replaceWith("<input id='description-input' type='text' value='" + descriptionDivText + "' style='display: block' />");
        descendant(tokenDiv,"#revoke").hide();
        descendant(tokenDiv,"#revoke-message").hide();
        descendant(tokenDiv,"#cancel").show();
        descendant(tokenDiv,"#save").show();
        $(this).hide();
    });

    $("a#cancel").click(function(event){
        var tokenDiv = $(this).closest("[name=token-description]");
        var tokenLink = tokenDiv.attr("id");
        descendant(tokenDiv,"input#description-input").replaceWith("<div class='heading-small' id='description'>" + descriptionBeforeEditing[tokenLink] + "</div>");
        descendant(tokenDiv,"input#save").hide();
        descendant(tokenDiv,"a#edit").show();
        descendant(tokenDiv,"a#revoke").show();
        $(this).hide();
    });

    $("input#save").click(function(event){
        var tokenDiv = $(this).closest("[name=token-description]");
        var tokenLink = tokenDiv.attr("id");

        var descriptionInput = descendant(tokenDiv,"input#description-input");
        var newDescription = descriptionInput.val();
        var thisSaveInput = $(this);
        var cancelLink = descendant(tokenDiv,"a#cancel");
        var editLink = descendant(tokenDiv,"a#edit");
        var revokeLink = descendant(tokenDiv,"a#revoke");

        $.ajax({
            type: 'PUT',
            url: '/selfservice/tokens',
            data: {
                'token_link': tokenLink,
                'description': newDescription
            },
            dataType : 'json',
            success: function(responseData){
                descriptionInput.replaceWith("<div id='description'><b>" + newDescription + "</b></div>");
            },
            error: function(xhr, status) { // Error on connection or non-2xx response
                descriptionInput.replaceWith("<div id='description'><b>" + descriptionBeforeEditing[tokenLink] + "</b></div>");
            },
            complete : function(xhr, status) {
                cancelLink.hide();
                editLink.show();
                revokeLink.show();
                thisSaveInput.hide();
            }
        });
    });

    $("a#revoke").click(function(event){
        var tokenDiv = $(this).closest("[name=token-description]");
        descendant(tokenDiv,"div#revoke-message").show();
    });

    $("input#revoke-no").click(function(event){
        var tokenDiv = $(this).closest("[name=token-description]");
        descendant(tokenDiv,"div#revoke-message").hide();
    });

    $("input#revoke-yes").click(function(event){
        var tokenDiv = $(this).closest("[name=token-description]");
        var tokenLink = tokenDiv.attr("id");
        var accountId = $('div#accountId').text();

        var revokeMessageDiv = descendant(tokenDiv,"div#revoke-message");
        var editLink = descendant(tokenDiv,"a#edit");
        var revokeLink = descendant(tokenDiv,"a#revoke");
        var revokedDiv = descendant(tokenDiv,"div#revoked");
        var revokedDateSpan = descendant(tokenDiv,"span#revoked-date");

        var deleteUrl = '/selfservice/tokens/' + accountId+"?token_link="+tokenLink;

        $.ajax({
            type: 'DELETE',
            url: deleteUrl,
            dataType : 'json',
            success: function(responseData){
                revokedDateSpan.text(responseData.revoked);
                editLink.hide();
                revokeLink.hide();
                revokedDiv.show();
                tokenDiv.removeClass('js-active');
                updateActiveDevTokensHeader();
            },
            complete: function(xhr, status) {
                revokeMessageDiv.hide();
            }
        });
    });

    function descendant(parent, child) {
        return parent.find(child).first();
    }

    function updateActiveDevTokensHeader() {
        var activeTokens = $(".key-list-item.js-active").length,
            $heading = $("#available-tokens");

        if (activeTokens == 0) {
            $heading.text("There are no active developer keys");
        } else if (activeTokens == 1) {
            $heading.text("There is 1 active developer key");
        } else {
            $heading.text("There are " + activeTokens + " active developer keys");
        }
    }

});
