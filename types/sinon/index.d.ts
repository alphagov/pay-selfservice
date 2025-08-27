import sinon from 'sinon'

declare module 'sinon' {
  interface SinonStub {
    should: Chai.Assertion
  }
}
