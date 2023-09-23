it("cy.setCookie() - set a browser cookie", () => {
  cy.getCookies().should("be.empty");
  cy.setCookie("jon").should("have.property", "value", "is cool");
});
