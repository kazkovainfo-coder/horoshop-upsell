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

async function clickAddCouponButton(frameLocator) {
  const addButton = frameLocator.locator('a.button.add.plus').first();

  await addButton.waitFor({
    state: "visible",
    timeout: 30000
  });

  await addButton.click();
}

async function generateCoupon() {

  console.error("STEP 0 START GENERATE COUPON");

  const discount = Math.max(
    5,
    Math.min(
      10,
      parseInt(process.argv[2] || process.env.COUPON_DISCOUNT || "10", 10)
    )
  );

  const couponCode = makeCouponCode(discount);
  const validTo = getDatePlusDays(3);

  console.error("STEP 0 DISCOUNT", discount);
  console.error("STEP 0 COUPON CODE", couponCode);

  const isRender = !!process.env.RENDER;

  console.error("STEP 1 LAUNCH BROWSER");

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

    console.error("STEP 2 OPEN LOGIN", config.HOROSHOP_DOMAIN + "/edit/");

    await page.goto(config.HOROSHOP_DOMAIN + "/edit/", {
      waitUntil: "commit",
      timeout: 90000
    });

    await page.waitForTimeout(3000);

    console.error("STEP 3 CHECK LOGIN FORM");

    const loginInput =
      (await page.getByPlaceholder("Ел. пошта або логін").count())
        ? page.getByPlaceholder("Ел. пошта або логін")
        : page.locator('input[type="email"], input[type="text"], input[name*="login"], input[name*="email"]').first();

    const passwordInput =
      (await page.getByPlaceholder("Пароль").count())
        ? page.getByPlaceholder("Пароль")
        : page.locator('input[type="password"]').first();

    if (await loginInput.count() && await passwordInput.count()) {

      console.error("STEP 3 LOGIN FORM FOUND");

      await loginInput.fill(String(config.HOROSHOP_LOGIN));
      await passwordInput.fill(String(config.HOROSHOP_PASSWORD));

      console.error("STEP 3 CLICK LOGIN");

      const loginButton =
        (await page.getByRole("button", { name: "Увійти" }).count())
          ? page.getByRole("button", { name: "Увійти" })
          : page.locator('button:has-text("Log in"), button:has-text("Login"), button[type="submit"], input[type="submit"]').first();

      await loginButton.click();

      await page.waitForTimeout(7000);
    }

    console.error("STEP 4 OPEN DISCOUNTS", config.HOROSHOP_DOMAIN + "/edit/discounts/codes");

    await page.goto(config.HOROSHOP_DOMAIN + "/edit/discounts/codes", {
      waitUntil: "commit",
      timeout: 90000
    });

    await page.waitForTimeout(7000);

    console.error("STEP 5 FIND IFRAME");

    const frameLocator = page.locator("#app iframe").contentFrame();

    console.error("STEP 6 DEBUG CURRENT PAGE");

    try {
      console.error("DEBUG PAGE URL", page.url());
      console.error("DEBUG PAGE TITLE", await page.title());
      console.error("DEBUG PAGE TEXT", (await page.locator("body").innerText({ timeout: 5000 })).slice(0, 3000));
    } catch (e) {
      console.error("DEBUG PAGE READ ERROR", String(e && e.message ? e.message : e));
    }

    try {
      console.error("DEBUG FRAME TEXT", (await frameLocator.locator("body").innerText({ timeout: 5000 })).slice(0, 3000));
    } catch (e) {
      console.error("DEBUG FRAME READ ERROR", String(e && e.message ? e.message : e));
    }

    console.error("STEP 6 CLICK ADD COUPON");

    await clickAddCouponButton(frameLocator);

    await page.waitForTimeout(3000);

    console.error("STEP 7 SELECT COUPON TYPE");

    await frameLocator.locator("#coupon-type").selectOption("2");

    if (await frameLocator.locator("#checkbox_param_names4779").count()) {
      await frameLocator.locator("#checkbox_param_names4779").check();
    }

    console.error("STEP 8 FILL DISCOUNT AMOUNT");

    await frameLocator.locator('input[name="names[amount]"]').fill(String(discount));

    if (await frameLocator.getByRole("checkbox", { name: "Діє на товари зі знижкою" }).count()) {
      await frameLocator.getByRole("checkbox", { name: "Діє на товари зі знижкою" }).check();
    }

    console.error("STEP 9 FILL COUPON CODE IF FIELD EXISTS");

    if (await frameLocator.locator('input[name="names[code]"]').count()) {
      await frameLocator.locator('input[name="names[code]"]').fill(couponCode);
    }

    if (await frameLocator.locator('input[name="names[quantity]"]').count()) {
      await frameLocator.locator('input[name="names[quantity]"]').fill("1");
    }

    console.error("STEP 10 FILL VALID DATE");

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

    console.error("STEP 11 SAVE COUPON");

    await frameLocator.getByRole("button", { name: "Зберегти та вийти" }).click();

    await page.waitForTimeout(6000);

    if (await frameLocator.locator('input[name="names[code]"]').count()) {
      try {
        await frameLocator.locator('input[name="names[code]"]').fill(couponCode);
        await frameLocator.getByRole("link", { name: "Зберегти та вийти" }).click();
        await page.waitForTimeout(4000);
      } catch (e) {}
    }

    console.error("STEP 12 READ FINAL COUPON");

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

    console.error("STEP 13 SUCCESS", finalCoupon);

    console.log(JSON.stringify({
      success: true,
      coupon: finalCoupon,
      discount: discount,
      valid_to: validTo.iso
    }));

  } catch (e) {

    console.error("STEP ERROR", String(e && e.message ? e.message : e));

    console.log(JSON.stringify({
      success: false,
      coupon: "",
      discount: discount,
      error: String(e && e.message ? e.message : e)
    }));

    process.exitCode = 1;

  } finally {

    console.error("STEP FINAL CLOSE BROWSER");

    await browser.close();

  }
}

generateCoupon();
