import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../utils/CustomWorld';

Given('the user navigates to the login page', async function (this: CustomWorld) {
  await this.loginPage.navigate();
});

When('the user enters username {string} and password {string}', async function (this: CustomWorld, username: string, password: string) {
  await this.loginPage.fillUsername(username);
  await this.loginPage.fillPassword(password);
});

When('the user clicks the Login button', async function (this: CustomWorld) {
  await this.loginPage.clickLogin();
});

Then('the user should be logged in successfully', async function (this: CustomWorld) {
  await this.loginPage.waitForLoginSuccess();
});

Given('the user login to the application {string} with {string} credentials', async function (this: CustomWorld, application: string, credential: string) {
  await this.loginPage.login(application, credential);
})

