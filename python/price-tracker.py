"""
Price Tracker for Enclosure Products
Fetches current prices from product URLs and stores them in a JSON file.
Run this script daily via cron/scheduled task to keep prices updated.
"""

import json
import re
import requests
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs
import time

# User agent to avoid being blocked
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def extract_amazon_asin(url):
    """Extract Amazon ASIN from URL"""
    # Try to find ASIN in URL
    patterns = [
        r'/dp/([A-Z0-9]{10})',
        r'/product/([A-Z0-9]{10})',
        r'ASIN[=:]([A-Z0-9]{10})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def fetch_amazon_price(asin):
    """
    Fetch price from Amazon using their API or scraping.
    Note: Amazon Product Advertising API requires credentials.
    For now, this is a placeholder that would need API setup.
    """
    # Option 1: Use Amazon Product Advertising API (requires API credentials)
    # You'll need to sign up at: https://affiliate-program.amazon.com/gp/advertising/api/detail/main.html
    # Then use: python-amazon-paapi library
    
    # Option 2: Simple scraping (may violate ToS, use at your own risk)
    # This is a basic example - Amazon actively blocks scrapers
    try:
        url = f"https://www.amazon.com/dp/{asin}"
        response = requests.get(url, headers=HEADERS, timeout=10)
        
        # Look for price in HTML (this is fragile and may break)
        # Improved patterns to capture cents properly
        price_patterns = [
            r'<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.\d{2})',  # $123.45 format
            r'"price":\s*"([\d,]+\.\d{2})"',  # JSON format with cents
            r'data-price="([\d,]+\.\d{2})"',  # Data attribute with cents
            r'\$([\d,]+\.\d{2})',  # Simple $123.45 format
            r'<span[^>]*class="[^"]*a-price[^"]*"[^>]*>.*?<span[^>]*class="[^"]*a-offscreen[^"]*">\$?([\d,]+\.\d{2})',  # Amazon specific
            r'<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)</span>.*?<span[^>]*class="[^"]*a-price-fraction[^"]*"[^>]*>(\d{2})',  # Amazon split price
        ]
        
        for pattern in price_patterns:
            matches = re.finditer(pattern, response.text, re.DOTALL)
            for match in matches:
                try:
                    # Handle Amazon split price format (whole.fraction)
                    if len(match.groups()) == 2:
                        whole = match.group(1).replace(',', '')
                        fraction = match.group(2)
                        price_str = f"{whole}.{fraction}"
                    else:
                        price_str = match.group(1).replace(',', '')
                    
                    price = float(price_str)
                    if 10 <= price <= 10000:  # Reasonable price range
                        return price
                except (ValueError, IndexError):
                    continue
    except Exception as e:
        print(f"Error fetching Amazon price for ASIN {asin}: {e}")
    
    return None

def fetch_generic_price(url):
    """
    Generic price fetcher for non-Amazon sites.
    This is a basic implementation - you may need to customize per site.
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        html = response.text
        
        # Common price patterns - improved to capture cents properly
        price_patterns = [
            r'\$([\d,]+\.\d{2})',  # $123.45 format with cents
            r'price["\']?\s*[:=]\s*["\']?([\d,]+\.\d{2})',  # price: "123.45"
            r'<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.\d{2})',  # HTML price with cents
            r'data-price="([\d,]+\.\d{2})"',  # Data attribute with cents
            r'"price":\s*([\d,]+\.\d{2})',  # JSON price format
            r'\$([\d,]+)(?:\.(\d{1,2}))?',  # Fallback: $123 or $123.4 or $123.45
        ]
        
        prices = []
        for pattern in price_patterns:
            matches = re.finditer(pattern, html, re.IGNORECASE)
            for match in matches:
                try:
                    # Handle patterns with optional decimal part
                    if len(match.groups()) == 2 and match.group(2):
                        whole = match.group(1).replace(',', '')
                        decimal = match.group(2)
                        # Pad decimal to 2 places if needed
                        if len(decimal) == 1:
                            decimal = decimal + '0'
                        price_str = f"{whole}.{decimal}"
                    else:
                        price_str = match.group(1).replace(',', '')
                    
                    price = float(price_str)
                    if 10 <= price <= 10000:  # Reasonable price range
                        prices.append(price)
                except (ValueError, IndexError, AttributeError):
                    continue
        
        if prices:
            # Return the most common price or median
            return sorted(prices)[len(prices) // 2] if prices else None
    except Exception as e:
        print(f"Error fetching price from {url}: {e}")
    
    return None

def fetch_price(url):
    """Determine site type and fetch price accordingly"""
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    
    if 'amazon.com' in domain or 'amzn.to' in domain:
        # Handle Amazon short links
        if 'amzn.to' in domain:
            # Resolve short link first
            try:
                response = requests.head(url, headers=HEADERS, allow_redirects=True, timeout=10)
                url = response.url
            except:
                pass
        
        asin = extract_amazon_asin(url)
        if asin:
            return fetch_amazon_price(asin)
    
    # Generic price fetching for other sites
    return fetch_generic_price(url)

def load_enclosure_data():
    """Load enclosure data from HTML file"""
    # Read the HTML file to extract enclosure data
    # In a real implementation, you might want to extract this to a separate JSON file
    try:
        with open('../enclosure-builder.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract reptileData object (basic extraction)
        # This is a simplified version - you may need to improve this
        import re
        match = re.search(r'const reptileData = ({.*?});', content, re.DOTALL)
        if match:
            # This is a basic approach - for production, use proper JS parsing
            return None  # Would need proper JS parser
    except Exception as e:
        print(f"Error loading enclosure data: {e}")
    
    return None

def update_prices():
    """
    Main function to update prices.
    Reads product URLs and fetches current prices.
    """
    # Load existing price data
    price_file = '../data/product-prices.json'
    try:
        with open(price_file, 'r') as f:
            price_data = json.load(f)
    except FileNotFoundError:
        price_data = {}
    
    # Product URLs to track (you can expand this list)
    products = [
        {
            'id': 'lg-reptizoo-wayfair',
            'url': 'https://www.wayfair.com/pet/pdp/reptizoo-36-x-16-x-18-reptile-terrarium-rptz1194.html',
            'name': 'REPTIZOO 40 Gallon (Wayfair)'
        },
        {
            'id': 'lg-reptizoo-amazon',
            'url': 'https://www.amazon.com/REPTIZOO-Reptile-Terrarium-Ventilation-Knock-Down/dp/B07CV797LC',
            'name': 'REPTIZOO 50 Gallon (Amazon)'
        },
        {
            'id': 'lg-dubia-pvc',
            'url': 'https://dubiaroaches.com/products/36x18x18-pvc-panel-reptile-enclosure',
            'name': 'Dubia.com 50 Gallon PVC'
        },
        {
            'id': 'cg-neptonion',
            'url': 'https://amzn.to/4o8mtc5',
            'name': 'NEPTONION 32 Gallon'
        },
        # Add more products as needed
    ]
    
    updated_count = 0
    failed_count = 0
    current_time = datetime.now(timezone.utc).isoformat()
    
    for product in products:
        product_id = product['id']
        url = product['url']
        
        print(f"Fetching price for {product['name']}...")
        print(f"  URL: {url}")
        try:
            price = fetch_price(url)
        except Exception as e:
            print(f"  ✗ Exception during price fetch: {e}")
            import traceback
            traceback.print_exc()
            price = None
        
        # Initialize product entry if it doesn't exist
        if product_id not in price_data:
            price_data[product_id] = {}
        
        # Always update URL and name (in case they changed)
        price_data[product_id]['url'] = url
        price_data[product_id]['name'] = product['name']
        
        if price:
            # Store price history
            if 'history' not in price_data[product_id]:
                price_data[product_id]['history'] = []
            
            # Only update price if it changed or if this is first time
            old_price = price_data[product_id].get('current')
            if old_price != price:
                price_data[product_id]['current'] = price
                # Add current price to history
                price_data[product_id]['history'].append({
                    'price': price,
                    'date': current_time
                })
                if len(price_data[product_id]['history']) > 30:
                    price_data[product_id]['history'].pop(0)
                print(f"  ✓ Updated: ${price:.2f} (was ${old_price if old_price else 'N/A'})")
            else:
                print(f"  → Price unchanged: ${price:.2f}")
            
            # Always update timestamp to show we checked
            price_data[product_id]['lastUpdated'] = current_time
            updated_count += 1
        else:
            failed_count += 1
            print(f"  ✗ Failed to fetch price")
            # ALWAYS update timestamp to show we attempted (even if fetch failed)
            price_data[product_id]['lastUpdated'] = current_time
        
        # Be respectful - add delay between requests
        time.sleep(2)
    
    # Save updated prices
    with open(price_file, 'w') as f:
        json.dump(price_data, f, indent=2)
    
    print(f"\n✓ Successfully updated {updated_count} prices")
    if failed_count > 0:
        print(f"⚠ Failed to fetch {failed_count} prices")
    return price_data

if __name__ == '__main__':
    print("Starting price tracker...")
    print("=" * 50)
    update_prices()
    print("=" * 50)
    print("Price tracking complete!")

