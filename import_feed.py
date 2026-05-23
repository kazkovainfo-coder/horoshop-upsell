import requests
import json
import xml.etree.ElementTree as ET

FEED_URL = "https://kazkova.in.ua/marketplace-integration/google-feed/b573742161465e3a2deba881f9129298?langId=3"

response = requests.get(FEED_URL)

xml_content = response.content

root = ET.fromstring(xml_content)

namespace = {
    "g": "http://base.google.com/ns/1.0"
}

# =====================================================
# DETECT TYPE
# =====================================================

def detect_type(title):

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

products = []

for item in root.findall(".//item"):

    title = item.find("g:title", namespace)
    link = item.find("g:link", namespace)
    price = item.find("g:price", namespace)
    product_id = item.find("g:id", namespace)
    availability = item.find("g:availability", namespace)
    image = item.find("g:image_link", namespace)

    if title is None:
        continue

    title_text = title.text

    products.append({
        "id": product_id.text if product_id is not None else "",
        "title": title_text,
        "type": detect_type(title_text),
        "color": detect_color(title_text),
        "url": link.text if link is not None else "",
        "image": image.text if image is not None else "",
        "price": price.text if price is not None else "",
        "stock": availability.text == "in stock" if availability is not None else True,
        "priority": 5
    })

with open("products.json", "w", encoding="utf-8") as file:
    json.dump(products, file, ensure_ascii=False, indent=2)

print(f"Імпортовано товарів: {len(products)}")
print("products.json оновлено")
