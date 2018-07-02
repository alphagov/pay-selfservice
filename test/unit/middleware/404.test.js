const request = require('supertest')
const app = require('../../../server.js').getApp()

describe('Invalid pages redirect to 404 page', () => {
  it('should return 404', done => {
    request(app)
      .get('/notapage')
      .expect(404)
      .end(done)
  })

  it('should return 200 when path found', done => {
    request(app)
      .get('/login')
      .expect(200)
      .end(done)
  })

  it('should return 200 when static asset found', done => {
    request(app)
      .get('/public/images/crown.png')
      .expect(200)
      .end(done)
  })
})
