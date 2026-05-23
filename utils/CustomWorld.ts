import {  World} from '@cucumber/cucumber';
import { BrowserContext, Browser, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClientManagerPage } from '../pages/ClientManagerPage';

export class CustomWorld extends World {
   browser!: Browser;
   context!: BrowserContext;
   page!: Page;

   loginPage!: LoginPage;
   clientManagerPage!: ClientManagerPage;
}