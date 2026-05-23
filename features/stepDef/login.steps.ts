import { Given, When, Then, Before, After, IWorldOptions, setWorldConstructor, World, setDefaultTimeout } from '@cucumber/cucumber';

setDefaultTimeout(60 * 1000);
import { chromium, Browser, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

class CustomWorld extends World {
  browser!: Browser;
  page!: Page;
  loginPage!: LoginPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);

Before(async function (this: CustomWorld) {
  this.browser = await chromium.launch({ headless: false });
  this.page = await this.browser.newPage();
  this.loginPage = new LoginPage(this.page);
});

After(async function (this: CustomWorld) {
  await this.browser.close();
});

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

