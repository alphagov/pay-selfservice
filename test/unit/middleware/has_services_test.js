'use strict';

const assert = require('assert');
const sinon = require('sinon');
const nock = require('nock');
const chai = require('chai');
const {should, expect} = chai;
const chaiAsPromised = require('chai-as-promised');
const paths = require('../../../app/paths');
const hasServices = require(__dirname + '/../../../app/middleware/has_services.js');
const userFixtures = require('../../fixtures/user_fixtures');

let res, next;

chai.use(chaiAsPromised);

describe('user has services middleware', function () {

    beforeEach(function () {
        res = {
            redirect: sinon.spy(),
            status: sinon.spy()
        };
        next = sinon.spy()
        nock.cleanAll();
    });

    it("should call next when user has services", function (done) {
        const user = userFixtures.validUser({
            services_roles: [{service: {external_id: '1'}}],
            external_id: 'external-id'
        }).getAsObject();

        const req = {user: user, headers: {}};

        hasServices(req, res, next);

        expect(next.called).to.be.true;

        done();
    });

    it('should redirect to service switcher if the user has no services', function (done) {

        const req = {user: {services: []}, headers: {}};

        hasServices(req, res, next);

        expect(next.notCalled).to.be.true
        expect(res.redirect.called).to.equal(true)
        expect(res.redirect.calledWith(paths.serviceSwitcher.index))

        done();
    });



});
