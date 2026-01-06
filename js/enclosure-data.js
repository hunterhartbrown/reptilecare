/**
 * Normalized Enclosure and Animal Data
 * 
 * This file contains the master data structures for enclosures and animals.
 * Data should be populated from Excel files via a build step that converts
 * Excel to JSON, then imports it here.
 * 
 * @typedef {Object} EnclosureProduct
 * @property {string} id - Enclosure ID (6-digit string like '0000002')
 * @property {string} name - Product Name
 * @property {string} link - Link (the only URL that should be used)
 * @property {string} dimensions - Dimensions (e.g., "36\" x 18\" x 18\"")
 * @property {string} material - Material
 * @property {number} price - Price
 * @property {string} lastUpdated - Date Product Last Updated (ISO string)
 * @property {boolean} show - Whether to show this enclosure (derived from Show or Hide column)
 * @property {string} [image] - Image path
 * @property {{length: number, width: number, height: number}} [model] - 3D model dimensions
 * @property {string} [features] - Features description
 * @property {'glass'|'pvc'|'glass-mesh'|string} [enclosureType] - Enclosure type
 * 
 * @typedef {Object} AnimalConfig
 * @property {string} id - Animal ID (e.g., '0000004')
 * @property {string} slug - URL slug (e.g., 'leopard-gecko')
 * @property {string} commonName - Common Name
 * @property {string} scientificName - Scientific Name
 * @property {string} pictureUrl - Picture URL
 * @property {{length: number, width: number, height: number}} minSize - Minimum enclosure size
 * @property {{length: number, width: number, height: number}} recommendedSize - Recommended enclosure size
 * @property {{basking: string, cool: string}} temperature - Temperature requirements
 * @property {string} humidity - Humidity requirement
 * @property {string[]} approvedEnclosureIds - Approved Enclosure IDs
 * @property {string[]} [juvenileApprovedEnclosureIds] - Approved Enclosure IDs for Juvenile and Younger
 */

/**
 * Master dictionary of all enclosures keyed by Enclosure ID
 * Populated from Enclosure Products.xlsx
 * 
 * @type {Record<string, EnclosureProduct>}
 */
const ENCLOSURES_BY_ID = {
    // Example data - replace with actual data from Excel conversion
    '0000002': {
        id: '0000002',
        name: 'REPTIZOO 50 Gallon Glass Terrarium',
        link: 'https://www.amazon.com/REPTIZOO-Reptile-Terrarium-Ventilation-Knock-Down/dp/B07CV797LC?&linkCode=ll1&tag=reptilecare09-20&linkId=454fa634ebf8d246c9461011b8714fc6&language=en_US&ref_=as_li_ss_tl',
        dimensions: '36" x 18" x 18"',
        material: 'Tempered Glass',
        price: 192.47,
        lastUpdated: '2025-11-20',
        show: true,
        image: 'images/enclosures/reptizoo 50 gallon glass.png',
        model: { length: 36, width: 18, height: 18 },
        features: 'Double hinge doors, screen ventilation, aluminum frame, knock-down assembly',
        enclosureType: 'glass'
    },
    '0000003': {
        id: '0000003',
        name: 'REPTIZOO 40 Gallon Glass Terrarium',
        link: 'https://www.wayfair.com/pet/pdp/reptizoo-36-x-16-x-18-reptile-terrarium-rptz1194.html',
        dimensions: '36" x 16" x 18"',
        material: 'Tempered Glass',
        price: 159.99,
        lastUpdated: '2025-11-20',
        show: true,
        image: 'images/enclosures/40 gallon 36 x 16 x 18 reptizoo.png',
        model: { length: 36, width: 16, height: 18 },
        features: 'Double hinge doors, screen ventilation, aluminum frame, knock-down assembly',
        enclosureType: 'glass'
    },
    '0000004': {
        id: '0000004',
        name: 'Dubia.com 50 Gallon PVC Panel Enclosure',
        link: 'https://dubiaroaches.com/products/36x18x18-pvc-panel-reptile-enclosure',
        dimensions: '36" x 18" x 18"',
        material: 'PVC Panels with Aluminum Frame',
        price: 200.00,
        lastUpdated: '2025-11-20',
        show: true,
        image: 'images/enclosures/dubia 50 gallon pvc.png',
        model: { length: 36, width: 18, height: 18 },
        features: 'Sliding glass doors, acrylic front panel, heavy-duty screen top, humidity resistant',
        enclosureType: 'pvc'
    },
    '0000005': {
        id: '0000005',
        name: 'NEPTONION 32 Gallon Professional Glass Terrarium',
        link: 'https://amzn.to/4o8mtc5',
        dimensions: '18" x 18" x 24"',
        material: 'Tempered Glass',
        price: 188.99,
        lastUpdated: '2025-11-20',
        show: true,
        image: 'images/enclosures/NEPTONION 32 Gallon 18 x 18 x 24 glass.png',
        model: { length: 18, width: 18, height: 24 },
        features: 'Dual front swinging doors, aluminum alloy frame, mesh top, knockdown assembly, waterproof, cord management',
        enclosureType: 'glass-mesh'
    }
    // Add more enclosures as they're converted from Excel
};

