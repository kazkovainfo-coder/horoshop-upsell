from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
import os
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRODUCTS_FILE = "products.json"
PAIRS_FILE = "purchase_pairs.json"

# =====================================================
# MODELS
# =====================================================

class CartItem(BaseModel):
    product_id: str
    title: str
    category: str = ""

class CartRequest(BaseModel):
    cart_items: list[CartItem]

class PurchaseRequest(BaseModel):
    cart_items: list[CartItem]

class CouponRequest(BaseModel):
    discount: int

# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():
    return {"status": "Smart upsell API працює"}

# =====================================================
# FILE HELPERS
# =====================================================

def load_products():
    with open(PRODUCTS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)

def load_pairs():
    if not os.path.exists(PAIRS_FILE):
        return {}

    try:
        with open(PAIRS_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except:
        return {}

def save_pairs(pairs):
    with open(PAIRS_FILE, "w", encoding="utf-8") as file:
        json.dump(pairs, file, ensure_ascii=False, indent=2)

def product_to_offer(product, source="ai"):
    return {
        "product_id": product["id"],
        "title": product["title"],
        "url": product["url"],
        "image": product.get("image", ""),
        "price": product["price"],
        "source": source
    }

# =====================================================
# DETECT PRODUCT TYPE
# =====================================================

def detect_product_type(title):

    title = title.lower()

    if "пеньюар" in title:
        return "peniuar"

    if "корсет" in title:
        return "corset"

    if "трус" in title:
        return "panties"

    if "панчох" in title:
        return "stockings"

    if "боді" in title:
        return "body"

    if "бодістокінг" in title:
        return "body"

    return "unknown"

# =====================================================
# DETECT COLOR
# =====================================================

def detect_color(title):

    title = title.lower()

    colors = {
        "чор": "black",
        "біли": "white",
        "червон": "red",
        "рожев": "pink",
        "беж": "beige",
        "син": "blue",
        "фіолет": "purple",
        "зел": "green"
    }

    for key, value in colors.items():
        if key in title:
            return value

    return "unknown"

# =====================================================
# COMPATIBILITY RULES
# =====================================================

COMPATIBILITY_RULES = {
    "peniuar": ["stockings", "panties", "body"],
    "corset": ["panties", "stockings"],
    "panties": ["corset", "body"],
    "stockings": ["peniuar", "body"],
    "body": ["stockings", "panties"]
}

# =====================================================
# SCORE PRODUCT
# =====================================================

def score_product(product, main_product, cart_ids):

    score = 0

    # stock
    if not product.get("stock"):
        return -999

    # duplicate
    if product["id"] in cart_ids:
        return -999

    # type compatibility
    if product["type"] == main_product["type"]:
        return -999

    compatible = COMPATIBILITY_RULES.get(
        main_product["type"],
        []
    )

    if product["type"] in compatible:
        score += 50

    # color matching
    if product.get("color") == main_product.get("color"):
        score += 30

    # priority
    score += product.get("priority", 0)

    # expensive products lower priority
    try:
        price = int(str(product["price"]).split()[0])

        if price < 500:
            score += 10

    except:
        pass

    # randomization
    score += random.randint(1, 15)

    return score

# =====================================================
# REAL PURCHASE RECOMMENDATION
# =====================================================

def find_real_pair_offer(main_product_id, cart_ids, products):

    pairs = load_pairs()

    if main_product_id not in pairs:
        return None

    product_by_id = {
        str(product["id"]): product
        for product in products
    }

    related = pairs.get(main_product_id, {})

    sorted_related = sorted(
        related.items(),
        key=lambda x: x[1],
        reverse=True
    )

    for related_id, count in sorted_related:

        if related_id in cart_ids:
            continue

        product = product_by_id.get(str(related_id))

        if not product:
            continue

        if not product.get("stock"):
            continue

        offer = product_to_offer(product, source="real_purchases")
        offer["pair_count"] = count

        return offer

    return None

# =====================================================
# AI FALLBACK RECOMMENDATION
# =====================================================

def find_ai_offer(data, products):

    cart_ids = [
        item.product_id
        for item in data.cart_items
    ]

    main_item = data.cart_items[0]

    main_product = {
        "id": main_item.product_id,
        "title": main_item.title,
        "type": detect_product_type(main_item.title),
        "color": detect_color(main_item.title)
    }

    scored_products = []

    for product in products:

        product_score = score_product(
            product,
            main_product,
            cart_ids
        )

        if product_score > 0:

            product_copy = product.copy()
            product_copy["score"] = product_score

            scored_products.append(product_copy)

    if not scored_products:
        return None

    scored_products = sorted(
        scored_products,
        key=lambda x: x["score"],
        reverse=True
    )

    best_offer = scored_products[0]

    offer = product_to_offer(best_offer, source="ai_fallback")
    offer["score"] = best_offer["score"]

    return offer

# =====================================================
# API RECOMMEND
# =====================================================

@app.post("/recommend")
def recommend(data: CartRequest):

    products = load_products()

    if not data.cart_items:
        return {"offer": None}

    cart_ids = [
        item.product_id
        for item in data.cart_items
    ]

    main_item = data.cart_items[0]

    real_offer = find_real_pair_offer(
        main_item.product_id,
        cart_ids,
        products
    )

    if real_offer:
        return {
            "offer": real_offer,
            "message": "З цим товаром часто купують"
        }

    ai_offer = find_ai_offer(data, products)

    if ai_offer:
        return {
            "offer": ai_offer,
            "message": "З цим товаром часто купують"
        }

    return {"offer": None}

# =====================================================
# TRACK PURCHASE PAIRS
# =====================================================

@app.post("/track-purchase")
def track_purchase(data: PurchaseRequest):

    if len(data.cart_items) < 2:
        return {
            "success": True,
            "message": "Недостатньо товарів для запису пари"
        }

    pairs = load_pairs()

    ids = [
        item.product_id
        for item in data.cart_items
        if item.product_id
    ]

    for main_id in ids:

        if main_id not in pairs:
            pairs[main_id] = {}

        for related_id in ids:

            if related_id == main_id:
                continue

            if related_id not in pairs[main_id]:
                pairs[main_id][related_id] = 0

            pairs[main_id][related_id] += 1

    save_pairs(pairs)

    return {
        "success": True,
        "message": "Пари товарів збережені",
        "items_count": len(ids)
    }


# =====================================================
# GENERATE HOROSHOP COUPON
# =====================================================

@app.post("/generate-coupon")
def generate_coupon(data: CouponRequest):

    discount = int(data.discount)

    if discount < 5:
        discount = 5

    if discount > 10:
        discount = 10

    try:

        result = subprocess.run(
            ["node", "generateCoupon.js", str(discount)],
            capture_output=True,
            text=True,
            timeout=90
        )

        output = (result.stdout or "").strip()
        error = (result.stderr or "").strip()

        if result.returncode != 0:
            return {
                "success": False,
                "discount": discount,
                "coupon": "",
                "error": error or output or "Помилка створення купона"
            }

        try:
            parsed = json.loads(output.splitlines()[-1])

            return {
                "success": True,
                "discount": discount,
                "coupon": parsed.get("coupon", ""),
                "message": "Купон створено"
            }

        except:

            return {
                "success": True,
                "discount": discount,
                "coupon": output,
                "message": "Купон створено"
            }

    except Exception as e:

        return {
            "success": False,
            "discount": discount,
            "coupon": "",
            "error": str(e)
        }

# =====================================================
# DEBUG PAIRS
# =====================================================

@app.get("/purchase-pairs")
def purchase_pairs():
    return load_pairs()
