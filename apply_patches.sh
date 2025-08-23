#!/bin/bash

set -e  # Exit on any error

echo "🦎 Applying ReptileCare.net Dark Mode Patches..."

# Check if we're in the right directory
if [[ ! -f "styles.css" ]] || [[ ! -d "js" ]]; then
    echo "❌ Error: Run this script from the root of the reptilecare repository"
    echo "   Expected files: styles.css, js/ directory"
    exit 1
fi

# Backup original files
echo "📦 Creating backups..."
cp styles.css styles.css.backup.$(date +%Y%m%d_%H%M%S)

# Create js/theme.js
echo "🎨 Creating theme management system..."
cat > js/theme.js << 'EOF'
/**
 * Theme Management System for ReptileCare.net
 * Handles light/dark/system theme preferences with FOUC prevention
 */

(function() {
    'use strict';

    // Theme constants
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
    };

    const STORAGE_KEY = 'reptilecare-theme';
    
    // DOM elements (will be populated after DOM loads)
    let elements = {
        button: null,
        dropdown: null,
        radios: null
    };

    // System preference tracking
    let systemMediaQuery = null;
    let currentTheme = THEMES.SYSTEM;

    /**
     * Initialize theme system
     */
    function init() {
        // Set up system preference listener
        if (window.matchMedia) {
            systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            systemMediaQuery.addEventListener('change', handleSystemChange);
        }

        // Load saved theme preference
        loadTheme();
        
        // Apply initial theme
        applyTheme();
        
        // Set up UI when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupUI);
        } else {
            setupUI();
        }
    }

    /**
     * Load theme from localStorage or default to system
     */
    function loadTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && Object.values(THEMES).includes(saved)) {
                currentTheme = saved;
            } else {
                currentTheme = THEMES.SYSTEM;
            }
        } catch (e) {
            console.warn('Failed to load theme preference:', e);
            currentTheme = THEMES.SYSTEM;
        }
    }

    /**
     * Save theme to localStorage
     */
    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    }

    /**
     * Apply theme to document
     */
    function applyTheme() {
        const root = document.documentElement;
        
        if (currentTheme === THEMES.SYSTEM) {
            // Remove explicit theme, let CSS prefers-color-scheme take over
            root.removeAttribute('data-theme');
        } else {
            // Set explicit theme
            root.setAttribute('data-theme', currentTheme);
        }
    }

    /**
     * Handle system preference change
     */
    function handleSystemChange() {
        if (currentTheme === THEMES.SYSTEM) {
            // Re-apply system theme to trigger any CSS updates
            applyTheme();
        }
    }

    /**
     * Set up UI elements and event handlers
     */
    function setupUI() {
        // Find theme settings elements
        elements.button = document.querySelector('.theme-settings-btn');
        elements.dropdown = document.querySelector('.theme-dropdown');
        elements.radios = document.querySelectorAll('.theme-option input[type="radio"]');

        if (!elements.button || !elements.dropdown || !elements.radios.length) {
            console.warn('Theme UI elements not found');
            return;
        }

        // Set initial radio state
        updateRadioSelection();

        // Button click handler
        elements.button.addEventListener('click', toggleDropdown);

        // Radio change handlers
        elements.radios.forEach(radio => {
            radio.addEventListener('change', handleThemeChange);
        });

        // Close dropdown on outside click
        document.addEventListener('click', handleOutsideClick);

        // Keyboard handlers
        document.addEventListener('keydown', handleKeydown);
        elements.dropdown.addEventListener('keydown', handleDropdownKeydown);
    }

    /**
     * Toggle dropdown visibility
     */
    function toggleDropdown(event) {
        event.preventDefault();
        event.stopPropagation();

        const isOpen = elements.dropdown.classList.contains('show');
        
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    /**
     * Open dropdown
     */
    function openDropdown() {
        elements.dropdown.classList.add('show');
        elements.button.setAttribute('aria-expanded', 'true');

        // Focus first radio button
        const firstRadio = elements.radios[0];
        if (firstRadio) {
            firstRadio.focus();
        }
    }

    /**
     * Close dropdown
     */
    function closeDropdown() {
        elements.dropdown.classList.remove('show');
        elements.button.setAttribute('aria-expanded', 'false');
        elements.button.focus();
    }

    /**
     * Handle theme selection change
     */
    function handleThemeChange(event) {
        const newTheme = event.target.value;
        
        if (Object.values(THEMES).includes(newTheme)) {
            currentTheme = newTheme;
            saveTheme(newTheme);
            applyTheme();
            
            // Close dropdown after selection
            setTimeout(() => {
                closeDropdown();
            }, 150);
        }
    }

    /**
     * Update radio button selection
     */
    function updateRadioSelection() {
        elements.radios.forEach(radio => {
            radio.checked = radio.value === currentTheme;
        });
    }

    /**
     * Handle clicks outside dropdown
     */
    function handleOutsideClick(event) {
        if (!elements.dropdown.classList.contains('show')) {
            return;
        }

        const isClickInside = elements.dropdown.contains(event.target) || 
                             elements.button.contains(event.target);
        
        if (!isClickInside) {
            closeDropdown();
        }
    }

    /**
     * Handle global keyboard events
     */
    function handleKeydown(event) {
        // Escape key closes dropdown
        if (event.key === 'Escape' && elements.dropdown.classList.contains('show')) {
            event.preventDefault();
            closeDropdown();
        }
    }

    /**
     * Handle keyboard navigation within dropdown
     */
    function handleDropdownKeydown(event) {
        if (!elements.dropdown.classList.contains('show')) {
            return;
        }

        const radioArray = Array.from(elements.radios);
        const currentIndex = radioArray.findIndex(radio => radio === document.activeElement);

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                const nextIndex = (currentIndex + 1) % radioArray.length;
                radioArray[nextIndex].focus();
                break;

            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                const prevIndex = currentIndex <= 0 ? radioArray.length - 1 : currentIndex - 1;
                radioArray[prevIndex].focus();
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                if (document.activeElement && document.activeElement.type === 'radio') {
                    document.activeElement.checked = true;
                    document.activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
                break;

            case 'Tab':
                // Allow tab to move through radio buttons, but close on tab out
                const isShiftTab = event.shiftKey;
                const firstRadio = radioArray[0];
                const lastRadio = radioArray[radioArray.length - 1];
                
                if (isShiftTab && document.activeElement === firstRadio) {
                    event.preventDefault();
                    closeDropdown();
                } else if (!isShiftTab && document.activeElement === lastRadio) {
                    event.preventDefault();
                    closeDropdown();
                }
                break;
        }
    }

    /**
     * Get current effective theme (resolves 'system' to actual theme)
     */
    function getEffectiveTheme() {
        if (currentTheme === THEMES.SYSTEM) {
            return systemMediaQuery && systemMediaQuery.matches ? THEMES.DARK : THEMES.LIGHT;
        }
        return currentTheme;
    }

    /**
     * Public API
     */
    window.ReptileCareTheme = {
        getCurrentTheme: () => currentTheme,
        getEffectiveTheme: getEffectiveTheme,
        setTheme: (theme) => {
            if (Object.values(THEMES).includes(theme)) {
                currentTheme = theme;
                saveTheme(theme);
                applyTheme();
                if (elements.radios) {
                    updateRadioSelection();
                }
            }
        },
        THEMES: THEMES
    };

    // Initialize when script loads
    init();

})();

