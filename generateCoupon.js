const { chromium } = require("playwright");

async function generateCoupon() {

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 900
    }
  });

  await page.goto("https://kazkova.in.ua/admin", {
    waitUntil: "domcontentloaded"
  });

  await page.waitForTimeout(5000);

  await page.getByPlaceholder("Ел. пошта або логін").fill(process.env.HOROSHOP_EMAIL);
  await page.getByPlaceholder("Пароль").fill(process.env.HOROSHOP_PASSWORD);

  await page.getByText("Увійти", { exact: true }).click();

  await page.waitForTimeout(7000);

  await page.goto("https://kazkova.in.ua/edit/discounts/codes", {
    waitUntil: "domcontentloaded"
  });

  await page.waitForTimeout(5000);

  await page.getByText("Згенерувати сертифікати", { exact: true }).click();

  await page.waitForTimeout(3000);

  await page.locator("select").first().selectOption({
    label: "Купон на знижку"
  });

  await page.locator("input:visible").nth(0).fill("10");
  await page.locator("input:visible").nth(1).fill("1");
  await page.locator("input:visible").nth(2).fill("1");

  const today = new Date();

  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const date = `${dd}.${mm}.${yyyy}`;

  await page.locator("input:visible").nth(3).fill(date);

  await page.getByText("Зберегти", { exact: true }).click();

  await page.waitForTimeout(5000);

  console.log("Coupon created");

  await browser.close();

}

generateCoupon();
