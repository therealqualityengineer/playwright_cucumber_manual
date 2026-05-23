import { Before, After, setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from '../utils/CustomWorld';
import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClientManagerPage } from '../pages/ClientManagerPage';
import { TempManagerPage } from '../pages/TempManagerPage';

setWorldConstructor(CustomWorld);
setDefaultTimeout(60 * 1000);

Before(async function (this: CustomWorld) {
  this.browser = await chromium.launch({ headless: false });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  this.loginPage = new LoginPage(this.page);
  this.clientManagerPage = new ClientManagerPage(this.page);
  this.tempManagerPage = new TempManagerPage(this.page);
});

After(async function (this: CustomWorld) {
  await this.browser.close();
});
