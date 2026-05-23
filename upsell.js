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

        if (
          text.length > 5 &&
          !text.includes("Оформити") &&
          !text.includes("Продовжити")
        ) {
          return text;
        }
      }
    }

    return "";
  }

  function createPopup(offer) {

    if (popupShown) return;

    popupShown = true;

    const popup = document.createElement("div");

    popup.id = "kazkova-upsell-popup";

    popup.innerHTML =
      '<div id="kazkova-upsell-overlay"></div>' +

      '<div id="kazkova-upsell">' +

      '<button id="kazkova-close">×</button>' +

      '<div class="ku-header">' +
      'З цим товаром часто купують' +
      '</div>' +

      '<div class="ku-product">' +

      '<img class="ku-image" src="' + (offer.image || "") + '">' +

      '<div class="ku-info">' +

      '<div class="ku-title">' +
      offer.title +
      '</div>' +

      '<div class="ku-price">' +
      offer.price +
      '</div>' +

      '</div>' +

      '</div>' +

      '<a class="ku-btn" href="' + offer.url + '">' +
      'Перейти до товару' +
      '</a>' +

      '</div>';

    const style = document.createElement("style");

    style.innerHTML =

      '#kazkova-upsell-overlay{' +
      'position:fixed;' +
      'inset:0;' +
      'background:rgba(0,0,0,.4);' +
      'z-index:999998' +
      '}' +

      '#kazkova-upsell{' +
      'position:fixed;' +
      'right:20px;' +
      'bottom:20px;' +
      'width:360px;' +
      'background:#fff;' +
      'border-radius:22px;' +
      'padding:22px;' +
      'z-index:999999;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.35);' +
      'font-family:Arial,sans-serif' +
      '}' +

      '#kazkova-close{' +
      'position:absolute;' +
      'right:14px;' +
      'top:10px;' +
      'border:none;' +
      'background:none;' +
      'font-size:28px;' +
      'cursor:pointer' +
      '}' +

      '.ku-header{' +
      'font-size:24px;' +
      'font-weight:bold;' +
      'line-height:1.2;' +
      'margin-bottom:18px' +
      '}' +

      '.ku-product{' +
      'display:flex;' +
      'gap:14px;' +
      'align-items:center;' +
      'margin-bottom:18px' +
      '}' +

      '.ku-image{' +
      'width:90px;' +
      'height:90px;' +
      'object-fit:cover;' +
      'border-radius:14px;' +
      'background:#f3f3f3' +
      '}' +

      '.ku-info{' +
      'flex:1' +
      '}' +

      '.ku-title{' +
      'font-size:15px;' +
      'font-weight:bold;' +
      'line-height:1.4;' +
      'margin-bottom:10px' +
      '}' +

      '.ku-price{' +
      'font-size:24px;' +
      'font-weight:bold;' +
      'color:#000' +
      '}' +

      '.ku-btn{' +
      'display:block;' +
      'text-align:center;' +
      'background:#000;' +
      'color:#fff;' +
      'padding:16px;' +
      'border-radius:14px;' +
      'text-decoration:none;' +
      'font-weight:bold;' +
      'font-size:16px' +
      '}' +

      '@media(max-width:700px){' +

      '#kazkova-upsell{' +
      'left:10px;' +
      'right:10px;' +
      'bottom:10px;' +
      'width:auto;' +
      'padding:18px' +
      '}' +

      '.ku-header{' +
      'font-size:20px' +
      '}' +

      '.ku-image{' +
      'width:75px;' +
      'height:75px' +
      '}' +

      '}';

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
        headers: {
          "Content-Type": "application/json"
        },
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
