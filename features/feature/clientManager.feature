Feature: Client Manager Functionality

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  Scenario: Create a new client
    And the user create a new client with the following details
      | Field        | Value             |
      | ClientName   | <RandomAlphabets> |
      | Address      |       123 Main St |
      | City         | Anytown           |
      | State        | California        |
      | ZipCode      |             12345 |
      | Status       | Active            |
      | Region       | North Region      |
      | QuickBooksID | <RandomNumbers>   |
    Then the client id should be generated successfully in the url
