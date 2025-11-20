# Price Tracker Setup Guide

This guide explains how to set up automatic price tracking for enclosure products, updating prices daily from product URLs.

## Overview

The price tracker system consists of:
1. **Python script** (`python/price-tracker.py`) - Fetches prices from product URLs
2. **JSON data file** (`data/product-prices.json`) - Stores current prices and history
3. **JavaScript module** (`js/price-tracker.js`) - Displays live prices on the website
4. **Scheduled task** - Runs the Python script daily

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python
pip install -r requirements-price-tracker.txt
```

### 2. Configure Product URLs

Edit `python/price-tracker.py` and update the `products` list with all product URLs you want to track:

```python
products = [
    {
        'id': 'lg-reptizoo-wayfair',
        'url': 'https://www.wayfair.com/pet/pdp/reptizoo-36-x-16-x-18-reptile-terrarium-rptz1194.html',
        'name': 'REPTIZOO 40 Gallon (Wayfair)'
    },
    # Add more products...
]
```

### 3. Update Price Mapping

Edit `js/price-tracker.js` and update the `createPriceMapping()` function to map enclosure IDs to product price IDs:

```javascript
createPriceMapping() {
    return {
        'lg-reptizoo-wayfair': 'lg-reptizoo-wayfair',
        'lg-reptizoo': 'lg-reptizoo-amazon',
        // Add more mappings...
    };
}
```

### 4. Test the Script

Run the price tracker manually to test:

```bash
cd python
python price-tracker.py
```

This will:
- Fetch prices from all product URLs
- Save them to `data/product-prices.json`
- Display results in the console

### 5. Set Up Daily Automation

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "Daily" at your preferred time
4. Action: Start a program
5. Program: `python` (or full path to Python executable)
6. Arguments: `C:\path\to\python\price-tracker.py`
7. Start in: `C:\path\to\python`

#### Linux/Mac (Cron)

Add to crontab (`crontab -e`):

```bash
# Run price tracker daily at 2 AM
0 2 * * * cd /path/to/reptilecare/python && /usr/bin/python3 price-tracker.py
```

#### Alternative: GitHub Actions (for hosted sites)

If your site is hosted on GitHub Pages or similar, you can use GitHub Actions:

Create `.github/workflows/price-tracker.yml`:

```yaml
name: Update Prices
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-prices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd python
          pip install -r requirements-price-tracker.txt
      - name: Run price tracker
        run: |
          cd python
          python price-tracker.py
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/product-prices.json
          git diff --staged --quiet || git commit -m "Update product prices [skip ci]"
          git push
```

## How It Works

### Price Fetching

The script uses different methods depending on the site:

1. **Amazon**: Extracts ASIN and attempts to fetch price (may require API credentials for reliable results)
2. **Other sites**: Uses generic HTML scraping to find price patterns

### Price Storage

Prices are stored in `data/product-prices.json` with:
- Current price
- Last updated timestamp
- Price history (last 30 days)
- Product URL and name

### Display on Website

The JavaScript automatically:
- Loads prices from the JSON file
- Updates price displays on enclosure cards
- Shows a green indicator (●) for recently updated prices
- Falls back to original prices if live prices unavailable

## Limitations & Considerations

### Legal & Ethical

- **Respect robots.txt**: Some sites may prohibit scraping
- **Rate limiting**: Script includes delays between requests
- **Terms of Service**: Review each site's ToS before scraping
- **Amazon**: Consider using official Product Advertising API for reliable results

### Reliability

- **Website changes**: Scraping may break if sites change HTML structure
- **CAPTCHAs**: Some sites may block automated requests
- **API alternatives**: Consider using official APIs when available:
  - Amazon Product Advertising API
  - Wayfair API (if available)
  - Other retailer APIs

### Recommended Improvements

1. **Use official APIs** when available (more reliable)
2. **Add error handling** for failed requests
3. **Implement retry logic** for transient failures
4. **Add email alerts** for price drops
5. **Track price trends** and show price history charts

## Troubleshooting

### Prices not updating

1. Check if script runs successfully: `python price-tracker.py`
2. Verify JSON file is updated: Check `data/product-prices.json`
3. Check browser console for JavaScript errors
4. Verify product URLs are still valid

### Prices showing as "unavailable"

1. Check if product URLs are correct
2. Verify website structure hasn't changed
3. Check if site is blocking requests (check response status)
4. Consider using official APIs instead

### Scheduled task not running

1. Verify task is enabled in Task Scheduler/Cron
2. Check task logs for errors
3. Verify Python path is correct
4. Test script manually first

## Support

For issues or questions:
1. Check script output/logs
2. Verify product URLs are accessible
3. Test price fetching manually
4. Consider using official APIs for better reliability

