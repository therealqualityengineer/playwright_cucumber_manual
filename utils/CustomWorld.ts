import {  World} from '@cucumber/cucumber';
import { BrowserContext, Browser, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClientManagerPage } from '../pages/ClientManagerPage';
import { TempManagerPage } from '../pages/TempManagerPage';

export class CustomWorld extends World {
   browser!: Browser;
   context!: BrowserContext;
   page!: Page;

   loginPage!: LoginPage;
   clientManagerPage!: ClientManagerPage;
   tempManagerPage!: TempManagerPage;

   clientName?: string;
   clientId?: string;

   tempFirstName?: string;
   tempId?: string;
}