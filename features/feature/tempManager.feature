Feature: Temp Manager Functionality

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_04' credentials

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

  @regression @2222
  Scenario Outline: Enable Flat Pay for a temp
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
    And the user added the Flat pay of '<Pay Amount>' and '<Bill Amount>' to Pay and Bill amounts
    Then the user verifies Flat Pay enabled

    Examples:
      | Pay Amount | Bill Amount |
      |         55 |         110 |
      |         85 |         150 |
      |        100 |         300 |

  @regression @666
  Scenario: Verify client oriented with temp
    And the user create a new temp with the following details
      | Field         | Value             |
      | First Name    | <RandomAlphabets> |
      | Last Name     | <RandomAlphabets> |
      | Primary Email | <RandomEmail>     |
    Then the temp id should be generated successfully in the url
    And the user create a new client with the following details
      | Field      | Value             |
      | ClientName | <RandomAlphabets> |
    Then the client id should be generated successfully in the url
    And the user opens the 'temp' profile page
    And the user opens the 'Facilities' tab and applies the following filters
      | Field      | Value             |
      | ClientName | <this.clientName> |
      | Region     | All Regions       |
    And the user sets the following status on the Facilities page
      | Field    | Value |
      | Oriented | Check |
    Then the user verifies the 'Facilities Successfully Updated.' message
    Then the user verifies that the following status is set on the 'Facilities' page
      | Field    | Status  |
      | Oriented | Checked |

  @smoke
  Scenario: Verify Permanent Driving Distance for temp facility
    And the user create a new temp with the following details
      | Field         | Value             |
      | First Name    | <RandomAlphabets> |
      | Last Name     | <RandomAlphabets> |
      | Primary Email | <RandomEmail>     |
      | Address       | 345 Park Avenue   |
      | City          | New York          |
      | State         | NY                |
      | ZipCode       | 10154             |
    Then the temp id should be generated successfully in the url
    And the user create a new client with the following details
      | Field      | Value             |
      | ClientName | <RandomAlphabets> |
    Then the client id should be generated successfully in the url
    And the user opens the 'temp' profile page
    And the user opens the 'Facilities' tab and applies the following filters
      | Field      | Value             |
      | ClientName | <this.clientName> |
      | Region     | All Regions       |
    And the user verifies the 'Permanent' Driving Distance should be between '1530' to '1630'

  @regression
  Scenario: Verify client Preferred with temp
    And the user create a new temp with the following details
      | Field         | Value             |
      | First Name    | <RandomAlphabets> |
      | Last Name     | <RandomAlphabets> |
      | Primary Email | <RandomEmail>     |
    Then the temp id should be generated successfully in the url
    And the user create a new client with the following details
      | Field      | Value             |
      | ClientName | <RandomAlphabets> |
    Then the client id should be generated successfully in the url
    And the user opens the 'temp' profile page
    And the user opens the 'Facilities' tab and applies the following filters
      | Field      | Value             |
      | ClientName | <this.clientName> |
      | Region     | All Regions       |
    And the user sets the following status on the Facilities page
      | Field     | Value  |
      | Preferred | Select |
    Then the user verifies the 'Facilities Successfully Updated.' message
    Then the user verifies that the following status is set on the 'Facilities' page
      | Field     | Status   |
      | Preferred | Selected |
