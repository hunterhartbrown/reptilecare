from playwright.sync_api import sync_playwright
import re, json

species_urls = {
    "leopard_gecko": "https://www.morphmarket.com/us/c/reptiles/lizards/leopard-geckos?state=for_sale",
    "crested_gecko": "https://www.morphmarket.com/us/c/reptiles/lizards/crested-geckos?state=for_sale",
    "bearded_dragon": "https://www.morphmarket.com/us/c/reptiles/lizards/bearded-dragons?state=for_sale",
    "collared_lizard": "https://www.morphmarket.com/us/c/reptiles/lizards/collared-lizards?state=for_sale"
}

def get_listing_count(url, page):
    print("Fetching:", url)
    page.goto(url)
    page.wait_for_timeout(7000)  # Give extra time for JS to load

    # Try exact selector found in browser dev tools:
    selector = "#mainApp > div:nth-child(3) > div > div > div.container--_dmBk.mobile--RisAv.mobileLarge--tRtgo.tablet--d7O9X > div > div.container--NarxF > span:nth-child(1)"
    try:
        el = page.query_selector(selector)
        if el:
            text = el.inner_text()
            print("Found text at selector:", text)
            match = re.search(r'of\s*([\d,]+)', text)
            if match:
                return int(match.group(1).replace(',', ''))
            else:
                print("Regex didn't match in text:", text)
        else:
            print("No element found at selector.")
    except Exception as e:
        print("Error accessing selector:", e)
    return None

availability = {}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    for name, url in species_urls.items():
        print(f"Scraping {name}...")
        count = get_listing_count(url, page)
        availability[name] = count
    browser.close()

with open('availability.json', 'w') as f:
    json.dump(availability, f)

print("Availability:", availability)
