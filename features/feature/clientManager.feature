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

  @regression
  Scenario Outline: Save Client Time Entry and Approval settings with given values
    And the user create a new client with the following details
      | Field        | Value             |
      | ClientName   | <RandomAlphabets> |
      | QuickBooksID | <RandomNumbers>   |
    Then the client id should be generated successfully in the url
    And the user opens the 'client' profile page
    And the user set following values in 'Time Entry and Approval' page
      | Field    | Value    |
      | <field1> | <value1> |
      | <field2> | <value2> |
      | <field3> | <value3> |
      | <field4> | <value4> |
      | <field5> | <value5> |
    Then the user verifies the client 'Time Entry and Approval Saved Successfully.' message
    And the user opens the 'client' profile page
    Then the user verifies following values in 'Time Entry and Approval' page
      | Field    | Value    |
      | <field1> | <value1> |
      | <field2> | <value2> |
      | <field3> | <value3> |
      | <field4> | <value4> |
      | <field5> | <value5> |

  Examples:
    | iteration  | field1                | field2   | field3               | field4                            | field5                | value1 | value2 | value3           | value4 | value5 |
    | iteration1 | Default Lunch Minutes | Pay Only | Client Clocking Data | Enable New Time Approval Workflow |                       | 60     | Yes    | Facility Portal  | No     |        |
    | iteration2 | Default Lunch Minutes | Pay Only | Client Clocking Data | Enable New Time Approval Workflow | Allow Early Clock-Ins | 30     | Yes    | Workforce Portal | Yes    | Yes    |

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
