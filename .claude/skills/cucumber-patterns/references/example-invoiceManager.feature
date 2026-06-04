@smoke @regression
Feature: Invoice Manager - CRUD operations

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  @23455
  Scenario: Create a new invoice with all fields
    When the user create invoice with the following details
      | Field         | Value               |
      | invoiceNumber | INV-<RandomNumbers> |
      | clientName    | Acme Corp           |
      | amount        |             5000.00 |
      | dueDate       | <Today+30>          |
    Then the user should see invoice created successfully
    And the invoice number should match "INV-\d{10}"

  @regression
  Scenario Outline: Create invoice for different clients
    When the user create invoice with the following details
      | Field      | Value        |
      | clientName | <clientName> |
      | amount     | <amount>     |
      | dueDate    | <dueDate>    |
    Then the user should see invoice created successfully
    And the invoice status should be "Draft"

    Examples:
      | clientName | amount | dueDate    |
      | Client A   |   1000 | <Today+15> |
      | Client B   |   2500 | <Today+30> |
      | Client C   |   7500 | <Today+45> |

  @regression
  Scenario: Verify invoice details persist after creation
    When the user create invoice with the following details
      | Field      | Value             |
      | clientName | <this.clientName> |
      | amount     | <this.amount>     |
    And the user navigate to invoice details page
    Then the invoice details should display
      | Field      | Value             |
      | clientName | <this.clientName> |
      | amount     | <this.amount>     |
