const { chromium } = require("playwright");

async function generateCoupon() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    await page.goto("https://kazkova.in.ua/edit/discounts/codes", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(4000);

    const loginVisible = await page.getByPlaceholder("Ел. пошта або логін").count();

    if (loginVisible > 0) {
      await page.getByPlaceholder("Ел. пошта або логін").fill(process.env.HOROSHOP_EMAIL);
      await page.getByPlaceholder("Пароль").fill(process.env.HOROSHOP_PASSWORD);
      await page.getByRole("button", { name: "Увійти" }).click();
      await page.waitForTimeout(7000);
    }

    const frame = page.locator("#app iframe").contentFrame();

    await frame.getByRole("link", { name: "Згенерувати сертифікати" }).click();

    await page.waitForTimeout(3000);

    await frame.locator("#discount-type-select").selectOption("2");

    await frame.locator('input[name="amount"]').fill("10");
    await frame.locator("#co-quantity").fill("1");
    await frame.locator('input[name="count"]').fill("1");

    const todayDay = String(new Date().getDate());

    await frame.getByRole("link", {
      name: todayDay,
      exact: true
    }).click();

    await page.waitForTimeout(1000);

    await frame.getByRole("button", { name: "Зберегти" }).click();

    await page.waitForTimeout(4000);

    const couponCode = await frame
      .locator("tbody tr")
      .first()
      .locator("td")
      .nth(3)
      .innerText();

    console.log(couponCode.trim());

    await context.close();
    await browser.close();

  } catch (error) {
    await context.close();
    await browser.close();
    throw error;
  }
}

generateCoupon();
