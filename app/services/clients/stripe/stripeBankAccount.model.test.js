'use strict'

const StripeBankAccount = require('./stripeBankAccount.model')

describe('StripeBankAccount', () => {
  it('should successfully create a StripeBankAccount object', () => {
    const bankAccountSortCode = '108800'
    const bankAccountNumber = '00012345'

    const stripeBankAccount = new StripeBankAccount({
      bank_account_sort_code: bankAccountSortCode,
      bank_account_number: bankAccountNumber
    })

    expect(stripeBankAccount.basicObject()).toEqual({
      external_account: {
        object: 'bank_account',
        country: 'GB',
        currency: 'GBP',
        account_holder_type: 'company',
        routing_number: bankAccountSortCode,
        account_number: bankAccountNumber
      }
    })
  })

  it('should fail when sort code is numeric', () => {
    const bankAccountSortCode = 108800
    const bankAccountNumber = '00012345'

    expect(() => new StripeBankAccount({
      bank_account_sort_code: bankAccountSortCode,
      bank_account_number: bankAccountNumber
    })).toThrowError('StripeBankAccount "bank_account_sort_code" must be a string')
  })

  it('should fail when account number is numeric', () => {
    const bankAccountSortCode = '108800'
    const bankAccountNumber = 12345

    expect(() => new StripeBankAccount({
      bank_account_sort_code: bankAccountSortCode,
      bank_account_number: bankAccountNumber
    })).toThrowError('StripeBankAccount "bank_account_number" must be a string')
  })

  it('should fail when sort code is null', () => {
    const bankAccountSortCode = null
    const bankAccountNumber = '00012345'

    expect(() => new StripeBankAccount({
      bank_account_sort_code: bankAccountSortCode,
      bank_account_number: bankAccountNumber
    })).toThrowError('StripeBankAccount "bank_account_sort_code" must be a string')
  })

  it('should fail when account number is null', () => {
    const bankAccountSortCode = '108800'
    const bankAccountNumber = null

    expect(() => new StripeBankAccount({
      bank_account_sort_code: bankAccountSortCode,
      bank_account_number: bankAccountNumber
    })).toThrowError('StripeBankAccount "bank_account_number" must be a string')
  })

  it('should fail when sort code is blank string', () => {
    const bankAccountSortCode = ''
    const bankAccountNumber = '00012345'

    expect(() => new StripeBankAccount({
      bank_account_sort_code: bankAccountSortCode,
      bank_account_number: bankAccountNumber
    })).toThrowError('StripeBankAccount "bank_account_sort_code" is not allowed to be empty')
  })

  it('should fail when account number is blank string', () => {
    const bankAccountSortCode = '108800'
    const bankAccountNumber = ''

    expect(() => new StripeBankAccount({
      bank_account_sort_code: bankAccountSortCode,
      bank_account_number: bankAccountNumber
    })).toThrowError('StripeBankAccount "bank_account_number" is not allowed to be empty')
  })
})
