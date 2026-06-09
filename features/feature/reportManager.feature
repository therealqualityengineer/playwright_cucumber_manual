Feature: Report Manager Functionality

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  @regression
  Scenario: Download and verify Temp Profiles report
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
    And the user navigate to the 'Report Manager' section
    And the user generate the 'Temp Profiles' report with the following details
      | Temp Name | <this.tempFirstName> |
    Then the report should be downloaded successfully and report name start with 'tempprofiles'
    And the user open the downloaded report and verify the temp details in the report with the following details
      | Values               |
      | <this.tempFirstName> |
      | <this.tempEmail>     |

  @regression
  Scenario: Download and verify Temp Profiles by Certification report
    And the user create a new temp with the following details
      | Field         | Value             |
      | First Name    | <RandomAlphabets> |
      | Last Name     | <RandomAlphabets> |
      | Primary Email | <RandomEmail>     |
    Then the temp id should be generated successfully in the url
    And the user navigate to the 'Report Manager' section
    And the user generate the 'Temp Profiles by Certification' report with the following details
      | Temp Name     | <this.tempFirstName> |
      | Certification | RN                   |
    Then the report should be downloaded successfully and report name start with 'tempprofiles'
    And the user open the downloaded report and verify the temp details in the report with the following details
      | Values               |
      | <this.tempFirstName> |
      | <this.tempEmail>     |

  @regression
  Scenario: Download and verify Client Profiles report
    And the user create a new client with the following details
      | Field      | Value             |
      | ClientName | <RandomAlphabets> |
    Then the client id should be generated successfully in the url
    And the user navigate to the 'Report Manager' section
    And the user generate the 'Client Profiles' report with the following details
      | Client Name | <this.clientName> |
    Then the report should be downloaded successfully and report name start with 'clientprofile'
    And the user open the downloaded report and verify the temp details in the report with the following details
      | Values            |
      | <this.clientName> |

  @regression
  Scenario: Create temp, download Temp Profiles report, and verify temp exists via API
    And the user create a new temp with the following details
      | Field         | Value             |
      | First Name    | <RandomAlphabets> |
      | Last Name     | <RandomAlphabets> |
      | Primary Email | <RandomEmail>     |
    Then the temp id should be generated successfully in the url
    And the user navigate to the 'Report Manager' section
    And the user generate the 'Temp Profiles' report with the following details
      | Temp Name | <this.tempFirstName> |
    Then the report should be downloaded successfully and report name start with 'tempprofiles'
    Given the user perform 'getTemps' API call with the following details
      | Key        | Value         |
      | tempIdIn   | <this.tempId> |
      | statusIn   | Active        |
      | resultType | json          |
    Then the API response should contain the following details
      | Key       | Values               |
      | firstName | <this.tempFirstName> |
      | tempId    | <this.tempId>        |
