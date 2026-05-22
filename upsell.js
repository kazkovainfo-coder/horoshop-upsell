(function () {

    console.log("Upsell system loaded");

    let popupShown = false;

    // ============================================
    // CREATE POPUP
    // ============================================

    function createPopup(product) {

        if (document.getElementById("upsell-popup")) {
            return;
        }

        const popup = document.createElement("div");

        popup.id = "upsell-popup";

        popup.innerHTML = `
        
        <div id="upsell-overlay"></div>

        <div id="upsell-box">

            <button id="upsell-close">×</button>

            <div id="upsell-content">

                <div id="upsell-image-wrap">
                    <img 
                        src="${product.image || ''}" 
                        alt="${product.title}"
                        id="upsell-image"
                    >
                </div>

                <div id="upsell-info">

                    <div id="upsell-badge">
                        -10%
                    </div>

                    <h3 id="upsell-title">
                        Додайте до комплекту
                    </h3>

                    <p id="upsell-subtitle">
                        До цього товару часто додають:
                    </p>

                    <div id="upsell-product-title">
                        ${product.title}
                    </div>

                    <div id="upsell-price-wrap">

                        <div id="upsell-old-price">
                            ${product.price}
                        </div>

                        <div id="upsell-new-price">
                            ${calculateDiscount(product.price)}
                        </div>

                    </div>

                    <div id="upsell-buttons">

                        <a 
                            href="${product.url}" 
                            id="upsell-view-btn"
                        >
                            Переглянути товар
                        </a>

                    </div>

                </div>

            </div>

        </div>
        `;

        document.body.appendChild(popup);

        // ============================================
        // CLOSE
        // ============================================

        document
            .getElementById("upsell-close")
            .addEventListener("click", () => {
                popup.remove();
            });

        document
            .getElementById("upsell-overlay")
            .addEventListener("click", () => {
                popup.remove();
            });

        // ============================================
        // STYLES
        // ============================================

        const style = document.createElement("style");

        style.innerHTML = `

        #upsell-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 99998;
            backdrop-filter: blur(2px);
        }

        #upsell-box {
            position: fixed;
            right: 25px;
            bottom: 25px;
            width: 430px;
            background: white;
            border-radius: 22px;
            z-index: 99999;
            overflow: hidden;
            box-shadow: 0 15px 50px rgba(0,0,0,0.25);
            animation: upsellShow .35s ease;
            font-family: Arial, sans-serif;
        }

        @keyframes upsellShow {
            from {
                transform: translateY(40px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        #upsell-content {
            display: flex;
            gap: 18px;
            padding: 22px;
        }

        #upsell-image-wrap {
            width: 140px;
            min-width: 140px;
        }

        #upsell-image {
            width: 100%;
            border-radius: 14px;
            object-fit: cover;
        }

        #upsell-info {
            flex: 1;
        }

        #upsell-close {
            position: absolute;
            top: 12px;
            right: 12px;
            border: none;
            background: transparent;
            font-size: 26px;
            cursor: pointer;
            color: #777;
        }

        #upsell-badge {
            display: inline-block;
            background: #0c9b38;
            color: white;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 13px;
            margin-bottom: 12px;
            font-weight: bold;
        }

        #upsell-title {
            margin: 0;
            font-size: 24px;
            line-height: 1.2;
        }

        #upsell-subtitle {
            color: #666;
            margin-top: 8px;
            margin-bottom: 10px;
            font-size: 14px;
        }

        #upsell-product-title {
            font-size: 16px;
            font-weight: bold;
            line-height: 1.4;
            margin-bottom: 16px;
        }

        #upsell-price-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        #upsell-old-price {
            text-decoration: line-through;
            color: #999;
            font-size: 16px;
        }

        #upsell-new-price {
            color: #e10000;
            font-size: 28px;
            font-weight: bold;
        }

        #upsell-view-btn {
            display: block;
            background: black;
            color: white;
            text-align: center;
            padding: 14px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: bold;
            transition: .2s;
        }

        #upsell-view-btn:hover {
            opacity: .85;
        }

        @media(max-width: 600px) {

            #upsell-box {
                width: calc(100% - 20px);
                right: 10px;
                left: 10px;
                bottom: 10px;
            }

            #upsell-content {
                flex-direction: column;
            }

            #upsell-image-wrap {
                width: 100%;
            }

            #upsell-title {
                font-size: 21px;
            }

        }

        `;

        document.head.appendChild(style);
    }

    // ============================================
    // CALCULATE DISCOUNT
    // ============================================

    function calculateDiscount(priceText) {

        try {

            const number = parseInt(priceText);

            const discounted = Math.round(number * 0.9);

            return discounted + " грн";

        } catch {

            return priceText;

        }

    }

    // ============================================
    // GET PRODUCT TITLE
    // ============================================

    function getCartProductTitle() {

        const selectors = [
            ".cart-title a",
            ".cart-title",
            ".cart-product-title",
            ".cart-item__title",
            ".popup-cart__name"
        ];

        for (const selector of selectors) {

            const element = document.querySelector(selector);

            if (element) {

                return element.innerText.trim();

            }

        }

        return null;
    }

    // ============================================
    // CALL API
    // ============================================

    async function loadRecommendation() {

        if (popupShown) {
            return;
        }

        const title = getCartProductTitle();

        if (!title) {
            return;
        }

        popupShown = true;

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/recommend",
                {
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
                }
            );

            const data = await response.json();

            if (!data.offer) {
                return;
            }

            createPopup({
                title: data.offer.title,
                url: data.offer.url,
                price: data.offer.price,
                image: ""
            });

        } catch (error) {

            console.error("Upsell error:", error);

        }

    }

    // ============================================
    // OBSERVE CART
    // ============================================

    const observer = new MutationObserver(() => {

        const cartVisible =
            document.body.innerText.includes("Оформити замовлення");

        if (cartVisible) {

            setTimeout(() => {

                loadRecommendation();

            }, 1200);

        }

    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();