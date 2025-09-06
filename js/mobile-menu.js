/**
 * Mobile Menu Functionality
 * Handles the hamburger menu toggle and mobile navigation
 * Works with header.html loaded via fetch
 */

(function() {
    'use strict';
    
    // Mobile Menu Functionality
    function initMobileMenu() {
        // Small delay to ensure DOM is fully rendered
        setTimeout(function() {
            const mobileToggle = document.getElementById('mobile-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (!mobileToggle || !mobileMenu) {
                console.warn('Mobile menu elements not found - retrying...');
                // Retry after a short delay if elements aren't found
                setTimeout(initMobileMenu, 100);
                return;
            }

            console.log('Mobile menu initialized successfully');

            // Remove any existing event listeners to prevent duplicates
            mobileToggle.replaceWith(mobileToggle.cloneNode(true));
            const newMobileToggle = document.getElementById('mobile-toggle');

            // Toggle mobile menu
            newMobileToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Mobile menu toggle clicked');
                
                const isActive = this.classList.contains('active');
                
                if (isActive) {
                    // Close menu
                    this.classList.remove('active');
                    mobileMenu.classList.remove('show');
                    console.log('Menu closed');
                } else {
                    // Open menu
                    this.classList.add('active');
                    mobileMenu.classList.add('show');
                    console.log('Menu opened');
                }
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', function(event) {
                const isClickInsideHeader = event.target.closest('header');
                
                if (!isClickInsideHeader && mobileMenu.classList.contains('show')) {
                    newMobileToggle.classList.remove('active');
                    mobileMenu.classList.remove('show');
                    console.log('Menu closed by outside click');
                }
            });

            // Close mobile menu when clicking on a nav link
            const mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-links a');
            mobileNavLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    newMobileToggle.classList.remove('active');
                    mobileMenu.classList.remove('show');
                    console.log('Menu closed by nav link click');
                });
            });

            // Close mobile menu when window is resized to desktop
            window.addEventListener('resize', function() {
                if (window.innerWidth > 1024) {
                    newMobileToggle.classList.remove('active');
                    mobileMenu.classList.remove('show');
                    console.log('Menu closed due to window resize');
                }
            });

            // Test the mobile menu functionality
            console.log('Mobile toggle element:', newMobileToggle);
            console.log('Mobile menu element:', mobileMenu);
            
        }, 50);
    }

    // Determine the correct header path based on current page location
    function getHeaderPath() {
        const currentPath = window.location.pathname;
        
        // Check if we're in a subdirectory by looking for multiple slashes
        // or if the path contains specific subdirectory indicators
        const isInSubdirectory = (currentPath.match(/\//g) || []).length > 1 || 
                                 currentPath.includes('/crested-gecko') || 
                                 currentPath.includes('/eastern-collared-lizard');
        
        return isInSubdirectory ? '../header.html' : 'header.html';
    }

    // Determine the correct footer path based on current page location
    function getFooterPath() {
        const currentPath = window.location.pathname;
        
        // Check if we're in a subdirectory by looking for multiple slashes
        // or if the path contains specific subdirectory indicators
        const isInSubdirectory = (currentPath.match(/\//g) || []).length > 1 || 
                                 currentPath.includes('/crested-gecko') || 
                                 currentPath.includes('/eastern-collared-lizard');
        
        return isInSubdirectory ? '../footer.html' : 'footer.html';
    }

    // Header Loader Function - works on all pages
    function loadHeaderWithMobileMenu() {
        const headerElement = document.getElementById('main-header');
        
        if (!headerElement) {
            console.warn('Header element with id "main-header" not found');
            return;
        }

        const headerPath = getHeaderPath();
        console.log('Loading header from:', headerPath);

        fetch(headerPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load header: ' + response.status);
                }
                return response.text();
            })
            .then(data => {
                headerElement.innerHTML = data;
                
                // Initialize mobile menu after header is loaded
                initMobileMenu();
                
                // Load and initialize search functionality
                loadSearchFunctionality();
                
                // Load footer
                loadFooter();
            })
            .catch(error => {
                console.error('Error loading header:', error);
                
                // Fallback: try alternative path
                const alternatePath = headerPath === 'header.html' ? '../header.html' : 'header.html';
                console.log('Trying alternative path:', alternatePath);
                
                fetch(alternatePath)
                    .then(response => response.text())
                    .then(data => {
                        headerElement.innerHTML = data;
                        initMobileMenu();
                        loadSearchFunctionality();
                        loadFooter();
                    })
                    .catch(fallbackError => {
                        console.error('Failed to load header from alternative path:', fallbackError);
                        // Final fallback: try to initialize mobile menu anyway
                        setTimeout(initMobileMenu, 100);
                        loadFooter();
                    });
            });
    }

    // Footer Loader Function - works on all pages
    function loadFooter() {
        const footerElement = document.getElementById('main-footer');
        
        if (!footerElement) {
            console.warn('Footer element with id "main-footer" not found');
            return;
        }

        const footerPath = getFooterPath();
        console.log('Loading footer from:', footerPath);

        fetch(footerPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load footer: ' + response.status);
                }
                return response.text();
            })
            .then(data => {
                footerElement.innerHTML = data;
                console.log('Footer loaded successfully');
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                
                // Fallback: try alternative path
                const alternatePath = footerPath === 'footer.html' ? '../footer.html' : 'footer.html';
                console.log('Trying alternative footer path:', alternatePath);
                
                fetch(alternatePath)
                    .then(response => response.text())
                    .then(data => {
                        footerElement.innerHTML = data;
                        console.log('Footer loaded from alternative path');
                    })
                    .catch(fallbackError => {
                        console.error('Failed to load footer from alternative path:', fallbackError);
                        // Final fallback: show basic footer
                        footerElement.innerHTML = '<footer style="margin-left: 20px;"><p>&copy; 2025 ReptileCare. All rights reserved.</p></footer>';
                    });
            });
    }

    // Load search functionality script
    function loadSearchFunctionality() {
        // Check if search functionality is already loaded
        if (window.searchFunctionality) {
            window.searchFunctionality.initialize();
            return;
        }
        
        // Determine script path based on current location
        const currentPath = window.location.pathname;
        const isInSubdirectory = currentPath.includes('/crested-gecko') || currentPath.includes('/eastern-collared-lizard');
        const scriptPath = isInSubdirectory ? '../js/search-functionality.js' : 'js/search-functionality.js';
        
        // Create script element
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = function() {
            console.log('Search functionality loaded successfully');
            // Initialize search after a short delay to ensure DOM is ready
            setTimeout(function() {
                if (window.searchFunctionality) {
                    window.searchFunctionality.initialize();
                }
            }, 100);
        };
        script.onerror = function() {
            console.error('Failed to load search functionality script');
        };
        
        // Add to document head
        document.head.appendChild(script);
    }

    // Initialize when DOM is ready
    function initialize() {
        function kickoff() {
            loadHeaderWithMobileMenu();
            setupBeardedDragonImageCredits();
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', kickoff);
        } else {
            kickoff();
        }
    }

    // Auto-initialize
    initialize();
    
    // Make functions available globally if needed
    window.initMobileMenu = initMobileMenu;
    window.loadHeaderWithMobileMenu = loadHeaderWithMobileMenu;
    window.loadFooter = loadFooter;
    
    // ================= Image Credits Injection =================
    function setupBeardedDragonImageCredits() {
        try {
            var CREDIT_HTML = 'ID <a href="https://www.dreamstime.com/royalty-free-stock-photography-bearded-dragon-image12284547">12284547<\/a> | <a href="https://www.dreamstime.com/photos-images/lizard.html">Lizard<\/a> © <a href="https://www.dreamstime.com/mgkuijpers_info">Matthijs Kuijpers<\/a> | <a href="https://www.dreamstime.com/stock-photos">Dreamstime.com<\/a>';
            var CREDIT_CLASS = 'rc-image-credit';

            function isTargetBeardedDragon(imgEl) {
                if (!imgEl || !(imgEl instanceof HTMLImageElement)) return false;
                var attrSrc = imgEl.getAttribute('src') || '';
                return attrSrc.indexOf('bearded drag trans bg.png') !== -1;
            }

            function ensureCreditFor(imgEl) {
                if (!isTargetBeardedDragon(imgEl)) return;
                if (imgEl.dataset && imgEl.dataset.rcCredited === 'true') return;
                var next = imgEl.nextElementSibling;
                if (next && next.classList && next.classList.contains(CREDIT_CLASS)) {
                    if (imgEl.dataset) imgEl.dataset.rcCredited = 'true';
                    return;
                }
                var credit = document.createElement('small');
                credit.className = CREDIT_CLASS;
                credit.style.display = 'block';
                credit.style.fontSize = '10px';
                credit.style.color = '#666';
                credit.style.marginTop = '4px';
                credit.innerHTML = CREDIT_HTML;
                if (imgEl.parentNode) {
                    imgEl.parentNode.insertBefore(credit, imgEl.nextSibling);
                    if (imgEl.dataset) imgEl.dataset.rcCredited = 'true';
                }
            }

            // Initial pass
            var imgs = document.images || [];
            for (var i = 0; i < imgs.length; i++) {
                ensureCreditFor(imgs[i]);
            }

            // Observe future additions
            var observer = new MutationObserver(function(mutations) {
                for (var m = 0; m < mutations.length; m++) {
                    var added = mutations[m].addedNodes || [];
                    for (var j = 0; j < added.length; j++) {
                        var node = added[j];
                        if (!node || node.nodeType !== 1) continue;
                        if (node.tagName === 'IMG') {
                            ensureCreditFor(node);
                        } else if (node.querySelectorAll) {
                            var nestedImgs = node.querySelectorAll('img');
                            for (var k = 0; k < nestedImgs.length; k++) {
                                ensureCreditFor(nestedImgs[k]);
                            }
                        }
                    }
                }
            });

            observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
        } catch (e) {
            console.error('Error setting up image credits:', e);
        }
    }

})();