// Enclosure Builder Quiz State Management
// This file manages the quiz-style step-by-step flow for the enclosure builder
//
// URL Parameter Detection:
// - The quiz detects if a user came from a care guide page via URL parameters
// - Supported parameters: ?reptile=<animal-id> or ?animal=<animal-id>
// - Example: enclosure-builder.html?reptile=leopard-gecko
// - If detected, Step 1 shows a confirmation question instead of selection
// - The animal ID must exist in window.reptileData to be valid

class EnclosureBuilderQuiz {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.quizState = {
            animal: null,
            enclosureType: null,
            selectedEnclosure: null,
            selectedDecor: [],
            recommendedSubstrate: null,
            recommendedPlants: []
        };
        
        // Decor categories for Step 3
        this.decorCategories = {
            hides: [],
            climbing: [],
            backgrounds: [],
            waterBowl: [],
            foodBowl: [],
            other: []
        };
        
        // Initialize quiz
        this.init();
    }
    
    init() {
        // Check for animal from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const animalParam = urlParams.get('reptile') || urlParams.get('animal');
        
        if (animalParam && this.isValidAnimal(animalParam)) {
            this.quizState.animal = animalParam;
            // Show confirmation step instead of selection
            this.showAnimalConfirmation(animalParam);
        }
        
        this.renderCurrentStep();
        this.setupEventListeners();
    }
    
    isValidAnimal(animalId) {
        // Check if animal exists in reptileData
        return window.reptileData && window.reptileData[animalId];
    }
    
    showAnimalConfirmation(animalId) {
        // This will be handled in the step rendering
        this.animalFromUrl = animalId;
    }
    
    setupEventListeners() {
        // Navigation buttons
        const nextBtn = document.getElementById('quiz-next');
        const backBtn = document.getElementById('quiz-back');
        const finishBtn = document.getElementById('quiz-finish');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.previousStep());
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishQuiz());
        }
    }
    
    renderCurrentStep() {
        // Update progress indicator
        this.updateProgressIndicator();
        
        // Hide all steps
        document.querySelectorAll('.quiz-step').forEach(step => {
            step.style.display = 'none';
        });
        
        // Show current step
        const currentStepElement = document.getElementById(`quiz-step-${this.currentStep}`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
        }
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Render step-specific content
        switch(this.currentStep) {
            case 1:
                this.renderStep1();
                break;
            case 2:
                this.renderStep2();
                break;
            case 3:
                this.renderStep3();
                break;
            case 4:
                this.renderStep4();
                break;
        }
    }
    
    updateProgressIndicator() {
        const progressBar = document.getElementById('quiz-progress-bar');
        const progressText = document.getElementById('quiz-progress-text');
        
        if (progressBar) {
            const progress = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }
    }
    
    updateNavigationButtons() {
        const backBtn = document.getElementById('quiz-back');
        const nextBtn = document.getElementById('quiz-next');
        const finishBtn = document.getElementById('quiz-finish');
        
        // Back button
        if (backBtn) {
            backBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        }
        
        // Next/Finish buttons
        if (nextBtn && finishBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                finishBtn.style.display = 'block';
            } else {
                nextBtn.style.display = 'block';
                finishBtn.style.display = 'none';
                // Reset disabled state based on current step
                if (this.currentStep === 1 && !this.quizState.animal) {
                    nextBtn.disabled = true;
                    nextBtn.classList.remove('enabled');
                } else if (this.currentStep === 2 && !this.quizState.selectedEnclosure) {
                    nextBtn.disabled = true;
                    nextBtn.classList.remove('enabled');
                } else {
                    nextBtn.disabled = false;
                    nextBtn.classList.add('enabled');
                }
            }
        }
    }
    
    // Step 1: Animal Selection
    renderStep1() {
        const step1Container = document.getElementById('quiz-step-1-content');
        if (!step1Container) return;
        
        // If animal came from URL, show confirmation
        if (this.animalFromUrl) {
            const animalName = window.reptileData[this.animalFromUrl].name;
            step1Container.innerHTML = `
                <div class="quiz-question">
                    <h2>We detected you're building an enclosure for a ${animalName}.</h2>
                    <p>Is that correct?</p>
                </div>
                <div class="quiz-options">
                    <button class="quiz-option-btn primary" data-action="confirm-animal" data-animal="${this.animalFromUrl}">
                        Yes, continue
                    </button>
                    <button class="quiz-option-btn secondary" data-action="select-different-animal">
                        No, choose a different animal
                    </button>
                </div>
            `;
            
            // Setup event listeners for confirmation
            step1Container.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    if (action === 'confirm-animal') {
                        this.quizState.animal = e.target.dataset.animal;
                        this.animalFromUrl = null; // Clear flag
                        this.enableNextButton();
                        // Auto-advance after a brief delay to show confirmation
                        setTimeout(() => this.nextStep(), 300);
                    } else if (action === 'select-different-animal') {
                        this.animalFromUrl = null; // Clear flag
                        this.renderStep1(); // Re-render with selection
                    }
                });
            });
        } else {
            // Show animal selection
            step1Container.innerHTML = `
                <div class="quiz-question">
                    <h2>What animal are you building an enclosure for?</h2>
                </div>
                <div class="quiz-options animal-grid">
                    ${Object.keys(window.reptileData).map(animalId => {
                        const animal = window.reptileData[animalId];
                        return `
                            <button class="quiz-option-btn animal-option" data-animal="${animalId}">
                                <span class="animal-name">${animal.name}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
            
            // Setup event listeners for selection
            step1Container.querySelectorAll('.animal-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Remove previous selection
                    step1Container.querySelectorAll('.animal-option').forEach(b => {
                        b.classList.remove('selected');
                    });
                    
                    // Mark as selected
                    e.target.closest('.animal-option').classList.add('selected');
                    
                    // Store selection
                    this.quizState.animal = e.target.closest('.animal-option').dataset.animal;
                    
                    // Enable next button
                    this.enableNextButton();
                });
            });
        }
    }
    
    // Step 2: Enclosure Type Selection
    renderStep2() {
        const step2Container = document.getElementById('quiz-step-2-content');
        if (!step2Container || !this.quizState.animal) return;
        
        const animalData = window.reptileData[this.quizState.animal];
        const enclosures = animalData.enclosures || [];
        
        step2Container.innerHTML = `
            <div class="quiz-question">
                <h2>What type of enclosure do you want?</h2>
                <p>Select an enclosure size and style for your ${animalData.name}</p>
            </div>
            <div class="quiz-options enclosure-grid">
                ${enclosures.map(enclosure => `
                    <div class="quiz-option-card enclosure-option" data-enclosure-id="${enclosure.id}">
                        <div class="enclosure-image">
                            <img src="${enclosure.image}" alt="${enclosure.name}" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOGY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjI2IiBmaWxsPSIjOTk5Ij5JbWFnZTwvdGV4dD48L3N2Zz4='">
                        </div>
                        <div class="enclosure-details">
                            <h3>${enclosure.name}</h3>
                            <p class="enclosure-dimensions">${enclosure.dimensions}</p>
                            <p class="enclosure-material">${enclosure.material}</p>
                            ${enclosure.isPremium ? '<span class="premium-badge">⭐ Premium</span>' : ''}
                            <p class="enclosure-price">$${enclosure.price.toFixed(2)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Setup event listeners
        step2Container.querySelectorAll('.enclosure-option').forEach(card => {
            card.addEventListener('click', (e) => {
                // Remove previous selection
                step2Container.querySelectorAll('.enclosure-option').forEach(c => {
                    c.classList.remove('selected');
                });
                
                // Mark as selected
                card.classList.add('selected');
                
                // Find enclosure data
                const enclosureId = card.dataset.enclosureId;
                const enclosure = enclosures.find(e => e.id === enclosureId);
                
                if (enclosure) {
                    this.quizState.selectedEnclosure = enclosure;
                    this.quizState.enclosureType = enclosure.id;
                    
                    // Update 3D enclosure
                    if (window.enclosureBuilder) {
                        window.enclosureBuilder.updateEnclosureDimensions(
                            enclosure.model.length,
                            enclosure.model.width,
                            enclosure.model.height,
                            enclosure
                        );
                    }
                    
                    // Enable next button
                    this.enableNextButton();
                }
            });
        });
    }
    
    enableNextButton() {
        const nextBtn = document.getElementById('quiz-next');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.classList.add('enabled');
        }
    }
    
    // Step 3: Decor Selection
    renderStep3() {
        const step3Container = document.getElementById('quiz-step-3-content');
        if (!step3Container || !this.quizState.animal) return;
        
        // Load decor items (we'll need to fetch from items.json or use predefined list)
        this.loadDecorItems();
        
        step3Container.innerHTML = `
            <div class="quiz-question">
                <h2>What decor would you like to include?</h2>
                <p>Select items to add to your enclosure. You can add multiple items from each category.</p>
            </div>
            
            <div class="decor-categories">
                <div class="decor-category">
                    <h3>Hides</h3>
                    <div class="decor-items" id="decor-hides"></div>
                </div>
                
                <div class="decor-category">
                    <h3>Climbing Branches / Ledges</h3>
                    <div class="decor-items" id="decor-climbing"></div>
                </div>
                
                <div class="decor-category">
                    <h3>Backgrounds</h3>
                    <div class="decor-items" id="decor-backgrounds"></div>
                </div>
                
                <div class="decor-category">
                    <h3>Water Bowl</h3>
                    <div class="decor-items" id="decor-water-bowl"></div>
                </div>
                
                <div class="decor-category">
                    <h3>Food Bowl</h3>
                    <div class="decor-items" id="decor-food-bowl"></div>
                </div>
                
                <div class="decor-category">
                    <h3>Other Decor</h3>
                    <div class="decor-items" id="decor-other"></div>
                </div>
            </div>
            
            <div class="quiz-validation-warnings" id="quiz-warnings"></div>
        `;
        
        // Render decor items
        this.renderDecorItems();
    }
    
    loadDecorItems() {
        // Define decor items (can be loaded from items.json or hardcoded)
        this.decorCategories.hides = [
            { id: 'hide-001', name: 'Cave Hide', price: 14.99, category: 'hides' },
            { id: 'hide-002', name: 'Cork Bark', price: 12.99, category: 'hides' }
        ];
        
        this.decorCategories.climbing = [
            { id: 'climb-001', name: 'Wood Branch', price: 19.99, category: 'climbing' },
            { id: 'climb-002', name: 'Climbing Ledge', price: 24.99, category: 'climbing' }
        ];
        
        this.decorCategories.backgrounds = [
            { id: 'bg-001', name: '3D Background Wall', price: 34.99, category: 'backgrounds' }
        ];
        
        this.decorCategories.waterBowl = [
            { id: 'water-001', name: 'Water Bowl', price: 9.99, category: 'waterBowl' }
        ];
        
        this.decorCategories.foodBowl = [
            { id: 'food-001', name: 'Food Bowl', price: 8.99, category: 'foodBowl' }
        ];
        
        this.decorCategories.other = [
            { id: 'dec-001', name: 'Rock Formation', price: 29.99, category: 'other' }
        ];
    }
    
    renderDecorItems() {
        // Render each category
        Object.keys(this.decorCategories).forEach(categoryKey => {
            const container = document.getElementById(`decor-${categoryKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            if (!container) return;
            
            const items = this.decorCategories[categoryKey];
            container.innerHTML = items.map(item => {
                const isSelected = this.quizState.selectedDecor.some(d => d.id === item.id);
                return `
                    <div class="decor-item ${isSelected ? 'selected' : ''}" data-item-id="${item.id}" data-category="${categoryKey}">
                        <div class="decor-item-content">
                            <h4>${item.name}</h4>
                            <p class="decor-price">$${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click listeners
            container.querySelectorAll('.decor-item').forEach(itemEl => {
                itemEl.addEventListener('click', () => {
                    const itemId = itemEl.dataset.itemId;
                    const category = itemEl.dataset.category;
                    const item = this.decorCategories[category].find(i => i.id === itemId);
                    
                    if (item) {
                        this.toggleDecorItem(item);
                        this.renderDecorItems(); // Re-render to update selection
                        this.validateDecorSelection(); // Check for warnings
                    }
                });
            });
        });
    }
    
    toggleDecorItem(item) {
        // Quiz State to 3D Enclosure Mapping:
        // - When decor items are selected/deselected, they are added/removed from quizState.selectedDecor
        // - The 3D enclosure is updated in real-time via window.enclosureBuilder.addItem() / removeItem()
        // - Enclosure dimensions are updated in Step 2 via updateEnclosureDimensions()
        // - All quiz state changes immediately reflect in the 3D preview below
        
        const index = this.quizState.selectedDecor.findIndex(d => d.id === item.id);
        if (index >= 0) {
            // Remove item
            this.quizState.selectedDecor.splice(index, 1);
            
            // Remove from 3D scene
            if (window.enclosureBuilder) {
                window.enclosureBuilder.removeItem(item.id);
            }
        } else {
            // Add item
            this.quizState.selectedDecor.push(item);
            
            // Add to 3D scene
            if (window.enclosureBuilder) {
                window.enclosureBuilder.addItem({
                    ...item,
                    dimensions: { length: 4, width: 4, height: 2 } // Default dimensions
                });
            }
        }
    }
    
    validateDecorSelection() {
        // Validation Reminders Implementation:
        // - This method checks for recommended items (water bowl, food bowl, hides)
        // - Warnings are displayed as non-blocking recommendations in #quiz-warnings
        // - Users can proceed even if recommendations aren't met
        // - Warnings appear as yellow alert boxes with specific messages
        const warningsContainer = document.getElementById('quiz-warnings');
        if (!warningsContainer) return;
        
        const warnings = [];
        const selectedIds = this.quizState.selectedDecor.map(d => d.id);
        
        // Check for water bowl
        const hasWaterBowl = this.decorCategories.waterBowl.some(item => selectedIds.includes(item.id));
        if (!hasWaterBowl) {
            warnings.push('We recommend adding a water bowl.');
        }
        
        // Check for food bowl
        const hasFoodBowl = this.decorCategories.foodBowl.some(item => selectedIds.includes(item.id));
        if (!hasFoodBowl) {
            warnings.push('We recommend adding a food bowl.');
        }
        
        // Check for hides (at least 2 for most animals)
        const hideCount = this.decorCategories.hides.filter(item => selectedIds.includes(item.id)).length;
        if (hideCount < 2) {
            warnings.push('We recommend at least two hides (warm hide and cool hide).');
        }
        
        // Display warnings
        if (warnings.length > 0) {
            warningsContainer.innerHTML = `
                <div class="validation-warning">
                    <strong>Recommendations:</strong>
                    <ul>
                        ${warnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            `;
            warningsContainer.style.display = 'block';
        } else {
            warningsContainer.style.display = 'none';
        }
    }
    
    // Step 4: Plants & Substrate Recommendations
    renderStep4() {
        const step4Container = document.getElementById('quiz-step-4-content');
        if (!step4Container || !this.quizState.animal) return;
        
        // Generate recommendations based on animal
        this.generateRecommendations();
        
        const animalData = window.reptileData[this.quizState.animal];
        
        step4Container.innerHTML = `
            <div class="quiz-question">
                <h2>Our Recommended Setup</h2>
                <p>Based on your ${animalData.name} and enclosure selection, here's what we recommend:</p>
            </div>
            
            <div class="recommendations-summary">
                <div class="recommendation-section">
                    <h3>Selected Decor</h3>
                    <ul class="recommendation-list">
                        ${this.quizState.selectedDecor.map(item => `
                            <li>${item.name} - $${item.price.toFixed(2)}</li>
                        `).join('')}
                        ${this.quizState.selectedDecor.length === 0 ? '<li>No decor selected</li>' : ''}
                    </ul>
                </div>
                
                <div class="recommendation-section">
                    <h3>Recommended Substrate</h3>
                    <ul class="recommendation-list">
                        ${this.quizState.recommendedSubstrate ? `
                            <li>${this.quizState.recommendedSubstrate.name} - $${this.quizState.recommendedSubstrate.price.toFixed(2)}</li>
                        ` : '<li>No substrate recommendation</li>'}
                    </ul>
                </div>
                
                <div class="recommendation-section">
                    <h3>Recommended Plants</h3>
                    <ul class="recommendation-list">
                        ${this.quizState.recommendedPlants.map(plant => `
                            <li>${plant.name} - $${plant.price.toFixed(2)}</li>
                        `).join('')}
                        ${this.quizState.recommendedPlants.length === 0 ? '<li>No plants recommended</li>' : ''}
                    </ul>
                </div>
            </div>
            
            <div class="final-enclosure-preview">
                <p class="preview-note">Your final enclosure configuration is shown in the 3D preview above.</p>
            </div>
        `;
    }
    
    generateRecommendations() {
        const animalId = this.quizState.animal;
        
        // Substrate recommendations based on animal
        const substrateMap = {
            'leopard-gecko': { name: 'Reptile Carpet', price: 19.99 },
            'bearded-dragon': { name: 'Natural Slate Tile', price: 24.99 },
            'crested-gecko': { name: 'Eco Earth Coconut Fiber', price: 14.99 },
            'eastern-collared-lizard': { name: 'Natural Slate Tile', price: 24.99 }
        };
        
        this.quizState.recommendedSubstrate = substrateMap[animalId] || null;
        
        // Plant recommendations
        const plantMap = {
            'leopard-gecko': [
                { name: 'Artificial Succulent', price: 9.99 }
            ],
            'bearded-dragon': [
                { name: 'Artificial Succulent', price: 9.99 }
            ],
            'crested-gecko': [
                { name: 'Hanging Vine', price: 14.99 },
                { name: 'Artificial Succulent', price: 9.99 }
            ],
            'eastern-collared-lizard': [
                { name: 'Artificial Succulent', price: 9.99 }
            ]
        };
        
        this.quizState.recommendedPlants = plantMap[animalId] || [];
    }
    
    nextStep() {
        // Validate current step before proceeding
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.renderCurrentStep();
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.renderCurrentStep();
        }
    }
    
    validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                if (!this.quizState.animal) {
                    alert('Please select an animal to continue.');
                    return false;
                }
                break;
            case 2:
                if (!this.quizState.selectedEnclosure) {
                    alert('Please select an enclosure to continue.');
                    return false;
                }
                break;
            case 3:
                // Decor is optional, but show warnings
                this.validateDecorSelection();
                break;
        }
        return true;
    }
    
    finishQuiz() {
        // Final validation
        if (!this.validateCurrentStep()) {
            return;
        }
        
        // Show completion message or redirect
        alert('Enclosure design complete! You can now save or share your design.');
        
        // Optionally, you could save the design or show a summary
        console.log('Quiz completed:', this.quizState);
    }
}

// Initialize quiz when DOM is ready and reptileData is available
function initializeQuiz() {
    if (window.reptileData && document.getElementById('quiz-step-1')) {
        window.enclosureBuilderQuiz = new EnclosureBuilderQuiz();
    } else {
        // Retry after a short delay if reptileData isn't ready yet
        setTimeout(initializeQuiz, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeQuiz();
});

