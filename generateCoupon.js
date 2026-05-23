const { chromium } = require("playwright");

async function generateCoupon() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  try {
    await page.goto("https://kazkova.in.ua/admin/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    const loginResult = await page.evaluate(({ email, password }) => {
      function isVisible(el) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      }

      const inputs = Array.from(document.querySelectorAll("input")).filter(isVisible);

      const passwordInput = inputs.find(i => i.type === "password");
      const loginInput = inputs.find(i => i.type !== "password" && i.type !== "hidden");

      if (!loginInput || !passwordInput) {
        return {
          success: false,
          visibleInputs: inputs.map(i => ({
            type: i.type,
            name: i.name,
            placeholder: i.placeholder,
            id: i.id
          })),
          title: document.title,
          url: location.href
        };
      }

      loginInput.value = email;
      loginInput.dispatchEvent(new Event("input", { bubbles: true }));
      loginInput.dispatchEvent(new Event("change", { bubbles: true }));

      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }));

      return { success: true };
    }, {
      email: process.env.HOROSHOP_EMAIL,
      password: process.env.HOROSHOP_PASSWORD
    });

    if (!loginResult.success) {
      console.log(JSON.stringify(loginResult, null, 2));
      throw new Error("Login fields not found");
    }

    await page.click("text=Увійти");

    await page.waitForTimeout(7000);

    await page.goto("https://kazkova.in.ua/edit/discounts/codes", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    await page.click("text=Згенерувати сертифікати");

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

    await page.click("text=Зберегти");

    await page.waitForTimeout(5000);

    console.log("Coupon created");

  } finally {
    await browser.close();
  }
}

generateCoupon();
