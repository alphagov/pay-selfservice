var Paginator = require('./paginator.js')
var assert = require('chai').assert
var expect = require('chai').expect

describe('paginator', function () {
  it('should return the correct next page', function () {
    var paginator1 = new Paginator(21, 4, 4)
    var paginator2 = new Paginator(21, 4, 6)

    assert(paginator1.getNext() === 5)
    assert(paginator2.getNext() === null)
  })

  it('should return the correct previous page', function () {
    var paginator1 = new Paginator(21, 4, 4)
    var paginator2 = new Paginator(21, 4, 1)

    assert(paginator1.getPrevious() === 3)
    assert(paginator2.getPrevious() === null)
  })

  it('should return the correct last page', function () {
    var paginator1 = new Paginator(21, 4, 4)
    assert(paginator1.getLast() === 6)
  })

  it('should return the correct first page', function () {
    var paginator1 = new Paginator(21, 4, 4)
    assert(paginator1.getFirst() === 1)
  })

  it('should return a centered range limited by total number of pages', function () {
    var paginator1 = new Paginator(21, 4, 2)
    var paginator2 = new Paginator(21, 4, 4)
    var paginator3 = new Paginator(21, 4, 5)

    expect(paginator1.getCentredRange(3)).to.deep.equal([1, 2, 3, 4, 5])
    expect(paginator2.getCentredRange(2)).to.deep.equal([2, 3, 4, 5, 6])
    expect(paginator3.getCentredRange(2)).to.deep.equal([3, 4, 5, 6])
  })

  it('should return correct display size options', function () {
    var paginator1 = new Paginator(1000, 100, 2)
    var paginator2 = new Paginator(1000, 500, 2)

    var paginator3 = new Paginator(400, 100, 4)

    var paginator4 = new Paginator(50, 2, 1)

    expect(paginator1.getDisplaySizeOptions()).to.deep.equal([
      { type: 'small', name: 100, value: 100, active: true },
      { type: 'large', name: 500, value: 500, active: false }
    ])

    expect(paginator2.getDisplaySizeOptions()).to.deep.equal([
      { type: 'small', name: 100, value: 100, active: false },
      { type: 'large', name: 500, value: 500, active: true }
    ])

    expect(paginator3.getDisplaySizeOptions()).to.deep.equal([
      { type: 'small', name: 100, value: 100, active: true },
      { type: 'large', name: 'Show all', value: 500, active: false }
    ])

    expect(paginator4.getDisplaySizeOptions()).to.deep.equal([
      { type: null, name: 'Show all', value: 100, active: false }
    ])
  })

  describe('should return correct links by count', () => {
    it('when this is the only page', () => {
      const paginator1 = new Paginator(null, 10, 1)
      const navigation1 = paginator1.buildNavigation(5)
      expect(navigation1.length).to.equal(2)
      expect(navigation1[0].pageName).to.equal('Previous')
      expect(navigation1[0].disabled).to.equal(true)

      expect(navigation1[1].pageName).to.equal('Next')
      expect(navigation1[1].disabled).to.equal(true)
      expect(navigation1[1].pageNumber).to.equal(null)
    })

    it('when there are surrounding pages', () => {
      const paginator2 = new Paginator(null, 10, 4)
      const navigation2 = paginator2.buildNavigation(10)

      expect(navigation2.length).to.equal(2)
      expect(navigation2[0].pageName).to.equal('Previous')
      expect(navigation2[0].disabled).to.equal(undefined)
      expect(navigation2[0].pageNumber).to.equal(3)

      expect(navigation2[1].pageName).to.equal('Next')
      expect(navigation2[1].disabled).to.equal(undefined)
      expect(navigation2[1].pageNumber).to.equal(5)
    })
  })
})
