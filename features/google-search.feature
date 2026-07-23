Feature: Search on Google
  As a user
  I want to search for Playwright BDD on Google
  So that I can confirm the expected results appear

  Scenario: Search for Playwright and BDD
    Given I open Google
    When I search for "Playwright BDD"
    Then I should see search results containing "Playwright"
