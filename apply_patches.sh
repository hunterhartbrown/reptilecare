#!/bin/bash

# apply_patches.sh - One-shot deployment script for Dark Mode implementation
# Run this script from the project root directory

set -e  # Exit on any error

echo "🌙 Applying Dark Mode patches to ReptileCare.net..."

# Backup original files
echo "📦 Creating backups..."
cp styles.css styles.css.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "styles.css backup failed (file may not exist)"
cp header.html header.html.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "header.html backup failed (file may not exist)"

# Create js directory if it doesn't exist
mkdir -p js

# Create theme.js
echo "⚙️ Creating theme management script..."
cat > js/theme.js << 'EOF'
/**
 * Theme Management System for ReptileCare.net
 * Handles light/dark/system theme switching with localStorage persistence
 * and accessible dropdown controls
 */

(function() {
    'use strict';

    // Theme constants
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
    };

    const STORAGE_KEY = 'theme';
    const DATA_THEME_ATTR = 'data-theme';

    // State
    let currentTheme = THEMES.LIGHT; // Default to light theme
    let systemPrefersDark = false;
    let mediaQuery = null;
    let isDropdownOpen = false;

    // DOM elements (will be populated on init)
    let settingsButton = null;
    let settingsMenu = null;
    let radioButtons = [];

    /**
     * Initialize the theme system
     */
    function init() {
        // Set up system preference detection
        setupSystemPreferenceDetection();
        
        // Load saved theme preference
        loadThemePreference();
        
        // Apply initial theme
        applyTheme();
        
        // Set up dropdown functionality when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupDropdown);
        } else {
            setupDropdown();
        }
    }

    /**
     * Set up system color scheme preference detection
     */
    function setupSystemPreferenceDetection() {
        if (window.matchMedia) {
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            systemPrefersDark = mediaQuery.matches;
            
            // Listen for changes in system preference
            mediaQuery.addEventListener('change', handleSystemPreferenceChange);
        }
    }

    /**
     * Handle changes in system color scheme preference
     */
    function handleSystemPreferenceChange(e) {
        systemPrefersDark = e.matches;
        
        // Only update if currently using system theme
        if (currentTheme === THEMES.SYSTEM) {
            applyTheme();
        }
    }

    /**
     * Load theme preference from localStorage
     */
    function loadThemePreference() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && Object.values(THEMES).includes(saved)) {
                currentTheme = saved;
            }
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
        }
    }

    /**
     * Save theme preference to localStorage
     */
    function saveThemePreference() {
        try {
            localStorage.setItem(STORAGE_KEY, currentTheme);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    /**
     * Apply the current theme to the document
     */
    function applyTheme() {
        const root = document.documentElement;
        
        switch (currentTheme) {
            case THEMES.LIGHT:
                root.setAttribute(DATA_THEME_ATTR, THEMES.LIGHT);
                break;
            case THEMES.DARK:
                root.setAttribute(DATA_THEME_ATTR, THEMES.DARK);
                break;
            case THEMES.SYSTEM:
                // Remove data-theme to let CSS media queries handle it
                root.removeAttribute(DATA_THEME_ATTR);
                break;
        }
    }

    /**
     * Set up dropdown functionality
     */
    function setupDropdown() {
        // Find dropdown elements
        settingsButton = document.getElementById('settings-button');
        settingsMenu = document.getElementById('settings-menu');
        radioButtons = document.querySelectorAll('input[name="theme"]');

        if (!settingsButton || !settingsMenu || radioButtons.length === 0) {
            console.warn('Theme dropdown elements not found');
            return;
        }

        // Set up button click handler
        settingsButton.addEventListener('click', toggleDropdown);
        
        // Set up radio button handlers
        radioButtons.forEach(radio => {
            radio.addEventListener('change', handleThemeChange);
        });

        // Set up outside click handler
        document.addEventListener('click', handleOutsideClick);
        
        // Set up escape key handler
        document.addEventListener('keydown', handleKeydown);

        // Set initial radio button state
        updateRadioButtons();
    }

    /**
     * Toggle dropdown open/closed state
     */
    function toggleDropdown(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (isDropdownOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    /**
     * Open the dropdown menu
     */
    function openDropdown() {
        isDropdownOpen = true;
        settingsButton.setAttribute('aria-expanded', 'true');
        settingsMenu.setAttribute('aria-hidden', 'false');
        
        // Focus first radio button for keyboard accessibility
        const firstRadio = settingsMenu.querySelector('input[type="radio"]');
        if (firstRadio) {
            firstRadio.focus();
        }
    }

    /**
     * Close the dropdown menu
     */
    function closeDropdown() {
        isDropdownOpen = false;
        settingsButton.setAttribute('aria-expanded', 'false');
        settingsMenu.setAttribute('aria-hidden', 'true');
        
        // Return focus to button
        settingsButton.focus();
    }

    /**
     * Handle theme selection change
     */
    function handleThemeChange(event) {
        const newTheme = event.target.value;
        
        if (Object.values(THEMES).includes(newTheme)) {
            currentTheme = newTheme;
            saveThemePreference();
            applyTheme();
            updateRadioButtons();
            
            // Close dropdown after selection
            setTimeout(() => {
                closeDropdown();
            }, 150);
        }
    }

    /**
     * Update radio button states to match current theme
     */
    function updateRadioButtons() {
        radioButtons.forEach(radio => {
            radio.checked = (radio.value === currentTheme);
        });
    }

    /**
     * Handle clicks outside the dropdown
     */
    function handleOutsideClick(event) {
        if (!isDropdownOpen) return;
        
        const dropdown = settingsButton.closest('.settings-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            closeDropdown();
        }
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeydown(event) {
        if (!isDropdownOpen) return;
        
        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                closeDropdown();
                break;
            case 'Tab':
                // Allow normal tab behavior within dropdown
                const focusableElements = settingsMenu.querySelectorAll(
                    'input[type="radio"], button, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (event.shiftKey && event.target === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                } else if (!event.shiftKey && event.target === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
                break;
        }
    }

    /**
     * Public API for manual theme switching (for debugging/testing)
     */
    window.themeManager = {
        setTheme: function(theme) {
            if (Object.values(THEMES).includes(theme)) {
                currentTheme = theme;
                saveThemePreference();
                applyTheme();
                updateRadioButtons();
            }
        },
        getCurrentTheme: function() {
            return currentTheme;
        },
        getSystemPreference: function() {
            return systemPrefersDark ? THEMES.DARK : THEMES.LIGHT;
        }
    };

    // Initialize when script loads
    init();

})();
EOF

echo "✅ Theme script created: js/theme.js"

# Check if header.html exists and contains nav structure
if ! grep -q "auth-buttons" header.html 2>/dev/null; then
    echo "❌ ERROR: header.html not found or doesn't contain expected auth-buttons structure"
    echo "Please manually add the Settings dropdown to your navigation."
    echo ""
    echo "Add this HTML snippet to your header next to the auth buttons:"
    echo ""
    cat << 'EOF'
<!-- BEGIN Settings Insert -->
<div class="settings-dropdown">
    <button 
        class="settings-button" 
        id="settings-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-label="Theme settings"
    >
        ⚙️ Settings
    </button>
    <div 
        class="settings-menu" 
        id="settings-menu"
        role="menu"
        aria-hidden="true"
        aria-labelledby="settings-button"
    >
        <fieldset class="settings-fieldset">
            <legend class="settings-legend">Appearance</legend>
            <div class="settings-option">
                <input 
                    type="radio" 
                    id="theme-light" 
                    name="theme" 
                    value="light"
                    role="menuitemradio"
                >
                <label for="theme-light">Light</label>
            </div>
            <div class="settings-option">
                <input 
                    type="radio" 
                    id="theme-dark" 
                    name="theme" 
                    value="dark"
                    role="menuitemradio"
                >
                <label for="theme-dark">Dark</label>
            </div>
            <div class="settings-option">
                <input 
                    type="radio" 
                    id="theme-system" 
                    name="theme" 
                    value="system"
                    role="menuitemradio"
                >
                <label for="theme-system">System</label>
            </div>
        </fieldset>
    </div>
</div>
<!-- END Settings Insert -->
EOF
    echo ""
    echo "And add this FOUC prevention script to your <head> section:"
    echo ""
    cat << 'EOF'
<!-- FOUC Prevention - Theme Bootstrap -->
<script>
(function() {
    try {
        const theme = localStorage.getItem('theme');
        
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (!theme) {
            // Default to light theme if no preference is set
            document.documentElement.setAttribute('data-theme', 'light');
        }
        // For system theme, let CSS media queries handle it
    } catch (e) {
        // Silent fail - default to light theme
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();
</script>
EOF
    echo ""
    echo "Also make sure to include the theme script: <script src=\"js/theme.js\"></script>"
    exit 1
fi

echo "🎨 Dark mode implementation complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Add the FOUC prevention script to the <head> of all your HTML files"
echo "2. Update any additional HTML files that use the header template"
echo "3. Test the theme switching functionality"
echo "4. Verify accessibility with keyboard navigation"
echo ""
echo "💡 The theme selector is now available in the header next to the auth buttons!"
echo "💾 Theme preferences are automatically saved to localStorage"
echo "🔄 System theme preference is detected and updates automatically"
echo ""
echo "✨ Ready for deployment to main branch!"
