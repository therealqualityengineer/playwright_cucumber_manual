import { World } from '@cucumber/cucumber';
import { BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClientManagerPage } from '../pages/ClientManagerPage';
import { TempManagerPage } from '../pages/TempManagerPage';
import { OrderManagerPage } from '../pages/OrderManagerPage';
import { ReportManagerPage } from '../pages/reportManagerPage';
import { APItestPage } from '../pages/APItestPage';

interface PageObjects {
    context: BrowserContext;
    page: Page;
    loginPage: LoginPage;
    clientManagerPage: ClientManagerPage;
    tempManagerPage: TempManagerPage;
    orderManagerPage: OrderManagerPage;
    reportManagerPage: ReportManagerPage;
    apiTestPage: APItestPage;
}

interface ScenarioState {
    apiResponse?: unknown;
    clientName?: string;
    clientId?: string;
    tempFirstName?: string;
    tempEmail?: string;
    tempId?: string;
    orderId?: string;
    downloadedReportName?: string;
}

export class CustomWorld extends World implements PageObjects, ScenarioState {

    context!: BrowserContext;
    page!: Page;
    loginPage!: LoginPage;
    clientManagerPage!: ClientManagerPage;
    tempManagerPage!: TempManagerPage;
    orderManagerPage!: OrderManagerPage;
    reportManagerPage!: ReportManagerPage;
    apiTestPage!: APItestPage;

    apiResponse?: unknown;
    clientName?: string;
    clientId?: string;
    tempFirstName?: string;
    tempEmail?: string;
    tempId?: string;
    orderId?: string;
    downloadedReportName?: string;
}
