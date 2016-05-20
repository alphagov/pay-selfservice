var Paginator = require("../../app/utils/paginator.js");
var assert     = require("chai").assert;
var expect     = require("chai").expect;


describe('paginator', function () {
	it("should return the correct next page", function () {
		var paginator1 = new Paginator(21, 4, 4);
		var paginator2 = new Paginator(21, 4, 6);

		assert(paginator1.getNext() === 5);
		assert(paginator2.getNext() === null);
	});

	it("should return the correct previous page", function () {
		var paginator1 = new Paginator(21, 4, 4);
		var paginator2 = new Paginator(21, 4, 1);

		assert(paginator1.getPrevious() === 3);
		assert(paginator2.getPrevious() === null);
	});

	it("should return the correct last page", function () {
		var paginator1 = new Paginator(21, 4, 4);
		assert(paginator1.getLast() === 6);
	});

	it("should return the correct first page", function () {
		var paginator1 = new Paginator(21, 4, 4);
		assert(paginator1.getFirst() === 1);
	});

	it("should return a centered range limited by total number of pages", function () {
		var paginator1 = new Paginator(21, 4, 2);
		var paginator2 = new Paginator(21, 4, 4);
		var paginator3 = new Paginator(21, 4, 5);

		expect(paginator1.getCentredRange(3)).to.deep.equal([1, 2, 3, 4, 5]);
		expect(paginator2.getCentredRange(2)).to.deep.equal([2, 3, 4, 5, 6]);
		expect(paginator3.getCentredRange(2)).to.deep.equal([3, 4, 5, 6]);

	});

	it("should return correct display size options", function () {
		var paginator1 = new Paginator(1000, 100, 2);
		var paginator2 = new Paginator(1000, 500, 2);

		var paginator3 = new Paginator(400, 100, 4);
		var paginator4 = new Paginator(50, 100, 5);

		expect(paginator1.getDisplaySizeOptions(3)).to.deep.equal([
			{type: 'small', name: 100, value: 100, active: true},
			{type: 'large', name: 500, value: 500, active: false}
		]);

		expect(paginator2.getDisplaySizeOptions(3)).to.deep.equal([
			{type: 'small', name: 100, value: 100, active: false},
			{type: 'large', name: 500, value: 500, active: true}
		]);

		expect(paginator3.getDisplaySizeOptions(3)).to.deep.equal([
			{type: 'small', name: 100, value: 100, active: true},
			{type: 'large', name: 'Show all', value: 500, active: false}
		]);

		expect(paginator4.getDisplaySizeOptions(3)).to.equal(undefined);
	});
});