/**
 * Master dictionary of all animals keyed by slug
 * Populated from Reptile Care Sheet.xlsx
 * 
 * @type {Record<string, AnimalConfig>}
 */
const ANIMALS_BY_SLUG = {
    'leopard-gecko': {
        id: '0000001',
        slug: 'leopard-gecko',
        commonName: 'Leopard Gecko',
        scientificName: 'Eublepharis macularius',
        pictureUrl: 'images/animals/leopard gecko.png',
        minSize: { length: 36, width: 18, height: 18 },
        recommendedSize: { length: 36, width: 18, height: 18 },
        temperature: { basking: '82-86°F', cool: '75-79°F' },
        humidity: '30-40%',
        approvedEnclosureIds: ['0000002', '0000003', '0000004'],
        juvenileApprovedEnclosureIds: []
    },
    'bearded-dragon': {
        id: '0000002',
        slug: 'bearded-dragon',
        commonName: 'Bearded Dragon',
        scientificName: 'Pogona vitticeps',
        pictureUrl: 'images/animals/bearded dragon.png',
        minSize: { length: 36, width: 18, height: 18 },
        recommendedSize: { length: 48, width: 24, height: 24 },
        temperature: { basking: '95-105°F', cool: '75-85°F' },
        humidity: '30-40%',
        approvedEnclosureIds: ['0000002', '0000004'],
        juvenileApprovedEnclosureIds: []
    },
    'crested-gecko': {
        id: '0000003',
        slug: 'crested-gecko',
        commonName: 'Crested Gecko',
        scientificName: 'Correlophus ciliatus',
        pictureUrl: 'images/animals/eyelash crested gecko.png',
        minSize: { length: 18, width: 18, height: 24 },
        recommendedSize: { length: 24, width: 18, height: 36 },
        temperature: { basking: '72-78°F', cool: '72-78°F' },
        humidity: '60-70%',
        approvedEnclosureIds: ['0000005', '0000002'],
        juvenileApprovedEnclosureIds: []
    },
    // Add more animals as they're converted from Excel
};

/**
 * Get approved enclosures for an animal
 * 
 * Filters enclosures based on:
 * - Approved Enclosure IDs for the animal
 * - Show/Hide status (excludes hidden enclosures by default)
 * 
 * @param {AnimalConfig} animal - The animal configuration
 * @param {Object} [options] - Options
 * @param {boolean} [options.includeHidden=false] - Whether to include hidden enclosures
 * @param {boolean} [options.juvenile=false] - Whether to use juvenile-approved IDs
 * @returns {EnclosureProduct[]} Array of approved enclosures
 */
function getApprovedEnclosuresForAnimal(animal, options = {}) {
    const { includeHidden = false, juvenile = false } = options;
    
    // Get the appropriate list of approved IDs
    const approvedIds = juvenile && animal.juvenileApprovedEnclosureIds
        ? animal.juvenileApprovedEnclosureIds
        : animal.approvedEnclosureIds || [];
    
    // Map IDs to enclosures and filter
    return approvedIds
        .map(id => ENCLOSURES_BY_ID[id])
        .filter(enclosure => {
            // Skip if enclosure doesn't exist
            if (!enclosure) return false;
            
            // Filter out hidden enclosures unless includeHidden is true
            if (!includeHidden && !enclosure.show) return false;
            
            return true;
        });
}

/**
 * Get enclosure by ID
 * 
 * @param {string} enclosureId - The enclosure ID
 * @returns {EnclosureProduct|undefined} The enclosure or undefined if not found
 */
function getEnclosureById(enclosureId) {
    return ENCLOSURES_BY_ID[enclosureId];
}

/**
 * Get animal by slug
 * 
 * @param {string} slug - The animal slug
 * @returns {AnimalConfig|undefined} The animal config or undefined if not found
 */
function getAnimalBySlug(slug) {
    return ANIMALS_BY_SLUG[slug];
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ENCLOSURES_BY_ID = ENCLOSURES_BY_ID;
    window.ANIMALS_BY_SLUG = ANIMALS_BY_SLUG;
    window.getApprovedEnclosuresForAnimal = getApprovedEnclosuresForAnimal;
    window.getEnclosureById = getEnclosureById;
    window.getAnimalBySlug = getAnimalBySlug;
    
    // Trigger reptileData initialization if the function exists
    if (typeof window.initializeReptileData === 'function') {
        window.initializeReptileData();
    }
}

// For Node.js/ES modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ENCLOSURES_BY_ID,
        ANIMALS_BY_SLUG,
        getApprovedEnclosuresForAnimal,
        getEnclosureById,
        getAnimalBySlug
    };
}