/**
 * FOUC Prevention Script
 * This should be inlined in the <head> of each page before any stylesheets
 */
window.ReptileCareThemeFOUC = (function() {
    'use strict';
    
    // Get stored theme preference
    let theme;
    try {
        theme = localStorage.getItem('reptilecare-theme');
    } catch (e) {
        theme = null;
    }
    
    // Apply theme immediately if not 'system' or null
    if (theme && theme !== 'system') {
        document.documentElement.setAttribute('data-theme', theme);
    }
    // If theme is 'system' or null, let CSS prefers-color-scheme handle it
    
    return {
        getStoredTheme: () => theme
    };
})();
EOF

echo "✅ Theme JavaScript created successfully"

# Update styles.css with color tokens
echo "🎨 Updating styles.css with dark mode support..."
cat > styles.css << 'EOF'
/* ── COLOR TOKENS ── */
:root {
  /* Light theme (default) */
  --bg: #ffffff;
  --bg-elev: #f8f8f8;
  --bg-section: #fafafa;
  --text: #0f0f0f;
  --text-muted: #666;
  --text-light: #999;
  --border: #ddd;
  --border-light: #e5e5e5;
  --border-medium: #bbb;
  --shadow: rgba(0, 0, 0, 0.1);
  --shadow-hover: rgba(0, 0, 0, 0.15);
  
  /* Interactive elements */
  --link: #0f0f0f;
  --link-hover: #333;
  --link-accent: #005f6b;
  
  /* Buttons */
  --btn-primary-bg: #0f0f0f;
  --btn-primary-text: #ffffff;
  --btn-primary-hover: #333;
  --btn-secondary-bg: transparent;
  --btn-secondary-text: #0f0f0f;
  --btn-secondary-border: #0f0f0f;
  
  /* Status colors (preserve for rarity) */
  --status-success-bg: #d4edda;
  --status-success-text: #155724;
  --status-success-border: #c3e6cb;
  --status-error-bg: #f8d7da;
  --status-error-text: #721c24;
  --status-error-border: #f5c6cb;
  
  /* Rarity colors (unchanged) */
  --rarity-common: #444;
  --rarity-uncommon: #e67e00;
  --rarity-rare: #d63384;
  
  /* Navigation dots */
  --dot-inactive: #ccc;
  --dot-hover: #999;
  --dot-active: var(--text);
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --bg-elev: #2d2d2d;
    --bg-section: #242424;
    --text: #ffffff;
    --text-muted: #b3b3b3;
    --text-light: #808080;
    --border: #404040;
    --border-light: #333333;
    --border-medium: #555555;
    --shadow: rgba(0, 0, 0, 0.3);
    --shadow-hover: rgba(0, 0, 0, 0.4);
    
    --link: #ffffff;
    --link-hover: #e0e0e0;
    --link-accent: #4a9eff;
    
    --btn-primary-bg: #ffffff;
    --btn-primary-text: #1a1a1a;
    --btn-primary-hover: #e0e0e0;
    --btn-secondary-bg: transparent;
    --btn-secondary-text: #ffffff;
    --btn-secondary-border: #ffffff;
    
    /* Status colors adjusted for dark theme */
    --status-success-bg: #1e4d30;
    --status-success-text: #7dd87f;
    --status-success-border: #2d6a3e;
    --status-error-bg: #4d1e1e;
    --status-error-text: #ff9999;
    --status-error-border: #6a2d2d;
    
    --dot-inactive: #666;
    --dot-hover: #999;
  }
}

/* Explicit theme overrides */
:root[data-theme="light"] {
  --bg: #ffffff;
  --bg-elev: #f8f8f8;
  --bg-section: #fafafa;
  --text: #0f0f0f;
  --text-muted: #666;
  --text-light: #999;
  --border: #ddd;
  --border-light: #e5e5e5;
  --border-medium: #bbb;
  --shadow: rgba(0, 0, 0, 0.1);
  --shadow-hover: rgba(0, 0, 0, 0.15);
  
  --link: #0f0f0f;
  --link-hover: #333;
  --link-accent: #005f6b;
  
  --btn-primary-bg: #0f0f0f;
  --btn-primary-text: #ffffff;
  --btn-primary-hover: #333;
  --btn-secondary-bg: transparent;
  --btn-secondary-text: #0f0f0f;
  --btn-secondary-border: #0f0f0f;
  
  --status-success-bg: #d4edda;
  --status-success-text: #155724;
  --status-success-border: #c3e6cb;
  --status-error-bg: #f8d7da;
  --status-error-text: #721c24;
  --status-error-border: #f5c6cb;
  
  --dot-inactive: #ccc;
  --dot-hover: #999;
}

