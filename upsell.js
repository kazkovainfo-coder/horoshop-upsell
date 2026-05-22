(function () {
  console.log("Kazkova upsell loaded v3 mobile fix");

  const API_URL = "http://127.0.0.1:8000/recommend";
  let popupShown = false;

  function calculateDiscount(priceText) {
    const price = parseInt(String(priceText).replace(/\D/g, ""));
    if (!price) return priceText;
    return Math.round(price * 0.9) + " грн";
  }

  function getCartTitle() {
    const selectors = [
      ".cart-title a",
      ".cart-title",
      ".cart-item a",
      ".cart-item__title",
      ".cart-product-title",
      ".cart-content a",
      ".cart-items a",
      "[class*='cart'] a"
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const el of elements) {
        const text = (el.innerText || "").trim();

        if (
          text.length > 10 &&
          !text.includes("Оформити") &&
          !text.includes("Повернути") &&
          !text.includes("Увійти")
        ) {
          return text;
        }
      }
    }

    return "Пеньюар чорний мереживний";
  }

  function fallbackOffer() {
    return {
      title: "Жіночі трусики утягуючі для зменшення силуету",
      url: "https://kazkova.in.ua/",
      price: "249 UAH",
      discount: 10
    };
  }

  function createPopup(offer) {
    if (popupShown) return;
    popupShown = true;

    const oldPrice = offer.price || "";
    const newPrice = calculateDiscount(oldPrice);

    const popup = document.createElement("div");
    popup.id = "kazkova-upsell-popup";

    popup.innerHTML = `
      <div class="ku-box">
        <button class="ku-close">×</button>
        <div class="ku-badge">-10%</div>
        <h3>Додайте до комплекту</h3>
        <p class="ku-text">До цього товару часто додають:</p>
        <strong class="ku-title">${offer.title}</strong>
        <div class="ku-price">
          <span class="ku-old">${oldPrice}</span>
          <span class="ku-new">${newPrice}</span>
        </div>
        <a class="ku-btn" href="${offer.url}">Купити зі знижкою</a>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      #kazkova-upsell-popup {
        position: fixed !important;
        right: 20px !important;
        bottom: 20px !important;
        z-index: 2147483647 !important;
        font-family: Arial, sans-serif !important;
      }

      .ku-box {
        width: 340px;
        background: #fff;
        border-radius: 18px;
        padding: 22px;
        box-shadow: 0 15px 50px rgba(0,0,0,.35);
        position: relative;
        box-sizing: border-box;
      }

      .ku-close {
        position: absolute;
        right: 12px;
        top: 10px;
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
      }

      .ku-badge {
        display: inline-block;
        background: #0a9f38;
        color: white;
        padding: 5px 12px;
        border-radius: 20px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .ku-box h3 {
        margin: 5px 0 10px;
        font-size: 24px;
      }

      .ku-text {
        color: #666;
        margin: 0 0 10px;
      }

      .ku-title {
        display: block;
        font-size: 16px;
        margin-bottom: 15px;
      }

      .ku-price {
        margin-bottom: 18px;
      }

      .ku-old {
        text-decoration: line-through;
        color: #999;
        margin-right: 10px;
      }

      .ku-new {
        color: #e10000;
        font-size: 26px;
        font-weight: bold;
      }

      .ku-btn {
        display: block;
        background: #000;
        color: #fff;
        text-align: center;
        padding: 14px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: bold;
      }

      @media (max-width: 768px) {
        #kazkova-upsell-popup {
          left: 10px !important;
          right: 10px !important;
          bottom: 10px !important;
        }

        .ku-box {
          width: 100% !important;
          max-width: none !important;
          padding: 18px !important;
        }

        .ku-box h3 {
          font-size: 20px !important;
        }

        .ku-title {
          font-size: 15px !important;
        }

        .ku-new {
          font-size: 23px !important;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(popup);

    popup.querySelector(".ku-close").onclick = function () {
      popup.remove();
    };
  }

  async function runUpsell() {
    if (popupShown) return;

    const pageText = document.body.innerText || "";

    const cartOpened =
      pageText.includes("Оформити") ||
      pageText.includes("Замовлення") ||
      pageText.includes("Кошик") ||
      document.querySelector(".cart-content") ||
      document.querySelector(".cart-items") ||
      document.querySelector("[class*='cart']");

    if (!cartOpened) return;

    const title = getCartTitle();

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cart_items: [
            {
              product_id: "current_product",
              title: title,
              category: "auto"
            }
          ]
        })
      });

      const data = await response.json();

      if (data.offer) {
        createPopup(data.offer);
      } else {
        createPopup(fallbackOffer());
      }

    } catch (e) {
      createPopup(fallbackOffer());
    }
  }

  setInterval(runUpsell, 1000);
})();
