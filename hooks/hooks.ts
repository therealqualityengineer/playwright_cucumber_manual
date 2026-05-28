import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  setWorldConstructor,
  setDefaultTimeout
} from '@cucumber/cucumber';

import { chromium, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { CustomWorld } from '../utils/CustomWorld';

import { LoginPage } from '../pages/LoginPage';
import { ClientManagerPage } from '../pages/ClientManagerPage';
import { TempManagerPage } from '../pages/TempManagerPage';
import { OrderManagerPage } from '../pages/OrderManagerPage';
import { ReportManagerPage } from '../pages/reportManagerPage';
import { APItestPage } from '../pages/APItestPage';

setWorldConstructor(CustomWorld);

setDefaultTimeout(60 * 1000);

let browser: Browser;

BeforeAll(async function () {

   browser = await chromium.launch({
      headless: false
   });

});

Before(async function (this: CustomWorld) {

   this.context =
      await browser.newContext();

   await this.context.tracing.start({ screenshots: true, snapshots: true });

   this.page =
      await this.context.newPage();

   this.loginPage =
      new LoginPage(this.page);

   this.clientManagerPage =
      new ClientManagerPage(this.page);

   this.tempManagerPage =
      new TempManagerPage(this.page);

   this.orderManagerPage =
      new OrderManagerPage(this.page);

   this.reportManagerPage =
      new ReportManagerPage(this.page);

   this.apiTestPage =
      new APItestPage(this.page);

});

After(async function (this: CustomWorld, scenario) {

   if (scenario.result?.status === 'FAILED') {

      const screenshot = await this.page.screenshot({ fullPage: true });
      this.attach(screenshot, 'image/png');

      const tracesDir = path.join('allure-results', 'traces');
      fs.mkdirSync(tracesDir, { recursive: true });

      const safeName = scenario.pickle.name.replace(/[^a-z0-9]/gi, '_').slice(0, 100);
      const tracePath = path.join(tracesDir, `${safeName}_${Date.now()}.zip`);
      await this.context.tracing.stop({ path: tracePath });

      this.attach(
         `Trace saved: ${tracePath}\nView with: npx playwright show-trace ${tracePath}`,
         'text/plain'
      );

   } else {
      await this.context.tracing.stop();
   }

   await this.context.close();

});

AfterAll(async function () {

   await browser.close();

   const downloadsDir = path.join(process.cwd(), 'downloads');
   if (fs.existsSync(downloadsDir)) {
      fs.readdirSync(downloadsDir).forEach(file =>
         fs.rmSync(path.join(downloadsDir, file), { force: true })
      );
   }

});