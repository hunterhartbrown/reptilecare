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
    let currentTheme = THEMES.SYSTEM;
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
