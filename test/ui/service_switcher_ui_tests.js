'use strict';
// NPM Dependencies
const {should} = require('chai');

// Local Dependencies
const {render} = require('../test_helpers/html_assertions.js');
const Service = require('../../app/models/Service.class');

// Assignments e.t.c.
let body, templateData;

const serviceOne = {
  external_id:'abc123',
  name: 'Super Mega Service',
  gateway_accounts: [{
    id: '1',
    service_name: 'gateway account 1',
    type: 'test'
  },{
    id: '2',
    service_name: 'gateway account 2',
    type: 'live'
  }]
};

const serviceTwo = {
  external_id:'def456',
  name: '',
  gateway_accounts: [{
    id: '3',
    service_name: 'gateway account 3',
    type: 'test'
  },{
    id: '4',
    service_name: 'gateway account 4',
    type: 'live'
  }]
};


describe('The account switcher link', () => {



  it('should display My Services link', () =>  {

    body = render('layout', {});

    body.should.containSelector('#my-services').withExactText('My Services');
  });

  describe('when a user has a single service and is an admin of that service', () => {

    before(() => {
      templateData = {
        permissions: {
          users_service_create: true
        },
        services: [serviceOne]
      };

      body = render('services/index', templateData);
    });

    it('should display Manage Team Members link in switcher page when user has permission to create users', () =>  {
      body.should.containSelector('a.manage-team-members').withExactText('Manage team members');
    });

    it(`should render a service if a user is a member of a single services`, () => {
      body.should.containSelector('.service-name').property('length').to.equal(1)
    });
  });

  describe('when a user has multiple services and only has view permissions', () => {

    before(() => {
      templateData = {
        services: [serviceOne, serviceTwo]
      };

      body = render('services/index', templateData);
    });

    it(`should render a blank h2 tag if service name is blank`, () =>  {
      body.should.containSelector('h2.service-name').withText('');
    });

    it(`should render the service name in a h2 tag if service name is defined`, () =>  {
      body.should.containSelector('h2.service-name').withText('Super Mega Service');
    });

    it(`should render multiple service if a user is a member of multiple services`, () => {
      body.should.containSelector('.service-name').property('length').to.equal(2)
    });

    it('should display View Team Members link in each switcher page', () =>  {
      body.should.containSelector('a.view-team-members').property('length').to.equal(2);
      body.should.containSelector('a.view-team-members').withText('View team members');
    });

  });


  it(`should render no services message if a user is a member of no services`, () => {
    templateData = {
      services:[]
    };

    body = render('services/index', templateData);

    body.should.containSelector('p.no-services').withText('You have 0 services')
  });




});
