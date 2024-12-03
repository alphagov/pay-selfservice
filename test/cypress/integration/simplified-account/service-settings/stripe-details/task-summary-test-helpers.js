const taskStatus = {
  NOT_STARTED: 'Not yet started',
  COMPLETE: 'Completed',
  CANNOT_START: 'Cannot start yet'
}

const checkDisplayedTasks = (length, expectedTasks) => {
  cy.get('.govuk-task-list__item').should('have.length', length)
    .each((row, index) => {
      const task = expectedTasks[index]
      cy.wrap(row).should('contain.text', task.name)
      cy.wrap(row)
        .find('.govuk-task-list__status')
        .should('contain.text', task.status)
      if (task.status !== taskStatus.COMPLETE) {
        cy.wrap(row).find('strong')
          .should('have.class', task.tagClass)
      }
      cy.wrap(row)
        .find('a')
        .should(task.status === taskStatus.NOT_STARTED ? 'exist' : 'not.exist')
    })
}

const checkTaskNavigation = (length, expectedTasks) => {
  cy.get('.govuk-task-list__item').find('a').should('have.length', length)
    .then(links => {
      const hrefs = links.map((_, link) => link.href).get()
      hrefs.forEach((href, index) => {
        cy.visit(href)
        cy.get('h1').should('contain.text', expectedTasks[index].heading)
        cy.get('.govuk-back-link').click()
      })
    })
}

module.exports = {
  taskStatus,
  checkDisplayedTasks,
  checkTaskNavigation
}
