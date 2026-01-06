/**
 * Search Functionality with Autocomplete
 * Provides search suggestions for reptile care guides and enclosure builder
 */

(function() {
    'use strict';
    
    // Search data for all available content
    const searchData = [
        // Leopard Gecko
        {
            title: "Leopard Gecko Care Guide",
            keywords: ["leopard", "gecko", "leopard gecko", "care", "guide", "leo"],
            url: "leopard-gecko.html",
            type: "Care Guide",
            icon: "📚"
        },
        {
            title: "Design Leopard Gecko Enclosure",
            keywords: ["leopard", "gecko", "leopard gecko", "enclosure", "design", "builder", "habitat", "tank", "terrarium"],
            url: "enclosure-builder.html?reptile=leopard-gecko",
            type: "Enclosure Builder",
            icon: "🔧"
        },
        
        // Bearded Dragon
        {
            title: "Bearded Dragon Care Guide",
            keywords: ["bearded", "dragon", "bearded dragon", "care", "guide", "beardie"],
            url: "bearded-dragon.html",
            type: "Care Guide",
            icon: "📚"
        },
        {
            title: "Design Bearded Dragon Enclosure",
            keywords: ["bearded", "dragon", "bearded dragon", "enclosure", "design", "builder", "habitat", "tank", "terrarium"],
            url: "enclosure-builder.html?reptile=bearded-dragon",
            type: "Enclosure Builder",
            icon: "🔧"
        },
        
        // Crested Gecko
        {
            title: "Crested Gecko Care Guide",
            keywords: ["crested", "gecko", "crested gecko", "care", "guide", "crestie"],
            url: "crested-gecko.html",
            type: "Care Guide",
            icon: "📚"
        },
        {
            title: "Design Crested Gecko Enclosure",
            keywords: ["crested", "gecko", "crested gecko", "enclosure", "design", "builder", "habitat", "tank", "terrarium"],
            url: "enclosure-builder.html?reptile=crested-gecko",
            type: "Enclosure Builder",
            icon: "🔧"
        },
        
        
        // General pages
        {
            title: "All Care Guides",
            keywords: ["all", "care", "guides", "list", "overview"],
            url: "all-care-guides.html",
            type: "Page",
            icon: "📚"
        },
        {
            title: "Enclosure Designer",
            keywords: ["enclosure", "designer", "builder", "design", "build", "create"],
            url: "enclosure-builder.html",
            type: "Tool",
            icon: "🔧"
        }
    ];

    // Search function
    function searchContent(query) {
        if (!query || query.length < 1) return [];
        
        const queryLower = query.toLowerCase().trim();
        const results = [];
        
        searchData.forEach(item => {
            // Check if query matches any keywords
            const matches = item.keywords.some(keyword => 
                keyword.toLowerCase().includes(queryLower)
            );
            
            if (matches) {
                // Calculate relevance score
                let score = 0;
                
                // Exact title match gets highest score
                if (item.title.toLowerCase().includes(queryLower)) {
                    score += 100;
                }
                
                // Exact keyword match gets high score
                if (item.keywords.some(keyword => keyword.toLowerCase() === queryLower)) {
                    score += 50;
                }
                
                // Partial keyword match gets medium score
                if (item.keywords.some(keyword => keyword.toLowerCase().startsWith(queryLower))) {
                    score += 25;
                }
                
                // Any keyword containing query gets low score
                score += 10;
                
                results.push({ ...item, score });
            }
        });
        
        // Sort by relevance score and return top 6 results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
    }

    // Create suggestions dropdown
    function createSuggestionsDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'search-suggestions';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #ddd;
            border-top: none;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        return dropdown;
    }

    // Create suggestion item
    function createSuggestionItem(item) {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'search-suggestion-item';
        suggestionDiv.style.cssText = `
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        suggestionDiv.innerHTML = `
            <span style="font-size: 18px;">${item.icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #222; margin-bottom: 2px;">${item.title}</div>
                <div style="font-size: 0.85rem; color: #666;">${item.type}</div>
            </div>
        `;
        
        // Hover effects
        suggestionDiv.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f5f5f5';
        });
        
        suggestionDiv.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        // Click handler
        suggestionDiv.addEventListener('click', function() {
            navigateToPage(item.url);
        });
        
        return suggestionDiv;
    }

    // Navigate to page
    function navigateToPage(url) {
        // Check if we're in a subdirectory and adjust path accordingly
        const currentPath = window.location.pathname;
        const isInSubdirectory = currentPath.includes('/crested-gecko');
        
        if (isInSubdirectory && !url.startsWith('http') && !url.startsWith('../')) {
            url = '../' + url;
        }
        
        window.location.href = url;
    }

    // Initialize search for a specific input
    function initializeSearchInput(input, isDesktop = true) {
        const container = input.closest('.search-input-container') || input.parentElement;
        let suggestionsDropdown = container.querySelector('.search-suggestions');
        
        if (!suggestionsDropdown) {
            suggestionsDropdown = createSuggestionsDropdown();
            container.appendChild(suggestionsDropdown);
            container.style.position = 'relative';
        }

        // Input event handler
        input.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (query.length < 1) {
                suggestionsDropdown.style.display = 'none';
                return;
            }
            
            const results = searchContent(query);
            
            if (results.length === 0) {
                suggestionsDropdown.style.display = 'none';
                return;
            }
            
            // Clear previous suggestions
            suggestionsDropdown.innerHTML = '';
            
            // Add new suggestions
            results.forEach(item => {
                const suggestionItem = createSuggestionItem(item);
                suggestionsDropdown.appendChild(suggestionItem);
            });
            
            suggestionsDropdown.style.display = 'block';
        });

        // Focus event handler
        input.addEventListener('focus', function() {
            if (this.value.trim().length > 0) {
                const results = searchContent(this.value.trim());
                if (results.length > 0) {
                    suggestionsDropdown.style.display = 'block';
                }
            }
        });

        // Handle form submission
        const form = input.closest('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const query = input.value.trim();
                
                if (query) {
                    const results = searchContent(query);
                    if (results.length > 0) {
                        navigateToPage(results[0].url);
                    }
                }
            });
        }
    }

    // Close suggestions when clicking outside
    function setupOutsideClickHandler() {
        document.addEventListener('click', function(e) {
            const searchContainers = document.querySelectorAll('.search-input-container, .mobile-search');
            let clickedInsideSearch = false;
            
            searchContainers.forEach(container => {
                if (container && container.contains(e.target)) {
                    clickedInsideSearch = true;
                }
            });
            
            if (!clickedInsideSearch) {
                const allSuggestions = document.querySelectorAll('.search-suggestions');
                allSuggestions.forEach(suggestions => {
                    suggestions.style.display = 'none';
                });
            }
        });
    }

    // Initialize all search inputs
    function initializeAllSearchInputs() {
        // Desktop search
        const desktopSearch = document.querySelector('#desktop-search .search-input');
        if (desktopSearch) {
            initializeSearchInput(desktopSearch, true);
        }
        
        // Mobile search
        const mobileSearch = document.querySelector('.mobile-search .search-input');
        if (mobileSearch) {
            initializeSearchInput(mobileSearch, false);
        }
        
        setupOutsideClickHandler();
    }

    // Initialize when DOM is ready
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeAllSearchInputs);
        } else {
            // If header is loaded dynamically, wait a bit
            setTimeout(initializeAllSearchInputs, 100);
        }
    }

    // Auto-initialize
    initialize();
    
    // Make functions available globally if needed
    window.searchFunctionality = {
        initialize: initializeAllSearchInputs,
        search: searchContent
    };

})(); 