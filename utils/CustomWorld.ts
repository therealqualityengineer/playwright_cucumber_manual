import {  World} from '@cucumber/cucumber';
import { BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClientManagerPage } from '../pages/ClientManagerPage';
import { TempManagerPage } from '../pages/TempManagerPage';
import { OrderManagerPage } from '../pages/OrderManagerPage';
import { ReportManagerPage } from '../pages/ReportManagerPage';

export class CustomWorld extends World {

   context!: BrowserContext;

   page!: Page;

   loginPage!: LoginPage;

   clientManagerPage!: ClientManagerPage;

   tempManagerPage!: TempManagerPage;

   orderManagerPage!: OrderManagerPage;

   reportManagerPage!: ReportManagerPage;

   clientName?: string;

   clientId?: string;

   tempFirstName?: string;

   tempId?: string;

   orderId?: string;

   downloadedReportName?: string;
}