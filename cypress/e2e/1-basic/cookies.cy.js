it("cy.setCookie() - set a browser cookie", () => {
  cy.getCookies().should("be.empty");
  cy.setCookie("jon", "is cool");
  cy.getCookie("jon").should("have.property", "value", "is cool");
});
