Feature: ClearConnect API Functionality

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_04' credentials

  @regression @api
  Scenario: Create a new temp and verify the details with API call
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
    Given the user perform 'getTemps' API call with the following details
      | Key        | Value         |
      | tempIdIn   | <this.tempId> |
      | statusIn   | Active        |
      | resultType | json          |
    Then the API response should contain the following details
      | Key       | Values               |
      | firstName | <this.tempFirstName> |
      | email     | <this.tempEmail>     |
      | tempId    | <this.tempId>        |

  @regression @api
  Scenario: Create a new client and verify the details with API call
    And the user create a new client with the following details
      | Field        | Value              |
      | ClientName   | <RandomAlphabets>  |
      | Address      | 16801 Addison Road |
      | City         | Addison            |
      | State        | TX                 |
      | ZipCode      |              75001 |
      | Status       | Active             |
      | Region       | North Region       |
      | QuickBooksID | <RandomNumbers>    |
    Then the client id should be generated successfully in the url
    Given the user perform 'getClients' API call with the following details
      | Key        | Value           |
      | clientIdIn | <this.clientId> |
      | statusIn   | Active          |
      | resultType | json            |
    Then the API response should contain the following details
      | Key        | Values            |
      | clientName | <this.clientName> |
      | clientId   | <this.clientId>   |
