from playwright.sync_api import sync_playwright
import re, json

print("Script started")

species_urls = {
    "leopard_gecko": "https://www.morphmarket.com/us/c/reptiles/lizards/leopard-geckos?state=for_sale",
    "crested_gecko": "https://www.morphmarket.com/us/c/reptiles/lizards/crested-geckos?state=for_sale",
    "bearded_dragon": "https://www.morphmarket.com/us/c/reptiles/lizards/bearded-dragons?state=for_sale",
    "collared_lizard": "https://www.morphmarket.com/us/c/reptiles/lizards/collared-lizards?state=for_sale"
}

def get_listing_count(url, page):
    print(f"Fetching URL: {url}")
    page.goto(url)
    print("Page loaded")
    page.wait_for_timeout(3000)
    print("Waited for timeout")
    text = page.content()
    print("Got page content")
    match = re.search(r'of ([\d,]+) results', text)
    print(f"Match: {match}")
    return int(match.group(1).replace(',', '')) if match else None

availability = {}
print("Starting Playwright")
with sync_playwright() as p:
    print("Launching browser")
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    for name, url in species_urls.items():
        print(f"Scraping {name}")
        count = get_listing_count(url, page)
        print(f"Got count for {name}: {count}")
        availability[name] = count
    browser.close()
    print("Browser closed")

print("Writing JSON file")
with open('availability.json', 'w') as f:
    json.dump(availability, f)

print("Availability:", availability)
print("Script done")
