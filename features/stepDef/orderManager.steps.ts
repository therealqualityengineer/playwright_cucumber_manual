import { Given, Then, DataTable } from "@cucumber/cucumber";
import { CustomWorld } from "../../utils/CustomWorld";
import { resolvePlaceholder } from "../../utils/resolvePlaceholder";

Given(
  "the user create a new order with the following details",
  async function (this: CustomWorld, dataTable: DataTable) {
    const details: Record<string, string> = {};

    for (const row of dataTable.raw().slice(1)) {
      details[row[0] ?? ""] = resolvePlaceholder(row[1] ?? "", this);
    }

    await this.orderManagerPage.navigateToClassicOrderPage();
    await this.orderManagerPage.createOrder(details);
  },
);

Then(
  "the order id should be generated successfully",
  async function (this: CustomWorld) {
    this.orderId = await this.orderManagerPage.waitForOrderId();
    console.log("Order ID:", this.orderId);
  },
);
