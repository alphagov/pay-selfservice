/* Uses Regexes from the rfc822-validate library.
 We use rfc822-validate in our email validation
 so this follows that standard. */
let rfc822Validator = require('rfc822-validate');

var emailTools = function (email) {
  "use strict";

  var init = function () {
    var sQtext = '[^\\x0d\\x22\\x5c\\x80-\\xff]';
    var sDtext = '[^\\x0d\\x5b-\\x5d\\x80-\\xff]';
    var sAtom = '[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-\\x3c\\x3e\\x40\\x5b-\\x5d\\x7f-\\xff]+';
    var sQuotedPair = '\\x5c[\\x00-\\x7f]';
    var sDomainLiteral = '\\x5b(' + sDtext + '|' + sQuotedPair + ')*\\x5d';
    var sQuotedString = '\\x22(' + sQtext + '|' + sQuotedPair + ')*\\x22';
    var sDomain_ref = sAtom;
    var sSubDomain = '(' + sDomain_ref + '|' + sDomainLiteral + ')';
    var sWord = '(' + sAtom + '|' + sQuotedString + ')';
    var sDomain = sSubDomain + '(\\x2e' + sSubDomain + ')*';
    var sLocalPart = sWord + '(\\x2e' + sWord + ')*';
    var sAddrSpec = '(' + sLocalPart + ')' + '\\x40' + '(' + sDomain + ')'; // complete RFC822 email address spec
    var sValidEmail = '^' + sAddrSpec + '$'; // as whole string

    var reValidEmail = new RegExp(sValidEmail);

    var f = function (email) {
      return reValidEmail.exec(email);
    };

    return f;
  }();

  var match = init(email);

  return {
    'local-part': (match !== null) ? match[1] : false,
    'domain': (match !== null) ? match[7] : false,
    validateEmail: function () {
      let validEmail = rfc822Validator(email);
      if (!validEmail) {
        return false;
      } else {
        let domain = match[7];
        return !(domain && domain.indexOf('.') === -1);
      }
    }
  };
};

module.exports = emailTools;
