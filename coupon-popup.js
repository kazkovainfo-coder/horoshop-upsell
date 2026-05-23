export default {
  async fetch(request) {
    return new Response(`

(function () {

  const COUPON_URL = "https://horoshop-upsell.onrender.com/generate-coupon";
  const STORAGE_KEY = "kazkova_cart_coupon";

  let couponRequestStarted = false;

  function isCartPage() {
    const text = document.body.innerText || "";

    return (
      text.includes("Кошик") ||
      text.includes("Оформити замовлення") ||
      text.includes("Продовжити покупки") ||
      window.location.href.includes("cart")
    );
  }

  function readCoupon() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function saveCoupon(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function showCouponPopup(coupon, discount) {
    if (document.getElementById("kazkova-coupon-popup")) return;

    const popup = document.createElement("div");
    popup.id = "kazkova-coupon-popup";

    popup.innerHTML =
      '<div id="kazkova-coupon-box">' +
      '<button id="kazkova-coupon-close">×</button>' +
      '<div class="kc-title">🎁 Ваш купон готовий</div>' +
      '<div class="kc-text">Ваша знижка: ' + discount + '%</div>' +
      '<div class="kc-code">' + coupon + '</div>' +
      '<button id="kazkova-copy-coupon">Скопіювати купон</button>' +
      '</div>';

    const style = document.createElement("style");
    style.innerHTML =
      '#kazkova-coupon-popup{position:fixed;left:20px;bottom:20px;z-index:999999;font-family:Arial,sans-serif}' +
      '#kazkova-coupon-box{position:relative;width:330px;background:#fff;border-radius:22px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.3);border:1px solid #eee;text-align:center}' +
      '#kazkova-coupon-close{position:absolute;right:12px;top:8px;border:none;background:none;font-size:28px;cursor:pointer}' +
      '.kc-title{font-size:22px;font-weight:900;margin-bottom:12px}' +
      '.kc-text{font-size:16px;margin-bottom:12px;color:#333}' +
      '.kc-code{font-size:28px;font-weight:900;letter-spacing:1px;border:2px dashed #111;border-radius:14px;padding:14px;margin-bottom:16px}' +
      '#kazkova-copy-coupon{width:100%;background:#000;color:#fff;border:none;border-radius:14px;padding:15px;font-size:16px;font-weight:bold;cursor:pointer}' +
      '@media(max-width:700px){#kazkova-coupon-popup{left:10px;right:10px;bottom:10px}#kazkova-coupon-box{width:auto}}';

    document.head.appendChild(style);
    document.body.appendChild(popup);

    document.getElementById("kazkova-coupon-close").onclick = function () {
      popup.remove();
    };

    document.getElementById("kazkova-copy-coupon").onclick = function () {
      navigator.clipboard.writeText(coupon);
      this.innerText = "Скопійовано";
    };
  }

  async function generateCoupon() {
    if (couponRequestStarted) return;

    couponRequestStarted = true;

    const discount = Math.floor(Math.random() * 6) + 5;

    saveCoupon({
      status: "pending",
      discount: discount,
      coupon: "",
      time: Date.now()
    });

    try {
      const response = await fetch(COUPON_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          discount: discount
        })
      });

      const data = await response.json();

      if (data && data.success && data.coupon) {
        saveCoupon({
          status: "ready",
          discount: data.discount || discount,
          coupon: data.coupon,
          time: Date.now()
        });

        if (isCartPage()) {
          showCouponPopup(data.coupon, data.discount || discount);
        }
      }

    } catch (e) {
      saveCoupon({
        status: "error",
        discount: discount,
        coupon: "",
        error: String(e && e.message ? e.message : e),
        time: Date.now()
      });
    }
  }

  function checkCartCoupon() {
    if (!isCartPage()) return;

    const saved = readCoupon();

    if (saved && saved.status === "ready" && saved.coupon) {
      showCouponPopup(saved.coupon, saved.discount);
      return;
    }

    if (!saved || saved.status === "error") {
      generateCoupon();
    }
  }

  setInterval(checkCartCoupon, 1500);
  setTimeout(checkCartCoupon, 800);

})();

    `, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": "no-store"
      }
    });
  }
}
