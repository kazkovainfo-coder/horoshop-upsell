const { chromium } = require("playwright");

async function generateCoupon() {

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.goto("https://kazkova.in.ua/admin");

  await page.waitForTimeout(3000);

  const loginInputs = await page.$$("input");

  await loginInputs[0].fill(process.env.HOROSHOP_EMAIL);
  await loginInputs[1].fill(process.env.HOROSHOP_PASSWORD);

  await page.click("text=Увійти");

  await page.waitForTimeout(5000);

  await page.goto("https://kazkova.in.ua/edit/discounts/codes");

  await page.waitForTimeout(4000);

  await page.click("text=Згенерувати сертифікати");

  await page.waitForTimeout(3000);

  await page.selectOption("select", {
    label: "Купон на знижку"
  });

  const inputs = await page.$$("input");

  await inputs[1].fill("10");
  await inputs[2].fill("1");
  await inputs[3].fill("1");

  const today = new Date();

  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const date = `${dd}.${mm}.${yyyy}`;

  await inputs[4].fill(date);

  await page.click("text=Зберегти");

  await page.waitForTimeout(5000);

  console.log("Coupon created");

  await browser.close();

}

generateCoupon();