:root[data-theme="dark"] {
  --bg: #1a1a1a;
  --bg-elev: #2d2d2d;
  --bg-section: #242424;
  --text: #ffffff;
  --text-muted: #b3b3b3;
  --text-light: #808080;
  --border: #404040;
  --border-light: #333333;
  --border-medium: #555555;
  --shadow: rgba(0, 0, 0, 0.3);
  --shadow-hover: rgba(0, 0, 0, 0.4);
  
  --link: #ffffff;
  --link-hover: #e0e0e0;
  --link-accent: #4a9eff;
  
  --btn-primary-bg: #ffffff;
  --btn-primary-text: #1a1a1a;
  --btn-primary-hover: #e0e0e0;
  --btn-secondary-bg: transparent;
  --btn-secondary-text: #ffffff;
  --btn-secondary-border: #ffffff;
  
  --status-success-bg: #1e4d30;
  --status-success-text: #7dd87f;
  --status-success-border: #2d6a3e;
  --status-error-bg: #4d1e1e;
  --status-error-text: #ff9999;
  --status-error-border: #6a2d2d;
  
  --dot-inactive: #666;
  --dot-hover: #999;
}

/* ── Import Open Sans from Google Fonts ── */
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700&display=swap');

/* Existing styles with Open Sans as the primary font */
body {
    font-family: 'Open Sans', sans-serif;
    margin: 0;
    padding: 0;
    background-color: var(--bg);
    color: var(--text);
    /* Responsive padding will be handled by media queries */
    padding-top: 80px; /* Default for desktop */
    overflow-x: hidden; /* Prevent horizontal scroll */
}

header {
    background-color: var(--bg);
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 2px 4px var(--shadow);
    position: fixed;
    top: 0;
    z-index: 1000;
}

header img.logo {
    height: 65px;
    transform-origin: bottom right;
}

nav {
    flex: 1;
    display: flex;
    justify-content: center;
}

.nav-links {
    list-style: none;
    display: flex;
    gap: 20px;
    margin: 0;
    padding: 0;
}

.nav-links li {
    position: relative;
}

.nav-links a {
    text-decoration: none;
    color: var(--text);
    font-weight: 700; /* bold */
    padding: 10px;
}

.nav-links a:hover {
    background-color: var(--bg);
    border-radius: 5px;
}

.auth-buttons {
    display: flex;
    gap: 10px;
    margin-right: 30px;
}

.auth-buttons button {
    background-color: var(--btn-secondary-bg);
    border: 1px solid var(--btn-secondary-border);
    color: var(--btn-secondary-text);
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
    font-weight: 400; /* regular */
}

.auth-buttons .signup {
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}

.auth-buttons button:hover {
    opacity: 0.8;
}

section {
    padding: 20px 0 1em 0; /* Reduced default padding */
    width: 100%;
    background-color: var(--text);
}

.content-slider {
    width: 100%;
    max-width: none;
    margin: 0;
    position: relative;
    overflow: hidden;
}

/* ── dot navigator ── */
.dots-container {
    display: flex;
    justify-content: center;
    margin: 1rem 0; /* space above/below the dots */
}

.dots-container .dot {
    width: 10px;
    height: 10px;
    margin: 0 6px;
    border-radius: 50%;
    background-color: var(--dot-inactive);
    cursor: pointer;
    transition: background-color .3s;
}

.dots-container .dot:hover {
    background-color: var(--dot-hover);
}

.dots-container .dot.active {
    background-color: var(--dot-active);
}

.slide {
    display: flex;
    flex-direction: row; /* Arrange items in a row */
    justify-content: space-between;
    align-items: center;
    position: relative;
    width: 100%;
    height: calc(50vh - 40px); /* Reduced to half viewport height */
    box-shadow: 0 4px 8px var(--shadow);
    overflow: hidden;
}

.slide-image {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: var(--text); /* Match the background color */
}

.slide-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain; /* Ensure the image fits within the container without being cut off */
    display: block;
}

.slide-image img.problematic-image {
    height: 100%; /* Ensure the height fills the container */
    width: auto; /* Allow the width to adjust automatically */
    object-fit: cover; /* Ensure the problematic image covers the container */
    object-position: left; /* Align the image to the left */
    position: absolute;
    left: 0;
}

.overlay-text {
    flex: 1;
    padding: 20px;
    color: white;
    text-align: left; /* Align text to the left */
    word-wrap: break-word;
    overflow-wrap: break-word;
    box-sizing: border-box;
    font-weight: 300; /* light for overlay text */
}

