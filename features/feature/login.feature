Feature: Login

  @smoke
  Scenario: Successful login with valid credentials
    Given the user navigates to the login page
    When the user enters username "testuser_02" and password "Therealqaengineer@99"
    And the user clicks the Login button
    Then the user should be logged in successfully

  @regression
  Scenario: Successful login with default credentials
    Given the user login to the application 'Env_QA' with 'default' credentials
