@api @smoke
Feature: Invoice API Assertions

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  @23456
  Scenario: Create invoice via UI and verify backend state with API
    When the user create invoice with the following details
      | Field      | Value     |
      | clientName | Acme Corp |
      | amount     |      5000 |
    Then the user should see invoice created successfully
    # Verify the invoice was persisted to backend
    Given the user perform 'getInvoiceDetails' API call with the following details
      | Key       | Value            |
      | invoiceId | <this.invoiceId> |
    Then the API response should contain the following details
      | Key       | Value            |
      | invoiceId | <this.invoiceId> |
      | clientId  | <this.clientId>  |
      | amount    |             5000 |
      | status    | Draft            |

  @regression
  Scenario Outline: Verify invoice list API returns all created invoices
    When the user create invoice with the following details
      | Field      | Value        |
      | clientName | <clientName> |
      | amount     | <amount>     |
    Then the user should see invoice created successfully
    # Query the API for invoices by client
    Given the user perform 'getInvoiceList' API call with the following details
      | Key      | Value           |
      | clientId | <this.clientId> |
      | status   | Draft           |
    Then the API response should contain the following details
      | Key    | Value    |
      | amount | <amount> |
      | status | Draft    |

    Examples:
      | clientName | amount |
      | Client A   |   1000 |
      | Client B   |   2500 |

  @regression
  Scenario: Multi-field API assertion on detailed response
    When the user create invoice with the following details
      | Field         | Value               |
      | invoiceNumber | INV-<RandomNumbers> |
      | clientName    | Acme Corp           |
      | amount        |             7500.50 |
      | dueDate       | <Today+45>          |
    Then the user should see invoice created successfully
    # Assert all fields match exactly
    Given the user perform 'getInvoiceDetails' API call with the following details
      | Key       | Value            |
      | invoiceId | <this.invoiceId> |
    Then the API response should contain the following details
      | Key           | Value                |
      | invoiceId     | <this.invoiceId>     |
      | invoiceNumber | <this.invoiceNumber> |
      | clientId      | <this.clientId>      |
      | amount        |              7500.50 |
      | dueDate       | <this.dueDate>       |
      | status        | Draft                |
      | createdAt     | <this.createdAt>     |