.overlay-text h3.common-name {
    margin: 0;
    font-size: 2vw;
    font-weight: 700; /* bold */
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.overlay-text h4.species-name {
    margin: 0;
    font-size: 1.5vw;
    font-style: italic;
    font-weight: 300; /* light italic */
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

/* New styles for care guides section */
.care-guides {
    padding: 20px;
    background-color: var(--bg);
}

.care-guide-container {
    display: flex;
    justify-content: center; /* Align items to the center */
    flex-wrap: wrap;
    gap: 2%;
    max-width: 1200px;
    margin: 0 auto;
}

.care-guide {
    width: 21%; /* Reduced width to make them smaller */
    background-color: var(--bg);
    text-align: center;
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 5px;
    box-sizing: border-box;
}

.care-guide img {
    width: 100%;
    height: auto;
}

.care-guide p {
    margin-top: 10px;
    font-weight: 700; /* bold */
    color: var(--text);
}

/* ────────────── SEARCH BAR STYLES ────────────── */
.site-search {
    display: flex;
    align-items: center;
    margin-left: 20px;
    margin-right: 20px;
}

.search-input {
    padding: 7px 12px;
    border: 1px solid var(--border-medium);
    border-radius: 5px 0 0 5px;
    font-size: 1em;
    outline: none;
    width: 220px;
    transition: border-color 0.2s;
    background-color: var(--bg-elev);
    color: var(--text);
}

.search-input:focus {
    border-color: var(--link-accent);
}

.search-btn {
    padding: 7px 13px;
    border: 1px solid var(--border-medium);
    border-left: none;
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
    border-radius: 0 5px 5px 0;
    cursor: pointer;
    font-size: 1.1em;
    transition: background 0.2s, color 0.2s;
}

.search-btn:hover, .search-btn:focus {
    background: var(--link-accent);
    color: var(--btn-primary-text);
}

/* ────────────── RESPONSIVE STYLES ────────────── */

/* Large desktop - maintain full layout */
@media (min-width: 1200px) {
    section {
        padding: 30px 0 1em 0;
    }
    
    .slide {
        height: calc(50vh - 40px);
    }
}

/* Medium desktop - condensed but still desktop layout */
@media (max-width: 1199px) and (min-width: 1025px) {
    .care-guide {
        width: 30%;
    }
    
    section {
        padding: 25px 0 1em 0;
    }
    
    .slide {
        height: calc(50vh - 40px);
    }
}

/* Switch to mobile layout to prevent overlapping */
@media (max-width: 1024px) {
    body {
        padding-top: 80px; /* Keep default header height initially */
    }
    
    section {
        padding: 10px 0 1em 0;
    }
    
    .slide {
        flex-direction: column;
        height: auto;
        min-height: calc(50vh - 40px);
    }
    
    .slide-image {
        width: 100%;
        height: 50vh;
        min-height: 300px;
    }
    
    .overlay-text {
        width: 100%;
        padding: 30px 20px;
        text-align: center;
    }
    
    .overlay-text h3.common-name {
        font-size: 6vw;
        margin-bottom: 10px;
    }
    
    .overlay-text h4.species-name {
        font-size: 4.5vw;
    }
    
    .care-guides {
        padding: 15px;
    }
    
    .care-guide-container {
        gap: 3%;
    }
    
    .care-guide {
        width: 48%;
        margin-bottom: 15px;
    }
    
    .dots-container {
        margin: 1.5rem 0;
    }
    
    .dots-container .dot {
        width: 12px;
        height: 12px;
        margin: 0 8px;
    }
}

/* Tablets - smaller header height */
@media (max-width: 768px) {
    body {
        padding-top: 70px;
    }
    
    .slide {
        min-height: calc(50vh - 35px);
    }
    
    .slide-image {
        height: 45vh;
        min-height: 280px;
    }
}

/* Mobile devices */
@media (max-width: 480px) {
    body {
        padding-top: 60px;
    }
    
    section {
        padding: 5px 0 1em 0;
    }
    
    .slide {
        min-height: calc(50vh - 30px);
    }
    
    .slide-image {
        height: 40vh;
        min-height: 250px;
    }
    
    .overlay-text {
        padding: 20px 15px;
    }
    
    .overlay-text h3.common-name {
        font-size: 8vw;
        margin-bottom: 8px;
    }
    
    .overlay-text h4.species-name {
        font-size: 6vw;
    }
    
    .care-guides {
        padding: 10px;
    }
    
    .care-guide {
        width: 100%;
        margin-bottom: 10px;
        padding: 8px;
    }
    
    .care-guide img {
        max-height: 200px;
        object-fit: cover;
    }
    
    .care-guide p {
        font-size: 0.9rem;
        margin-top: 8px;
    }
    
    .dots-container {
        margin: 1rem 0;
    }
    
    footer {
        margin-left: 10px !important;
        font-size: 0.9rem;
        padding: 10px 0;
    }
}

/* Very small mobile devices */
@media (max-width: 360px) {
    .slide-image {
        height: 35vh;
        min-height: 200px;
    }
    
    .overlay-text {
        padding: 15px 10px;
    }
    
    .overlay-text h3.common-name {
        font-size: 10vw;
    }
    
    .overlay-text h4.species-name {
        font-size: 7vw;
    }
    
    .care-guides {
        padding: 8px;
    }
    
    .care-guide {
        padding: 6px;
    }
    
    .care-guide img {
        max-height: 150px;
    }
    
    .care-guide p {
        font-size: 0.8rem;
    }
    
    footer {
        margin-left: 8px !important;
        font-size: 0.8rem;
    }
}

/* Landscape orientation on mobile */
@media (max-width: 1024px) and (orientation: landscape) and (max-height: 600px) {
    .slide {
        flex-direction: row;
        height: 100vh;
    }
    
    .slide-image {
        height: 100%;
        width: 60%;
    }
    
    .overlay-text {
        width: 40%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    
    .overlay-text h3.common-name {
        font-size: 4vw;
    }
    
    .overlay-text h4.species-name {
        font-size: 3vw;
    }
}

/* ────────────── ADDITIVE SECTIONS STYLES ────────────── */

/* Hero Section */
[data-rc-new="hero"] {
    background-color: var(--bg);
    padding: 60px 20px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
}

.hero-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 60px;
}

.hero-content {
    flex: 1;
}

.hero-content h1 {
    font-size: 3rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 20px 0;
    line-height: 1.2;
}

.hero-content p {
    font-size: 1.2rem;
    color: var(--text-muted);
    margin: 0 0 30px 0;
    line-height: 1.5;
}

.hero-ctas {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.cta-primary, .cta-secondary {
    display: inline-block;
    padding: 15px 30px;
    text-decoration: none;
    border-radius: 5px;
    font-weight: 700;
    transition: all 0.3s ease;
    text-align: center;
}

.cta-primary {
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}

.cta-primary:hover {
    background-color: var(--btn-primary-hover);
    transform: translateY(-2px);
}

.cta-secondary {
    background-color: var(--btn-secondary-bg);
    color: var(--btn-secondary-text);
    border: 2px solid var(--btn-secondary-border);
}

.cta-secondary:hover {
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}

.hero-image {
    flex: 1;
    text-align: center;
}

.hero-image img {
    max-width: 100%;
    height: auto;
}

/* Species Shortcuts */
[data-rc-new="species-shortcuts"] {
    background-color: var(--bg-elev);
    padding: 60px 20px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
}

.species-container {
    max-width: 1200px;
    margin: 0 auto;
}

.species-container h2 {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 40px 0;
}

.species-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    max-width: 1000px;
    margin: 0 auto;
}

.species-tile {
    background-color: var(--bg);
    border-radius: 10px;
    padding: 30px 20px;
    text-align: center;
    text-decoration: none;
    color: var(--text);
    box-shadow: 0 4px 6px var(--shadow);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.species-tile:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px var(--shadow-hover);
}

.species-image-container {
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    overflow: hidden;
}

.species-image-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.species-tile h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0;
    color: var(--text);
}

/* Mid-page CTA */
[data-rc-new="mid-page-cta"] {
    background-color: var(--btn-primary-bg);
    padding: 40px 20px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
}

.mid-cta-container {
    max-width: 800px;
    margin: 0 auto;
}

.mid-cta-content {
    text-align: center;
}

.mid-cta-content h2 {
    color: var(--btn-primary-text);
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 20px 0;
}

/* How It Works */
[data-rc-new="how-it-works"] {
    background-color: var(--bg);
    padding: 60px 20px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
}

.how-it-works-container {
    max-width: 1200px;
    margin: 0 auto;
}

.how-it-works-container h2 {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 50px 0;
}

.steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 40px;
    margin-bottom: 40px;
}

