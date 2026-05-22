(function () {

  console.log("Kazkova mobile+desktop upsell loaded");

  let popupShown = false;

  function createPopup() {

    if (popupShown) return;
    popupShown = true;

    const popup = document.createElement("div");

    popup.innerHTML = `
      <div id="kazkova-upsell-overlay"></div>

      <div id="kazkova-upsell">

        <button id="kazkova-close">×</button>

        <div class="ku-badge">-10%</div>

        <h2>Додайте до комплекту</h2>

        <p class="ku-sub">
          До цього товару часто додають:
        </p>

        <div class="ku-product">

          <img src="https://kazkova.in.ua/content/images/1/200x300l80nn0/zhinochi-trusyky-utiahuiuchi-dlia-zmenshennia-syluetu-koryhuiuchi-stripy-romб-chorni-rozmir-xl-83-92-sm-90243723151976.jpg">

          <div class="ku-info">
            <div class="ku-title">
              Жіночі трусики утягуючі
            </div>

            <div class="ku-prices">
              <span class="ku-old">249 грн</span>
              <span class="ku-new">224 грн</span>
            </div>
          </div>

        </div>

        <a
          class="ku-btn"
          href="https://kazkova.in.ua/"
        >
          Купити зі знижкою
        </a>

      </div>
    `;

    const style = document.createElement("style");

    style.innerHTML = `

      #kazkova-upsell-overlay{
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.45);
        z-index:999998;
      }

      #kazkova-upsell{
        position:fixed;
        right:20px;
        bottom:20px;
        width:360px;
        background:#fff;
        border-radius:22px;
        padding:22px;
        z-index:999999;
        box-shadow:0 20px 60px rgba(0,0,0,.35);
        font-family:Arial,sans-serif;
        animation:kuShow .35s ease;
      }

      @keyframes kuShow{
        from{
          opacity:0;
          transform:translateY(40px);
        }
        to{
          opacity:1;
          transform:none;
        }
      }

      #kazkova-close{
        position:absolute;
        right:14px;
        top:10px;
        border:none;
        background:none;
        font-size:28px;
        cursor:pointer;
      }

      .ku-badge{
        display:inline-block;
        background:#11a63a;
        color:#fff;
        padding:6px 14px;
        border-radius:30px;
        font-weight:bold;
        margin-bottom:12px;
      }

      #kazkova-upsell h2{
        margin:0 0 10px;
        font-size:30px;
        line-height:1.1;
      }

      .ku-sub{
        color:#666;
        margin-bottom:18px;
      }

      .ku-product{
        display:flex;
        gap:14px;
        align-items:center;
        margin-bottom:20px;
      }

      .ku-product img{
        width:90px;
        border-radius:12px;
      }

      .ku-title{
        font-size:16px;
        font-weight:bold;
        margin-bottom:10px;
      }

      .ku-old{
        text-decoration:line-through;
        color:#999;
        margin-right:10px;
      }

      .ku-new{
        color:#e00000;
        font-size:28px;
        font-weight:bold;
      }

      .ku-btn{
        display:block;
        text-align:center;
        background:#000;
        color:#fff;
        padding:16px;
        border-radius:14px;
        text-decoration:none;
        font-weight:bold;
        font-size:18px;
      }

      @media(max-width:700px){

        #kazkova-upsell{
          left:10px;
          right:10px;
          bottom:10px;
          width:auto;
          padding:18px;
        }

        #kazkova-upsell h2{
          font-size:24px;
        }

        .ku-product{
          align-items:flex-start;
        }

        .ku-product img{
          width:80px;
        }

        .ku-new{
          font-size:24px;
        }

      }

    `;

    document.head.appendChild(style);
    document.body.appendChild(popup);

    document.getElementById("kazkova-close").onclick = function () {
      popup.remove();
    };

    document.getElementById("kazkova-upsell-overlay").onclick = function () {
      popup.remove();
    };

  }

  function checkCart() {

    if (popupShown) return;

    const text = document.body.innerText;

    if (
      text.includes("Оформити замовлення") ||
      text.includes("Кошик") ||
      text.includes("Продовжити покупки")
    ) {
      setTimeout(createPopup, 1200);
    }

  }

  setInterval(checkCart, 1500);

})();
