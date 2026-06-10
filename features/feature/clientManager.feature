Feature: Client Manager Functionality

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  @regression @23455
  Scenario: Create a new client
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

  @smoke
  Scenario: Client Requires Orientation set to yes with Warn
    And the user create a new client with the following details
      | Field        | Value             |
      | ClientName   | <RandomAlphabets> |
      | QuickBooksID | <RandomNumbers>   |
    Then the client id should be generated successfully in the url
    And the user opens the 'client' profile page
    And the user set following values in 'Settings' page
      | Field                       | Value |
      | Client Requires Orientation | Yes   |
      | On order fill               | Warn  |
    Then the user verifies the 'Client Settings Successfully Updated' message
    And the user opens the 'client' profile page
    Then the user verifies following values in 'Settings' page
      | Field                       | Value |
      | Client Requires Orientation | Yes   |
      | On order fill               | Warn  |