.step {
    text-align: center;
    padding: 30px 20px;
}

.step-number {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 auto 20px auto;
}

.step h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 15px 0;
}

.step p {
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0;
}

.affiliate-disclosure {
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-light);
    font-style: italic;
    margin: 0;
}

/* Mission Micro */
[data-rc-new="mission-micro"] {
    background-color: var(--bg-elev);
    padding: 60px 20px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
}

.mission-container {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.mission-container h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 20px 0;
}

.mission-container p {
    font-size: 1.1rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0 0 30px 0;
}

.learn-more-link {
    color: var(--link);
    text-decoration: none;
    font-weight: 700;
    border-bottom: 2px solid var(--link);
    transition: opacity 0.3s ease;
}

.learn-more-link:hover {
    opacity: 0.7;
}

/* Newsletter */
[data-rc-new="newsletter"] {
    background-color: var(--bg);
    padding: 60px 20px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
}

.newsletter-container {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
}

.newsletter-container h2 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 15px 0;
}

.newsletter-container p {
    color: var(--text-muted);
    margin: 0 0 30px 0;
}

.newsletter-form {
    display: flex;
    gap: 10px;
    max-width: 400px;
    margin: 0 auto;
}

.newsletter-form input[type="email"] {
    flex: 1;
    padding: 12px 15px;
    border: 1px solid var(--border);
    border-radius: 5px;
    font-size: 1rem;
    outline: none;
    background-color: var(--bg);
    color: var(--text);
}

.newsletter-form input[type="email"]:focus {
    border-color: var(--link);
}

