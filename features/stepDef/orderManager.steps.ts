import { Given, Then, DataTable } from '@cucumber/cucumber';
import { CustomWorld } from '../../utils/CustomWorld';
import { ResolveDate } from '../../test-data/ResolveDynamicData';

Given('the user create a new order with the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const details: Record<string, string> = {};

    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        const value = row[1] ?? '';
        if (value === '<this.clientName>') {
            details[field] = this.clientName ?? '';
        } else if (value === '<this.tempFirstName>') {
            details[field] = this.tempFirstName ?? '';
        } else if (/^<Today([+-]\d+)?>$/.test(value)) {
            details[field] = ResolveDate(value);
        } else {
            details[field] = value;
        }
    }

    await this.orderManagerPage.navigateToClassicOrderPage();
    await this.orderManagerPage.createOrder(details);
});

Then('the order id should be generated successfully', async function (this: CustomWorld) {
    this.orderId = await this.orderManagerPage.waitForOrderId();
    console.log('Order ID:', this.orderId);
});
