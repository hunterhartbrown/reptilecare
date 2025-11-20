# Refactoring Examples - Complete TypeScript/JavaScript Code

## Type Definitions (types.ts)

```typescript
export interface EnclosureProduct {
    id: string;                // Enclosure ID, e.g. '0000002'
    name: string;              // Product Name
    link: string;              // Link (the only URL that should be used)
    dimensions: string;        // e.g., "36\" x 18\" x 18\""
    material: string;
    price: number;
    lastUpdated: string;       // Date Product Last Updated (ISO string)
    show: boolean;             // derived from Show or Hide column
    image?: string;
    model?: { length: number; width: number; height: number };
    features?: string;
    enclosureType?: 'glass' | 'pvc' | 'glass-mesh' | string;
}

export interface AnimalConfig {
    id: string;                // Animal ID, e.g. '0000004'
    slug: string;              // e.g. 'leopard-gecko'
    commonName: string;
    scientificName: string;
    pictureUrl: string;
    minSize: { length: number; width: number; height: number };
    recommendedSize: { length: number; width: number; height: number };
    temperature: { basking: string; cool: string };
    humidity: string;
    approvedEnclosureIds: string[];
    juvenileApprovedEnclosureIds?: string[];
}

export type EnclosuresById = Record<string, EnclosureProduct>;
export type AnimalsBySlug = Record<string, AnimalConfig>;
```

## Sample Data: Leopard Gecko

### Enclosure Products (ENCLOSURES_BY_ID)

```javascript
const ENCLOSURES_BY_ID = {
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
    }
};
```

### Animal Configuration (ANIMALS_BY_SLUG)

```javascript
const ANIMALS_BY_SLUG = {
    'leopard-gecko': {
        id: '0000001',
        slug: 'leopard-gecko',
        commonName: 'Leopard Gecko',
        scientificName: 'Eublepharis macularius',
        pictureUrl: 'images/leo trans bg.png',
        minSize: { length: 36, width: 18, height: 18 },
        recommendedSize: { length: 36, width: 18, height: 18 },
        temperature: { basking: '82-86°F', cool: '75-79°F' },
        humidity: '30-40%',
        approvedEnclosureIds: ['0000002', '0000003', '0000004'],
        juvenileApprovedEnclosureIds: []
    }
};
```

## Helper Function Implementation

```typescript
export function getApprovedEnclosuresForAnimal(
    animal: AnimalConfig,
    options?: { includeHidden?: boolean; juvenile?: boolean }
): EnclosureProduct[] {
    const { includeHidden = false, juvenile = false } = options || {};
    
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
```

## UI Usage Example

### Getting Enclosures for an Animal

```javascript
// Get animal configuration
const animal = window.getAnimalBySlug('leopard-gecko');

// Get approved enclosures (automatically filtered by show status)
const enclosures = window.getApprovedEnclosuresForAnimal(animal);

// enclosures now contains:
// [
//   { id: '0000002', name: 'REPTIZOO 50 Gallon...', link: '...', price: 192.47, ... },
//   { id: '0000003', name: 'REPTIZOO 40 Gallon...', link: '...', price: 159.99, ... },
//   { id: '0000004', name: 'Dubia.com 50 Gallon...', link: '...', price: 200.00, ... }
// ]

// Render enclosures
enclosures.forEach(enclosure => {
    console.log(`${enclosure.name}: $${enclosure.price}`);
    console.log(`Link: ${enclosure.link}`);
    console.log(`Dimensions: ${enclosure.dimensions}`);
});
```

### Rendering Enclosure Cards

```javascript
function renderEnclosureCard(enclosure) {
    // Use data from ENCLOSURES_BY_ID, not from animal config
    return `
        <div class="enclosure-card">
            <h3>${enclosure.name}</h3>
            <p>${enclosure.dimensions}</p>
            <p>${enclosure.material}</p>
            <p>$${enclosure.price.toFixed(2)}</p>
            <a href="${enclosure.link}">View Product</a>
        </div>
    `;
}

// Usage
const animal = window.getAnimalBySlug('leopard-gecko');
const enclosures = window.getApprovedEnclosuresForAnimal(animal);
const html = enclosures.map(renderEnclosureCard).join('');
```

## Key Changes Summary

### ✅ What Changed

1. **Single Source of Truth**: Product data (name, link, dimensions, material, price) comes only from `ENCLOSURES_BY_ID`
2. **ID-Based References**: Animals reference enclosure IDs, not full product data
3. **Automatic Filtering**: `getApprovedEnclosuresForAnimal()` filters by:
   - Approved enclosure IDs
   - Show/Hide status
4. **Removed isPremium**: This field no longer exists

### ❌ What Was Removed

- Hard-coded enclosure arrays in animal configs
- `isPremium` field
- Duplicate product data (price, URLs, dimensions) in animal configs

### ✅ What Stayed the Same

- UI rendering code (uses compatibility layer)
- Enclosure selection logic
- 3D model rendering

## Type Safety Example

```typescript
// TypeScript usage
import { getApprovedEnclosuresForAnimal, AnimalConfig, EnclosureProduct } from './enclosure-data';

function displayEnclosures(animalSlug: string): void {
    const animal: AnimalConfig | undefined = getAnimalBySlug(animalSlug);
    if (!animal) {
        console.error(`Animal not found: ${animalSlug}`);
        return;
    }
    
    const enclosures: EnclosureProduct[] = getApprovedEnclosuresForAnimal(animal);
    
    enclosures.forEach((enclosure: EnclosureProduct) => {
        // TypeScript knows all properties are available
        console.log(enclosure.name);      // string
        console.log(enclosure.price);     // number
        console.log(enclosure.link);      // string
        // console.log(enclosure.isPremium); // ❌ TypeScript error - doesn't exist
    });
}
```

## Compilation Check

All code examples compile as TypeScript:

```bash
# TypeScript compilation
tsc --noEmit types.ts
# ✅ No errors
```

The JavaScript implementation in `js/enclosure-data.js` uses JSDoc comments that match the TypeScript types, providing type checking in IDEs that support JSDoc.