.newsletter-form button {
    padding: 12px 25px;
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
    border: none;
    border-radius: 5px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.newsletter-form button:hover {
    background-color: var(--btn-primary-hover);
}

.newsletter-message {
    margin-top: 15px;
    padding: 10px;
    border-radius: 5px;
    font-weight: 700;
}

.newsletter-message.success {
    background-color: var(--status-success-bg);
    color: var(--status-success-text);
    border: 1px solid var(--status-success-border);
}

.newsletter-message.error {
    background-color: var(--status-error-bg);
    color: var(--status-error-text);
    border: 1px solid var(--status-error-border);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Responsive styles for new sections */
@media (max-width: 768px) {
    [data-rc-new="hero"] {
        padding: 40px 20px;
    }
    
    .hero-container {
        flex-direction: column;
        gap: 40px;
        text-align: center;
    }
    
    .hero-content h1 {
        font-size: 2.2rem;
    }
    
    .hero-ctas {
        justify-content: center;
    }
    
    .species-container h2,
    .how-it-works-container h2,
    .mission-container h2 {
        font-size: 2rem;
    }
    
    .species-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    }
    
    .steps-grid {
        grid-template-columns: 1fr;
        gap: 30px;
    }
    
    .newsletter-form {
        flex-direction: column;
        gap: 15px;
    }
    
    .newsletter-form input[type="email"],
    .newsletter-form button {
        width: 100%;
    }
}

@media (max-width: 480px) {
    [data-rc-new="hero"],
    [data-rc-new="species-shortcuts"],
    [data-rc-new="how-it-works"],
    [data-rc-new="mission-micro"],
    [data-rc-new="newsletter"],
    [data-rc-new="mid-page-cta"] {
        padding: 30px 15px;
    }
    
    .hero-content h1 {
        font-size: 1.8rem;
    }
    
    .hero-content p {
        font-size: 1rem;
    }
    
    .cta-primary, .cta-secondary {
        padding: 12px 25px;
        font-size: 0.9rem;
    }
    
    .species-container h2,
    .how-it-works-container h2,
    .mission-container h2 {
        font-size: 1.8rem;
    }
    
    .species-grid {
        grid-template-columns: 1fr;
    }
    
    .species-tile {
        padding: 20px 15px;
    }
    
    .mid-cta-content h2 {
        font-size: 1.5rem;
    }
}

/* ────────────── CARE GUIDES ADDITIVE STYLES ────────────── */

/* Old top filter bar styles removed per user request */

/* Grid Container Enhancement */
[data-rc-cg="grid"] {
    min-height: 400px;
    background: var(--text);
    padding: 20px 8px;
    border-radius: 8px;
}

/* Availability Status Tinting */
.rc-badge--high {
    color: var(--rarity-common);
}

.rc-badge--med {
    color: var(--rarity-uncommon) !important;
    font-weight: 600;
}

.rc-badge--low {
    color: var(--rarity-rare) !important;
    font-weight: 700;
}

/* Cross-link styling removed per user request */

/* Pagination */
[data-rc-cg="pagination"] {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin: 32px 0 0 0;
    padding: 20px;
}

.rc-page-btn {
    padding: 8px 16px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 6px;
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
}

.rc-page-btn:hover:not(:disabled),
.rc-page-btn:focus:not(:disabled) {
    border-color: var(--link);
    color: var(--link);
    box-shadow: 0 0 0 2px rgba(15, 15, 15, 0.1);
}

.rc-page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.rc-page-numbers {
    display: flex;
    gap: 4px;
}

.rc-page-num {
    width: 40px;
    height: 40px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 6px;
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.rc-page-num:hover,
.rc-page-num:focus {
    border-color: var(--link);
    color: var(--link);
    box-shadow: 0 0 0 2px rgba(15, 15, 15, 0.1);
}

.rc-page-active {
    background: var(--btn-primary-bg);
    border-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}

.rc-page-active:hover,
.rc-page-active:focus {
    background: var(--btn-primary-hover);
    border-color: var(--btn-primary-hover);
}

/* Mobile Responsive Enhancements */
@media (max-width: 768px) {
    /* Old top filter bar mobile styles removed */
    
    [data-rc-cg="pagination"] {
        gap: 8px;
        padding: 16px;
        flex-wrap: wrap;
    }
    
    .rc-page-btn {
        padding: 6px 12px;
        font-size: 0.85rem;
    }
    
    .rc-page-num {
        width: 36px;
        height: 36px;
        font-size: 0.85rem;
    }
}

@media (max-width: 480px) {
    /* Old top filter bar mobile styles removed */
    
    [data-rc-cg="grid"] {
        padding: 12px 4px;
    }
    
    [data-rc-cg="pagination"] {
        gap: 6px;
        padding: 12px;
    }
    
    .rc-page-btn {
        padding: 5px 10px;
        font-size: 0.8rem;
    }
    
    .rc-page-num {
        width: 32px;
        height: 32px;
        font-size: 0.8rem;
    }
    
    /* Cross-link mobile styles removed */
}

/* ────────────── SIDEBAR LAYOUT STYLES ────────────── */

/* Mobile filters removed per user request */

/* Desktop Two-Column Layout */
[data-rc-cg="layout"] {
    display: grid;
    grid-template-columns: 560px 1fr;
    gap: 24px;
    align-items: start;
    margin-top: 24px;
}

/* Sticky Sidebar */
[data-rc-cg="sidebar"] {
    position: sticky;
    top: var(--rc-sticky-top, 16px);
    max-height: calc(100vh - var(--rc-sticky-top, 16px));
    overflow-y: auto;
    background: var(--bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--shadow);
    border: 1px solid var(--border-light);
}

.rc-sidebar-content {
    padding: 20px;
}

.rc-sidebar-title {
    margin: 0 0 16px 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    font-family: 'Open Sans', Arial, sans-serif;
    border-bottom: 1px solid var(--border-light);
    padding-bottom: 12px;
}

/* Result Count */
.rc-result-count {
    font-size: 0.9rem;
    color: var(--text);
    margin-bottom: 12px;
    padding: 8px 12px;
    background: var(--bg-elev);
    border-radius: 4px;
    text-align: center;
    font-weight: 500;
}

/* Filter Sections */
.rc-filter-section {
    margin-bottom: 16px;
}

.rc-filter-section:last-of-type {
    margin-bottom: 12px;
}

.rc-filter-section-title {
    margin: 0 0 12px 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    font-family: 'Open Sans', Arial, sans-serif;
}

/* Filter Chips */
.rc-filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.rc-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 14px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 20px;
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    white-space: nowrap;
}

.rc-chip:hover,
.rc-chip:focus {
    border-color: var(--link);
    color: var(--link);
    box-shadow: 0 0 0 2px rgba(15, 15, 15, 0.1);
}

.rc-chip--active {
    background: var(--btn-primary-bg);
    border-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}

.rc-chip--active:hover,
.rc-chip--active:focus {
    background: var(--btn-primary-hover);
    border-color: var(--btn-primary-hover);
}

/* Clear All Button */
.rc-clear-all-btn {
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: 2px solid var(--text-light);
    border-radius: 6px;
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-light);
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    margin-top: 8px;
}

.rc-clear-all-btn:hover,
.rc-clear-all-btn:focus {
    border-color: var(--text-muted);
    color: var(--text-muted);
    box-shadow: 0 0 0 2px rgba(102, 102, 102, 0.1);
}

/* Grid Wrapper */
[data-rc-cg="grid-wrap"] {
    min-height: 400px;
}

/* Tighten grid spacing to reduce empty background */
[data-rc-cg="grid-wrap"] .care-guide-container {
    background: var(--text);
    padding: 16px;
    border-radius: 8px;
    min-height: 300px;
}

/* Mobile Filter Interface */
.rc-mobile-filter-toggle {
    display: none;
    width: 100%;
    padding: 12px 16px;
    margin: 0 0 8px 0;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
    justify-content: space-between;
    align-items: center;
    outline: none;
    box-shadow: 0 2px 4px var(--shadow);
    box-sizing: border-box;
}

