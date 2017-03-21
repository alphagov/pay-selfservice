let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;

describe('The team member details view', function () {

  it('should render team member details', function () {

    let templateData = {
      username: 'Oscar Smith',
      email: 'oscar.smith@example.com',
      role: 'View only'
    };

    let body = renderTemplate('services/team_member_details', templateData);

    body.should.containSelector('h2#details-for').withExactText('Details for Oscar Smith');
    body.should.containSelector('td#name').withExactText('Oscar Smith');
    body.should.containSelector('td#email').withExactText('oscar.smith@example.com');
    body.should.containSelector('td#role').withExactText('View only');
  });

  it('should render team member My profile view', function () {

    let templateData = {
      username: 'John Smith',
      email: 'john.smith@example.com',
      telephone_number: '+447769897329'
    };

    let body = renderTemplate('services/team_member_profile', templateData);

    body.should.containSelector('td#name').withExactText('John Smith');
    body.should.containSelector('td#email').withExactText('john.smith@example.com');
    body.should.containSelector('td#telephone-number').withExactText('+447769897329');
  });
});
