$(document).ready(function(){

    updateActiveDevTokensHeader();

    var descriptionBeforeEditing = {};

    $("a#edit").click(function(event){
        var tokenDiv = $(this).closest("div[name=token-description]");
        var tokenLink = tokenDiv.attr("id");
        var descriptionDiv = descendant(tokenDiv,"div#description");
        var descriptionDivText = descriptionDiv.text();
        descriptionBeforeEditing[tokenLink] = descriptionDivText;
        descriptionDiv.replaceWith("<input id='description-input' type='text' value='" + descriptionDivText + "' style='display: block' />");
        descendant(tokenDiv,"a#revoke").hide();
        descendant(tokenDiv,"div#revoke-message").hide();
        descendant(tokenDiv,"a#cancel").show();
        descendant(tokenDiv,"input#save").show();
        $(this).hide();
    });

    $("a#cancel").click(function(event){
        var tokenDiv = $(this).closest("div[name=token-description]");
        var tokenLink = tokenDiv.attr("id");
        descendant(tokenDiv,"input#description-input").replaceWith("<div id='description'><b>" + descriptionBeforeEditing[tokenLink] + "</b></div>");
        descendant(tokenDiv,"input#save").hide();
        descendant(tokenDiv,"a#edit").show();
        descendant(tokenDiv,"a#revoke").show();
        $(this).hide();
    });

    $("input#save").click(function(event){
        var tokenDiv = $(this).closest("div[name=token-description]");
        var tokenLink = tokenDiv.attr("id");

        var descriptionInput = descendant(tokenDiv,"input#description-input");
        var newDescription = descriptionInput.val();
        var thisSaveInput = $(this);
        var cancelLink = descendant(tokenDiv,"a#cancel");
        var editLink = descendant(tokenDiv,"a#edit");
        var revokeLink = descendant(tokenDiv,"a#revoke");

        $.ajax({
            type: 'PUT',
            url: '/tokens',
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
        var tokenDiv = $(this).closest("div[name=token-description]");
        descendant(tokenDiv,"div#revoke-message").show();
    });

    $("input#revoke-no").click(function(event){
        var tokenDiv = $(this).closest("div[name=token-description]");
        descendant(tokenDiv,"div#revoke-message").hide();
    });

    $("input#revoke-yes").click(function(event){
        var tokenDiv = $(this).closest("div[name=token-description]");
        var tokenLink = tokenDiv.attr("id");
        var accountId = $('div#accountId').text();

        var revokeMessageDiv = descendant(tokenDiv,"div#revoke-message");
        var editLink = descendant(tokenDiv,"a#edit");
        var revokeLink = descendant(tokenDiv,"a#revoke");
        var revokedDiv = descendant(tokenDiv,"div#revoked");
        var revokedDateSpan = descendant(tokenDiv,"span#revoked-date");

        $.ajax({
            type: 'DELETE',
            url: '/tokens/' + accountId,
            data: {
                'token_link': tokenLink,
            },
            success: function(responseData){
                revokedDateSpan.text(responseData.revoked);
                editLink.hide();
                revokeLink.hide();
                revokedDiv.show();
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
        var numberOfValidTokens = $("div[name='token-description']:has(div#revoked[style='display: none'])").length;
        var header = $("h2#available-tokens");
        if (numberOfValidTokens==0) header.text("There are no active developer keys");
        else if (numberOfValidTokens==1) header.text("There is 1 active developer key");
        else header.text("There are " + numberOfValidTokens + " active developer keys");
    }

});