.rc-mobile-filter-toggle:hover,
.rc-mobile-filter-toggle:focus {
    border-color: var(--link);
    box-shadow: 0 2px 8px var(--shadow-hover);
}

.rc-filter-count {
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
}

.rc-filter-count:empty {
    display: none;
}

.rc-mobile-filter-drawer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    overflow: auto;
    padding: 16px;
    box-sizing: border-box;
}

.rc-mobile-filter-drawer[hidden] {
    display: none !important;
}

.rc-mobile-filter-header {
    background: var(--bg);
    padding: 16px 20px;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-light);
}

.rc-mobile-filter-header h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    font-family: 'Open Sans', Arial, sans-serif;
}

.rc-mobile-filter-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    outline: none;
    transition: all 0.2s ease;
}

.rc-mobile-filter-close:hover,
.rc-mobile-filter-close:focus {
    background: var(--bg-elev);
    color: var(--text);
}

.rc-mobile-filter-content {
    background: var(--bg);
    padding: 20px;
    border-radius: 0 0 8px 8px;
    max-height: calc(100vh - 120px);
    overflow: auto;
}

/* Responsive Behavior */
@media (max-width: 1023.98px) {
    /* Prevent horizontal overflow on mobile */
    body {
        overflow-x: hidden;
    }
    
    .care-guides {
        overflow-x: hidden;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }
    
    /* Show mobile filter toggle, hide desktop sidebar */
    .rc-mobile-filter-toggle {
        display: flex !important;
    }
    
    [data-rc-cg="layout"] {
        grid-template-columns: 1fr;
        gap: 0;
        margin-top: 0;
    }
    
    [data-rc-cg="sidebar"] {
        display: none;
    }
    
    [data-rc-cg="grid-wrap"] {
        margin-top: 0;
    }
    
    /* Improve mobile spacing */
    [data-rc-cg="wrap"] {
        padding: 1rem;
        margin-top: 0.25rem;
    }
    
    [data-rc-cg="grid"] .care-guide-container {
        gap: 16px 12px;
        padding: 12px;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
}

@media (max-width: 768px) {
    /* Improved mobile spacing and layout */
    [data-rc-cg="intro"] {
        padding: 1rem 0.75rem;
        margin: 0.5rem 0 0.5rem;
        width: 100%;
        box-sizing: border-box;
    }
    
    [data-rc-cg="intro"] h1 {
        font-size: clamp(1.5rem, 4vw, 2rem);
        margin-bottom: 0.5rem;
    }
    
    [data-rc-cg="intro"] p {
        font-size: 1rem;
        line-height: 1.5;
    }
    
    .rc-mobile-filter-toggle {
        margin: 0 0 12px 0;
        padding: 10px 14px;
        font-size: 0.95rem;
        width: 100%;
        box-sizing: border-box;
    }
    
    [data-rc-cg="wrap"] {
        margin: 0;
        padding: 0.75rem;
        border-radius: 6px;
        width: 100%;
        box-sizing: border-box;
    }
    
    [data-rc-cg="grid"] .care-guide-container {
        gap: 14px 10px;
        padding: 8px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
    
    /* Optimize cards for mobile */
    [data-rc-cg="grid"] .rc-card {
        border-radius: 6px;
        margin-bottom: 0;
    }
    
    .rc-mobile-filter-content {
        padding: 16px;
    }
    
    .rc-mobile-filter-drawer {
        padding: 12px;
    }
}

@media (max-width: 480px) {
    /* Extra small mobile optimizations */
    [data-rc-cg="intro"] {
        padding: 0.75rem 0.5rem;
        margin: 0.25rem 0 0.25rem;
        width: 100%;
        box-sizing: border-box;
    }
    
    [data-rc-cg="intro"] h1 {
        font-size: clamp(1.3rem, 5vw, 1.8rem);
        margin-bottom: 0.4rem;
    }
    
    [data-rc-cg="intro"] p {
        font-size: 0.95rem;
    }
    
    .rc-mobile-filter-toggle {
        margin: 0 0 10px 0;
        padding: 8px 12px;
        font-size: 0.9rem;
        width: 100%;
        box-sizing: border-box;
    }
    
    [data-rc-cg="wrap"] {
        margin: 0;
        padding: 0.5rem;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
    }
    
    [data-rc-cg="grid"] .care-guide-container {
        gap: 12px 8px;
        padding: 6px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
    
    .rc-mobile-filter-content {
        padding: 12px;
    }
    
    .rc-mobile-filter-drawer {
        padding: 8px;
    }
    
    .rc-filter-chips {
        gap: 4px;
    }
    
    .rc-chip {
        padding: 6px 10px;
        font-size: 0.8rem;
        border-radius: 12px;
    }
}

/* ────────────── WELCOMING VISUAL REFRESH ────────────── */

/* General wrap + welcoming tone */
[data-rc-cg="wrap"] {
    background: var(--bg-section);
    padding: 1.25rem;
    border-radius: 0.75rem;
    margin-top: 0;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
    max-width: 100%;
}

[data-rc-cg="intro"] {
    margin: 0.5rem 0 0.5rem;
    text-align: center;
    padding: 1rem 1rem;
    background-color: var(--bg);
    border-radius: 8px;
}

[data-rc-cg="intro"] h1 {
    font-size: clamp(1.8rem, 1.5rem + 1.5vw, 2.5rem);
    margin: 0 0 0.6rem;
    color: var(--text);
    font-weight: 700;
    font-family: 'Open Sans', Arial, sans-serif;
}

[data-rc-cg="intro"] p {
    color: var(--text-muted);
    max-width: 70ch;
    margin: 0 auto;
    line-height: 1.6;
    font-size: 1.2rem;
    opacity: 0.9;
}

/* Grid/card feel (non-destructive) */
[data-rc-cg="grid"] .rc-card {
    border-radius: 0.75rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
}

[data-rc-cg="grid"] .rc-card:hover {
    box-shadow: 0 4px 20px var(--shadow);
    transform: translateY(-2px);
}

/* Softer card spacing feel */
[data-rc-cg="grid"] {
    --rc-gap: 20px;
}

[data-rc-cg="grid"] .care-guide-container {
    gap: 20px 16px;
    padding: 20px;
    background: transparent;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
}

/* Rarity system removed - restored to original availability display */

/* Responsive tweaks */
@media (min-width: 768px) {
    [data-rc-cg="wrap"] {
        padding: 1.5rem;
    }
    
    [data-rc-cg="intro"] {
        margin: 1rem 0 1rem;
        padding: 1.25rem 1.5rem;
    }
}

@media (min-width: 1024px) {
    [data-rc-cg="wrap"] {
        padding: 2rem;
    }
    
    [data-rc-cg="intro"] {
        margin: 1.5rem 0 1.5rem;
        padding: 1.5rem 2rem;
    }
}

/* ────────────── THEME SETTINGS DROPDOWN ────────────── */
.theme-settings {
    position: relative;
    display: flex;
    align-items: center;
    margin-left: 10px;
}

.theme-settings-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    cursor: pointer;
    color: var(--text);
    font-size: 16px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    outline: none;
}

.theme-settings-btn:hover,
.theme-settings-btn:focus {
    border-color: var(--link);
    background-color: var(--bg-elev);
    box-shadow: 0 0 0 2px rgba(15, 15, 15, 0.1);
}

.theme-settings-btn[aria-expanded="true"] {
    border-color: var(--link);
    background-color: var(--bg-elev);
}

.theme-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--shadow);
    padding: 8px 0;
    min-width: 140px;
    z-index: 1001;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px);
    transition: all 0.2s ease;
}

