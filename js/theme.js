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
