Feature: Temp Manager Functionality

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_02' credentials

  @regression
  Scenario: Create a new temp
    And the user create a new temp with the following details
      | Field                     | Value             |
      | First Name                | <RandomAlphabets> |
      | Last Name                 | <RandomAlphabets> |
      | Primary Email             | <RandomEmail>     |
      | Address                   |   345 Park Avenue |
      | City                      | New York          |
      | State                     | NY                |
      | ZipCode                   |             10154 |
      | Status                    | Active            |
      | Region                    | JasonTest         |
      | Contract (1099) / EE (W2) | EE                |
      | Certification             | RN                |
      | Specialty                 | ER                |
    Then the temp id should be generated successfully in the url