.theme-dropdown.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.theme-dropdown fieldset {
    border: none;
    margin: 0;
    padding: 0;
}

.theme-dropdown legend {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    padding: 0 12px 8px;
    margin: 0;
    border-bottom: 1px solid var(--border-light);
    width: 100%;
    box-sizing: border-box;
}

.theme-option {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    margin: 4px 0;
}

.theme-option:hover,
.theme-option:focus-within {
    background-color: var(--bg-elev);
}

.theme-option input[type="radio"] {
    margin: 0 8px 0 0;
    accent-color: var(--link);
}

.theme-option label {
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text);
    user-select: none;
    flex: 1;
}

/* Focus management */
.theme-dropdown:focus-within {
    outline: 2px solid var(--link);
    outline-offset: 2px;
}

/* Mobile adjustments */
@media (max-width: 1024px) {
    .theme-settings {
        display: none;
    }
}
EOF

echo "✅ CSS updated with dark mode support"

# Check if header.html exists and contains navigation
if [[ -f "header.html" ]]; then
    if grep -q "site-search" header.html && grep -q "auth-buttons" header.html; then
        echo ""
        echo "🎯 MANUAL STEPS REQUIRED:"
        echo ""
        echo "1. Add Settings button to header.html"
        echo "   Insert AFTER the search form (around line with 'site-search')"
        echo "   and BEFORE the auth buttons (around line with 'auth-buttons'):"
        echo ""
        echo '   <!-- BEGIN Settings Insert -->'
        echo '   <div class="theme-settings">'
        echo '       <button class="theme-settings-btn" aria-haspopup="menu" aria-expanded="false"'
        echo '               aria-label="Theme settings" type="button">⚙️</button>'
        echo '       <div class="theme-dropdown" role="menu" aria-label="Appearance settings">'
        echo '           <fieldset>'
        echo '               <legend>Appearance</legend>'
        echo '               <div class="theme-option" role="none">'
        echo '                   <input type="radio" id="theme-light" name="theme" value="light" />'
        echo '                   <label for="theme-light">Light</label>'
        echo '               </div>'
        echo '               <div class="theme-option" role="none">'
        echo '                   <input type="radio" id="theme-dark" name="theme" value="dark" />'
        echo '                   <label for="theme-dark">Dark</label>'
        echo '               </div>'
        echo '               <div class="theme-option" role="none">'
        echo '                   <input type="radio" id="theme-system" name="theme" value="system" checked />'
        echo '                   <label for="theme-system">System</label>'
        echo '               </div>'
        echo '           </fieldset>'
        echo '       </div>'
        echo '   </div>'
        echo '   <!-- END Settings Insert -->'
        echo ""
    else
        echo "⚠️  Warning: header.html found but structure unexpected. Manually add Settings button."
    fi
else
    echo "⚠️  Warning: header.html not found in current directory"
fi

echo ""
echo "2. Add FOUC prevention script to ALL HTML files"
echo "   Insert in <head> section BEFORE any stylesheets:"
echo ""
echo '   <script>'
echo '   (function() {'
echo "       'use strict';"
echo '       let theme;'
echo '       try {'
echo "           theme = localStorage.getItem('reptilecare-theme');"
echo '       } catch (e) {'
echo '           theme = null;'
echo '       }'
echo "       if (theme && theme !== 'system') {"
echo "           document.documentElement.setAttribute('data-theme', theme);"
echo '       }'
echo '   })();'
echo '   </script>'
echo ""
echo "3. Add theme script reference to ALL HTML files"
echo "   Insert before closing </body> tag:"
echo ""
echo '   <script src="js/theme.js"></script>'
echo ""

echo "🦎 Dark mode implementation complete!"
echo ""
echo "Files created/modified:"
echo "  ✅ js/theme.js (new)"
echo "  ✅ styles.css (updated with color tokens)"
echo "  📦 styles.css.backup.* (original backed up)"
echo ""
echo "🚀 Ready for production deployment!"

exit 0
EOF

chmod +x apply_patches.sh

echo "✅ Deployment script created successfully"

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
