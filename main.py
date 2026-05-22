from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# MODELS
# =====================================================

class CartItem(BaseModel):
    product_id: str
    title: str
    category: str = ""

class CartRequest(BaseModel):
    cart_items: list[CartItem]

# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():
    return {"status": "Upsell API працює"}

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
        price = int(product["price"].split()[0])

        if price < 500:
            score += 10

    except:
        pass

    # randomization
    score += random.randint(1, 15)

    return score

# =====================================================
# API RECOMMEND
# =====================================================

@app.post("/recommend")
def recommend(data: CartRequest):

    with open("products.json", "r", encoding="utf-8") as file:
        products = json.load(file)

    if not data.cart_items:
        return {"offer": None}

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

            product["score"] = product_score

            scored_products.append(product)

    if not scored_products:
        return {"offer": None}

    scored_products = sorted(
        scored_products,
        key=lambda x: x["score"],
        reverse=True
    )

    best_offer = scored_products[0]

    return {
        "offer": {
            "product_id": best_offer["id"],
            "title": best_offer["title"],
            "url": best_offer["url"],
            "price": best_offer["price"],
            "discount": 10,
            "score": best_offer["score"]
        }
    }