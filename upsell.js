export default {
  async fetch(request) {
    return new Response(`

(function () {
  const API_URL = "https://horoshop-upsell.onrender.com/recommend";
  let popupShown = false;

  function getCartTitle() {
    const selectors = [
      ".cart-title a",
      ".cart-title",
      ".cart-item a",
      ".cart-item__title",
      ".cart-product-title",
      "[class*='cart'] a"
    ];

    for (const selector of selectors) {
      const items = document.querySelectorAll(selector);
      for (const el of items) {
        const text = (el.innerText || "").trim();
        if (text.length > 10 && !text.includes("Оформити") && !text.includes("Продовжити")) {
          return text;
        }
      }
    }

    return "";
  }

  function priceWithDiscount(priceText) {
    const price = parseInt(String(priceText).replace(/\\D/g, ""));
    if (!price) return "";
    return Math.round(price * 0.9) + " грн";
  }

  function createPopup(offer) {
    if (popupShown) return;
    popupShown = true;

    const oldPrice = offer.price || "";
    const newPrice = priceWithDiscount(oldPrice);

    const popup = document.createElement("div");
    popup.id = "kazkova-upsell-popup";

    popup.innerHTML =
      '<div id="kazkova-upsell-overlay"></div>' +
      '<div id="kazkova-upsell">' +
      '<button id="kazkova-close">×</button>' +
      '<div class="ku-badge">-10%</div>' +
      '<h2>Додайте до комплекту</h2>' +
      '<p class="ku-sub">До цього товару часто додають:</p>' +
      '<div class="ku-title">' + offer.title + '</div>' +
      '<div class="ku-prices"><span class="ku-old">' + oldPrice + '</span><span class="ku-new">' + newPrice + '</span></div>' +
      '<a class="ku-btn" href="' + offer.url + '">Купити зі знижкою</a>' +
      '</div>';

    const style = document.createElement("style");
    style.innerHTML =
      '#kazkova-upsell-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999998}' +
      '#kazkova-upsell{position:fixed;right:20px;bottom:20px;width:360px;background:#fff;border-radius:22px;padding:22px;z-index:999999;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:Arial,sans-serif}' +
      '#kazkova-close{position:absolute;right:14px;top:10px;border:none;background:none;font-size:28px;cursor:pointer}' +
      '.ku-badge{display:inline-block;background:#11a63a;color:#fff;padding:6px 14px;border-radius:30px;font-weight:bold;margin-bottom:12px}' +
      '#kazkova-upsell h2{margin:0 0 10px;font-size:28px;line-height:1.1}' +
      '.ku-sub{color:#666;margin-bottom:14px}' +
      '.ku-title{font-size:16px;font-weight:bold;line-height:1.4;margin-bottom:14px}' +
      '.ku-old{text-decoration:line-through;color:#999;margin-right:10px}' +
      '.ku-new{color:#e00000;font-size:28px;font-weight:bold}' +
      '.ku-btn{display:block;text-align:center;background:#000;color:#fff;padding:16px;border-radius:14px;text-decoration:none;font-weight:bold;font-size:17px;margin-top:18px}' +
      '@media(max-width:700px){#kazkova-upsell{left:10px;right:10px;bottom:10px;width:auto;padding:18px}#kazkova-upsell h2{font-size:23px}.ku-new{font-size:24px}}';

    document.head.appendChild(style);
    document.body.appendChild(popup);

    document.getElementById("kazkova-close").onclick = function () {
      popup.remove();
    };

    document.getElementById("kazkova-upsell-overlay").onclick = function () {
      popup.remove();
    };
  }

  async function checkCart() {
    if (popupShown) return;

    const text = document.body.innerText || "";

    if (
      !text.includes("Оформити замовлення") &&
      !text.includes("Кошик") &&
      !text.includes("Продовжити покупки")
    ) return;

    const title = getCartTitle();
    if (!title) return;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          cart_items: [{
            product_id: "current_product",
            title: title,
            category: "auto"
          }]
        })
      });

      const data = await response.json();

      if (data.offer) {
        createPopup(data.offer);
      }

    } catch (e) {
      console.log("Kazkova upsell API error", e);
    }
  }

  setInterval(checkCart, 1500);
})();

    `, {
      headers: {
        "content-type": "application/javascript",
        "access-control-allow-origin": "*"
      }
    });
  }
}
