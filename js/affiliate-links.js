/**
 * ReptileCare Affiliate Link Manager
 * Centralizes affiliate link generation and management
 */

// Configuration
const AFFILIATE_CONFIG = {
    amazon: {
        tag: 'reptilecare09-20',
        domain: 'amazon.com'
    }
};

/**
 * Generate Amazon affiliate link with enhanced tracking
 * @param {string} productUrl - The original Amazon product URL
 * @param {string} linkId - Optional custom link ID for tracking
 * @returns {string} - URL with comprehensive affiliate tracking
 */
function generateAmazonAffiliateLink(productUrl, linkId = '454fa634ebf8d246c9461011b8714fc6') {
    if (!productUrl || !productUrl.includes(AFFILIATE_CONFIG.amazon.domain)) {
        return productUrl;
    }
    
    // Enhanced affiliate parameters for better tracking and analytics
    const separator = productUrl.includes('?') ? '&' : '?';
    const enhancedParams = [
        'linkCode=ll1',
        `tag=${AFFILIATE_CONFIG.amazon.tag}`,
        `linkId=${linkId}`,
        'language=en_US',
        'ref_=as_li_ss_tl'
    ].join('&');
    
    return `${productUrl}${separator}${enhancedParams}`;
}

/**
 * Process all Amazon links on a page
 * Automatically converts Amazon links to affiliate links
 */
function convertAmazonLinksToAffiliate() {
    const amazonLinks = document.querySelectorAll('a[href*="amazon.com"]');
    
    amazonLinks.forEach(link => {
        const originalHref = link.getAttribute('href');
        const affiliateHref = generateAmazonAffiliateLink(originalHref);
        
        if (originalHref !== affiliateHref) {
            link.setAttribute('href', affiliateHref);
            
            // Add affiliate indicator (optional)
            if (!link.querySelector('.affiliate-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'affiliate-indicator';
                indicator.style.cssText = 'font-size: 0.8em; color: #666; margin-left: 4px;';
                indicator.textContent = '(affiliate)';
                link.appendChild(indicator);
            }
        }
    });
}

/**
 * Create affiliate-enabled product button
 * @param {Object} options - Button configuration
 * @returns {HTMLElement} - Button element
 */
function createAffiliateButton(options) {
    const {
        url,
        text = 'View Product',
        retailer = 'Amazon',
        style = {}
    } = options;
    
    const button = document.createElement('a');
    button.href = retailer === 'Amazon' ? generateAmazonAffiliateLink(url) : url;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.textContent = text;
    
    // Default styling
    const defaultStyle = {
        display: 'inline-block',
        padding: '8px 16px',
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        transition: 'opacity 0.2s',
        backgroundColor: retailer === 'Amazon' ? '#ff9900' : '#2ecc71',
        color: 'white'
    };
    
    // Apply styles
    Object.assign(button.style, defaultStyle, style);
    
    // Hover effect
    button.addEventListener('mouseenter', () => {
        button.style.opacity = '0.8';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.opacity = '1';
    });
    
    return button;
}

/**
 * Track affiliate clicks (for analytics)
 * @param {string} retailer - Retailer name
 * @param {string} productId - Product identifier
 */
function trackAffiliateClick(retailer, productId) {
    // Send tracking data to analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'affiliate_click', {
            retailer: retailer,
            product_id: productId,
            value: 1
        });
    }
    
    console.log(`Affiliate click tracked: ${retailer} - ${productId}`);
}

/**
 * Initialize affiliate link management
 */
function initAffiliateLinks() {
    // Convert existing Amazon links
    convertAmazonLinksToAffiliate();
    
    // Set up click tracking for affiliate links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="amazon.com"]');
        if (link && link.href.includes('tag=reptilecare09-20')) {
            const url = new URL(link.href);
            const productId = url.pathname.split('/dp/')[1]?.split('/')[0] || 'unknown';
            trackAffiliateClick('Amazon', productId);
        }
    });
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAffiliateLinks);
} else {
    initAffiliateLinks();
}

// Export for use in other scripts
window.AffiliateManager = {
    generateAmazonAffiliateLink,
    convertAmazonLinksToAffiliate,
    createAffiliateButton,
    trackAffiliateClick,
    config: AFFILIATE_CONFIG
}; 