describe('Widget', () => {
  it('has BNB, BTC, ALTS groups', () => {
    cy.visit('/')
    cy.contains('BNB')
    cy.contains('BTC')
    cy.contains('ALTS')
  })
})
