const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

let config = {};

try {
  const configPath = path.join(__dirname, "config.json");

  if (fs.existsSync(configPath)) {
    config = JSON.parse(
      fs.readFileSync(configPath, "utf8")
    );
  }
} catch (e) {}

config.HOROSHOP_DOMAIN =
  process.env.HOROSHOP_DOMAIN || config.HOROSHOP_DOMAIN;

config.HOROSHOP_LOGIN =
  process.env.HOROSHOP_LOGIN || config.HOROSHOP_LOGIN;

config.HOROSHOP_PASSWORD =
  process.env.HOROSHOP_PASSWORD || config.HOROSHOP_PASSWORD;

if (!config.HOROSHOP_DOMAIN || !config.HOROSHOP_LOGIN || !config.HOROSHOP_PASSWORD) {
  console.log(JSON.stringify({
    success: false,
    coupon: "",
    discount: 0,
    error: "Потрібні HOROSHOP_DOMAIN, HOROSHOP_LOGIN, HOROSHOP_PASSWORD"
  }));
  process.exit(1);
}

config.HOROSHOP_DOMAIN = String(config.HOROSHOP_DOMAIN).replace(/\/$/, "");

function makeCouponCode(discount) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return "KAZ" + discount + random;
}

function getDatePlusDays(days) {
  const date = new Date();

  date.setDate(date.getDate() + days);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return {
    yyyy,
    mm,
    dd,
    iso: `${yyyy}-${mm}-${dd}`,
    ua: `${dd}.${mm}.${yyyy}`
  };
}

async function generateCoupon() {

  const discount = Math.max(
    5,
    Math.min(
      10,
      parseInt(process.argv[2] || process.env.COUPON_DISCOUNT || "10", 10)
    )
  );

  const couponCode = makeCouponCode(discount);
  const validTo = getDatePlusDays(3);

  const isRender = !!process.env.RENDER;

  const browser = await chromium.launch({
    headless: isRender ? true : false,
    slowMo: isRender ? 0 : 700,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 900
    }
  });

  try {

    await page.goto(config.HOROSHOP_DOMAIN + "/edit/", {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(3000);

    if (await page.getByPlaceholder("Ел. пошта або логін").count()) {

      await page.getByPlaceholder("Ел. пошта або логін").fill(String(config.HOROSHOP_LOGIN));
      await page.getByPlaceholder("Пароль").fill(String(config.HOROSHOP_PASSWORD));

      await page.getByRole("button", { name: "Увійти" }).click();

      await page.waitForTimeout(7000);
    }

    await page.goto(config.HOROSHOP_DOMAIN + "/edit/discounts/codes", {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(7000);

    const frameLocator = page.locator("#app iframe").contentFrame();

    await frameLocator.getByRole("link", { name: "Додати" }).click();

    await page.waitForTimeout(3000);

    await frameLocator.locator("#coupon-type").selectOption("2");

    if (await frameLocator.locator("#checkbox_param_names4779").count()) {
      await frameLocator.locator("#checkbox_param_names4779").check();
    }

    await frameLocator.locator('input[name="names[amount]"]').fill(String(discount));

    if (await frameLocator.getByRole("checkbox", { name: "Діє на товари зі знижкою" }).count()) {
      await frameLocator.getByRole("checkbox", { name: "Діє на товари зі знижкою" }).check();
    }

    if (await frameLocator.locator('input[name="names[code]"]').count()) {
      await frameLocator.locator('input[name="names[code]"]').fill(couponCode);
    }

    if (await frameLocator.locator('input[name="names[quantity]"]').count()) {
      await frameLocator.locator('input[name="names[quantity]"]').fill("1");
    }

    const dateInputs = [
      'input[name="names[date_end]"]',
      'input[name="names[date_to]"]',
      'input[name="names[valid_to]"]',
      'input[name*="date"]'
    ];

    let dateFilled = false;

    for (const selector of dateInputs) {
      if (await frameLocator.locator(selector).count()) {
        try {
          await frameLocator.locator(selector).first().fill(validTo.iso);
          dateFilled = true;
          break;
        } catch (e) {}

        try {
          await frameLocator.locator(selector).first().fill(validTo.ua);
          dateFilled = true;
          break;
        } catch (e) {}
      }
    }

    if (!dateFilled) {
      try {
        await frameLocator.getByRole("cell", { name: new RegExp(validTo.iso) }).locator("img").click();
        await frameLocator.getByRole("link", { name: String(validTo.dd) }).click();
      } catch (e) {}
    }

    await frameLocator.getByRole("button", { name: "Зберегти та вийти" }).click();

    await page.waitForTimeout(6000);

    if (await frameLocator.locator('input[name="names[code]"]').count()) {
      try {
        await frameLocator.locator('input[name="names[code]"]').fill(couponCode);
        await frameLocator.getByRole("link", { name: "Зберегти та вийти" }).click();
        await page.waitForTimeout(4000);
      } catch (e) {}
    }

    let finalCoupon = couponCode;

    try {
      await page.waitForTimeout(3000);

      if (await frameLocator.locator("a.control_edit").count()) {
        await frameLocator.locator("a.control_edit").first().click();

        await page.waitForTimeout(3000);

        if (await frameLocator.locator('input[name="names[code]"]').count()) {
          const realCoupon = await frameLocator.locator('input[name="names[code]"]').inputValue();

          if (realCoupon) {
            finalCoupon = realCoupon;
          }
        }
      }
    } catch (e) {}

    console.log(JSON.stringify({
      success: true,
      coupon: finalCoupon,
      discount: discount,
      valid_to: validTo.iso
    }));

  } catch (e) {

    console.log(JSON.stringify({
      success: false,
      coupon: "",
      discount: discount,
      error: String(e && e.message ? e.message : e)
    }));

    process.exitCode = 1;

  } finally {

    await browser.close();

  }
}

generateCoupon();
