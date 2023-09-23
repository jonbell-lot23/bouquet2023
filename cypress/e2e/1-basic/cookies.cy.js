it("cy.setCookie() - set a browser cookie", () => {
  cy.getCookies().should("be.empty");
  cy.setCookie("foo", "barrr");
  cy.getCookie("foo").should("have.property", "value", "bar");
});
