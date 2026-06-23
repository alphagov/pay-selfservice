export function assertTransactionRow(
  row: number,
  reference: string,
  transactionLink: string,
  email: string,
  amount: string,
  cardBrand: string,
  state: string,
  fee?: string,
  netAmount?: string
) {
  cy.get('#transactions-list tbody').find('tr').eq(row).find('th').should('contain', reference)
  cy.get('#transactions-list tbody')
    .find('tr > th')
    .eq(row)
    .find('.reference')
    .should('have.attr', 'href', transactionLink)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.email').should('contain', email)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.amount').should('contain', amount)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.brand').should('contain', cardBrand)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.state').should('contain', state)

  if (netAmount) {
    cy.get('#transactions-list tbody')
      .find('tr')
      .eq(row)
      .get('[data-cell-type="net"]')
      .eq(row)
      .find('span')
      .should('contain', netAmount)
  }

  if (fee) {
    cy.get('#transactions-list tbody').find('tr').eq(row).get('[data-cell-type="fee"]').eq(row).should('contain', fee)
  }
}
