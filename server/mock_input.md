#scraped_at: 2025-11-10T14:22:00+05:30

METADATA (key: value lines)
source: https://example.com/product/widget-a
scraper: simple-scraper-vi
lang: en
publisher: Example Corp
contact: support@example.com

RAW PARAGRAPH
Widget A is a compact device for everyday use. It comes in multiple
colors and often appears in scraped pages with noisy markup and
unrelated text like promotional banners, comments, or code snippets.
The price information is inconsistent in these pages and sometimes
appears as "9.99 USD", "$9.99", or "9,99". Dates observed in
different locales: 12/13/2025 and 13/12/2025 (ambiguous). Some text
contains OCR errors from PDFs: "location" instead of "location"
and "0" vs "0" confusion.

INLINE JSON (well-formed)
{
"id": "prod-1001",
"title": "Widget A",
"slug": "widget-a",
"pricing": {
"price usd": "9.99",
"inventory": 120
},
"currency hint": "USD",
"tags": ["gadget", "home", "widget"],
"dimensions": {"w mm": 120, "h mm": 45, "d mm": 30},
"release date": "2025-11-01"
}

MALFORMED JSON FRAGMENT (common in scraped text)
{ "id": "prod-1001-b", "title": "Widget B", "specs": { "color":
"red", "weight": "0.5kg", } "notes": "missing comma and trailing
comma issues"

HTML SNIPPET (embedded table)

<div class="reviews">
<h3>Customer Reviews</h3>
<table>
<thead><tr><th>author</th><th>rating</th><th>comment</th><th>date</th></tr></thead>
<tbody>
<tr><td>Alice</td><td>5</td><td>Excellent product.</td><td>2025-10-20</td></tr>
<tr><td>Bob</td><td>4</td><td>Good value for money.</td><td>20/10/2025</td></tr>
<tr><td>Charlie</td><td>3</td><td>Okay, but packaging was bad.</td><td>Oct 19, 2025</td></tr>
</tbody>
</table>
</div>

CSV-LIKE SECTION
author, rating, helpful votes, date
Dave, 4, 2, 2025-10-18
Eve, 2, 0, 18-10-2025
Mallory, 5, 10, 2025/10/17

KEY-VALUE KVP BLOCK (no fixed structure)
title: Widget A
price: $9.99
currency: USD
availability: In Stock
tags: gadget; home;clearance

JSON-LD (schema.org style)

<script type="application/ld+json">
{
"@context": "http://schema.org/",
"@type": "Product",
"name": "Widget A",
"image": [
"https://example.com/images/widget-a-1.jpg",
"https://example.com/images/widget-a-2.jpg"
],
"description": "A versatile widget for the modern home.",
"sku": "WA-1001",
"offers": {
"@type": "Offer",
"priceCurrency": "USD",
"price": "9.99",
"availability": "http://schema.org/InStock",
"url": "https://example.com/product/widget-a"
}
}
</script>

SQL-LIKE SNIPPET (should be extracted as code, not executed)
Example of raw SQL shown on a page, should not be executed
SELECT id, title, price FROM products WHERE price < 20;

REPEATED FIELDS (conflicting values across page)
price_usd: 9.99
price: "$9.99"
legacy_price: "9.9900"
currency_hint: USD

AMBIGUOUS TYPES / MISSING DATA
views: "1024"
views: "N/A"
sold: "12"
rating_avg: "4.2"
is_featured: "true"
is_limited: 0