/**
 * Price Tracker - Fetches and displays live product prices
 * Loads prices from data/product-prices.json which is updated daily by price-tracker.py
 */

class PriceTracker {
    constructor() {
        this.prices = {};
        this.priceMapping = this.createPriceMapping();
    }

    /**
     * Maps enclosure IDs to product price IDs
     * Update this when adding new products
     */
    createPriceMapping() {
        return {
            // Leopard Gecko enclosures
            'lg-reptizoo-wayfair': 'lg-reptizoo-wayfair',
            'lg-reptizoo': 'lg-reptizoo-amazon',
            'lg-dubia-pvc': 'lg-dubia-pvc',
            
            // Bearded Dragon enclosures
            'bd-reptizoo': 'lg-reptizoo-amazon', // Same product
            'bd-dubia-pvc': 'lg-dubia-pvc', // Same product
            
            // Crested Gecko enclosures
            'cg-neptonion-32gal': 'cg-neptonion',
            'cg-reptizoo': 'lg-reptizoo-amazon', // Same product
            
            // Eastern Collared Lizard enclosures
            'ecl-reptizoo': 'lg-reptizoo-amazon', // Same product
            'cg-dubia-pvc': 'lg-dubia-pvc' // Same product
        };
    }

    /**
     * Load prices from JSON file
     */
    async loadPrices() {
        try {
            const response = await fetch('data/product-prices.json');
            if (!response.ok) {
                console.warn('Price data not available, using fallback prices');
                return false;
            }
            this.prices = await response.json();
            return true;
        } catch (error) {
            console.warn('Error loading prices:', error);
            return false;
        }
    }

    /**
     * Get current price for an enclosure
     * @param {string} enclosureId - The enclosure ID
     * @returns {number|null} - Current price or null if not found
     */
    getPrice(enclosureId) {
        const productId = this.priceMapping[enclosureId];
        if (!productId) {
            return null;
        }
        
        const product = this.prices[productId];
        if (!product || !product.current) {
            return null;
        }
        
        return product.current;
    }

    /**
     * Get price info including last updated time
     * @param {string} enclosureId - The enclosure ID
     * @returns {object|null} - Price info object or null
     */
    getPriceInfo(enclosureId) {
        const productId = this.priceMapping[enclosureId];
        if (!productId) {
            return null;
        }
        
        const product = this.prices[productId];
        if (!product) {
            return null;
        }
        
        return {
            price: product.current,
            lastUpdated: product.lastUpdated,
            url: product.url,
            name: product.name
        };
    }

    /**
     * Format price with currency symbol
     * @param {number} price - Price value
     * @returns {string} - Formatted price string
     */
    formatPrice(price) {
        if (price === null || price === undefined) {
            return 'Price unavailable';
        }
        return `$${price.toFixed(2)}`;
    }

    /**
     * Check if price was updated recently (within last 24 hours)
     * @param {string} lastUpdated - ISO date string
     * @returns {boolean}
     */
    isPriceRecent(lastUpdated) {
        if (!lastUpdated) return false;
        const updated = new Date(lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now - updated) / (1000 * 60 * 60);
        return hoursSinceUpdate < 24;
    }

    /**
     * Format date for display in EST timezone
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date string in EST
     */
    formatDate(dateString) {
        if (!dateString) return 'unknown';
        
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/New_York',
            timeZoneName: 'short'
        };
        return date.toLocaleString('en-US', options);
    }

    /**
     * Update price display for an enclosure card
     * @param {HTMLElement} enclosureCard - The enclosure card element
     * @param {string} enclosureId - The enclosure ID
     */
    updateEnclosurePrice(enclosureCard, enclosureId) {
        const priceInfo = this.getPriceInfo(enclosureId);
        const priceElement = enclosureCard.querySelector('.enclosure-price');
        
        if (!priceElement) return;
        
        // Remove existing price-updated element if it exists
        const existingUpdated = enclosureCard.querySelector('.price-updated');
        if (existingUpdated) {
            existingUpdated.remove();
        }
        
        if (priceInfo && priceInfo.price !== null) {
            const formattedPrice = this.formatPrice(priceInfo.price);
            
            // Update price text (ensure cents are shown)
            priceElement.textContent = formattedPrice;
            
            // Never add price-live class (keep it grey)
            priceElement.classList.remove('price-live');
            
            // Add "Price Last Updated" text below the price
            const updatedElement = document.createElement('p');
            updatedElement.className = 'price-updated';
            updatedElement.textContent = `Price Last Updated ${this.formatDate(priceInfo.lastUpdated)}`;
            
            // Insert after the price element
            priceElement.parentNode.insertBefore(updatedElement, priceElement.nextSibling);
        } else {
            // Keep original price if live price unavailable
            priceElement.classList.remove('price-live');
        }
    }

    /**
     * Get human-readable time ago string
     * @param {string} dateString - ISO date string
     * @returns {string}
     */
    getTimeAgo(dateString) {
        if (!dateString) return 'unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }

    /**
     * Initialize price tracking
     * Call this after enclosures are rendered
     */
    async init() {
        await this.loadPrices();
        this.updateAllPrices();
    }

    /**
     * Update prices for all visible enclosure cards
     */
    updateAllPrices() {
        document.querySelectorAll('.enclosure-option[data-enclosure-id]').forEach(card => {
            const enclosureId = card.dataset.enclosureId;
            if (enclosureId) {
                this.updateEnclosurePrice(card, enclosureId);
            }
        });
    }
}

// Create global instance
window.priceTracker = new PriceTracker();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.priceTracker.init();
    });
} else {
    window.priceTracker.init();
}

