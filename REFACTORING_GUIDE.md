# Enclosure Data Refactoring Guide

## Overview

This refactoring normalizes enclosure and animal data to use Excel files as the single source of truth. All product information (name, link, dimensions, material, price, lastUpdated) now comes from `Enclosure Products.xlsx`, and animal configurations reference enclosure IDs rather than duplicating product data.

## Architecture

### Data Flow

```
Excel Files (Source of Truth)
    ↓
Build Step (converts Excel → JSON)
    ↓
js/enclosure-data.js (normalized data structures)
    ↓
enclosure-builder.html (compatibility layer)
    ↓
UI Components (use normalized data)
```

### Key Files

1. **`types.ts`** - TypeScript type definitions (reference only)
2. **`js/enclosure-data.js`** - Normalized data structures and helper functions
3. **`enclosure-builder.html`** - Compatibility layer that builds `reptileData` from normalized data
4. **`js/enclosure-quiz.js`** - Updated to use normalized data

## Data Structures

### EnclosureProduct

Master data from `Enclosure Products.xlsx`:

```typescript
interface EnclosureProduct {
    id: string;                // Enclosure ID, e.g. '0000002'
    name: string;              // Product Name
    link: string;              // Link (only URL used)
    dimensions: string;        // e.g. "36\" x 18\" x 18\""
    material: string;
    price: number;
    lastUpdated: string;       // Date Product Last Updated
    show: boolean;             // derived from Show or Hide column
    image?: string;
    model?: { length: number; width: number; height: number };
    features?: string;
    enclosureType?: 'glass' | 'pvc' | 'glass-mesh' | string;
}
```

### AnimalConfig

Data from `Reptile Care Sheet.xlsx`:

```typescript
interface AnimalConfig {
    id: string;                // Animal ID, e.g. '0000004'
    slug: string;              // e.g. 'leopard-gecko'
    commonName: string;
    scientificName: string;
    pictureUrl: string;
    minSize: { length: number; width: number; height: number };
    recommendedSize: { length: number; width: number; height: number };
    temperature: { basking: string; cool: string };
    humidity: string;
    approvedEnclosureIds: string[];                // from Approved Enclosure IDs
    juvenileApprovedEnclosureIds?: string[];       // from Approved Enclosure IDs (Juvenile and Younger)
}
```

## Helper Functions

### `getApprovedEnclosuresForAnimal(animal, options)`

Returns approved enclosures for an animal, filtered by:
- Approved Enclosure IDs
- Show/Hide status (excludes hidden by default)

```javascript
const animal = window.getAnimalBySlug('leopard-gecko');
const enclosures = window.getApprovedEnclosuresForAnimal(animal);
// Returns only approved, visible enclosures
```

Options:
- `includeHidden: boolean` - Include hidden enclosures (default: false)
- `juvenile: boolean` - Use juvenile-approved IDs (default: false)

### `getEnclosureById(enclosureId)`

Get a single enclosure by ID:

```javascript
const enclosure = window.getEnclosureById('0000002');
```

### `getAnimalBySlug(slug)`

Get animal configuration by slug:

```javascript
const animal = window.getAnimalBySlug('leopard-gecko');
```

## Example: Leopard Gecko

### Before (Hard-coded)

```javascript
'leopard-gecko': {
    name: 'Leopard Gecko',
    enclosures: [
        {
            id: 'lg-reptizoo',
            name: 'REPTIZOO 50 Gallon Glass Terrarium',
            dimensions: '36" x 18" x 18"',
            material: 'Tempered Glass',
            price: 192.47,
            amazonUrl: 'https://www.amazon.com/...',
            isPremium: true  // ❌ Removed
        }
    ]
}
```

### After (Normalized)

**Animal Config:**
```javascript
'leopard-gecko': {
    id: '0000001',
    slug: 'leopard-gecko',
    commonName: 'Leopard Gecko',
    approvedEnclosureIds: ['0000002', '0000003', '0000004']
}
```

**Enclosure Data (in ENCLOSURES_BY_ID):**
```javascript
'0000002': {
    id: '0000002',
    name: 'REPTIZOO 50 Gallon Glass Terrarium',
    link: 'https://www.amazon.com/...',
    dimensions: '36" x 18" x 18"',
    material: 'Tempered Glass',
    price: 192.47,
    show: true
}
```

**Usage in UI:**
```javascript
const animal = window.getAnimalBySlug('leopard-gecko');
const enclosures = window.getApprovedEnclosuresForAnimal(animal);
// Returns only approved, visible enclosures
```

## Business Rules

1. **Show/Hide Filtering**: Enclosures with `show: false` are excluded by default
2. **Approved IDs Only**: Only enclosures listed in `approvedEnclosureIds` appear for each animal
3. **No Duplication**: Product data (name, link, dimensions, material, price) comes only from `ENCLOSURES_BY_ID`
4. **No isPremium**: This field has been completely removed

## Migration Checklist

- [x] Create TypeScript type definitions
- [x] Create normalized data structures (`ENCLOSURES_BY_ID`, `ANIMALS_BY_SLUG`)
- [x] Create helper functions
- [x] Build compatibility layer in `enclosure-builder.html`
- [x] Update `enclosure-quiz.js` to use normalized data
- [x] Remove all `isPremium` references
- [ ] Create Excel → JSON conversion script
- [ ] Populate `ENCLOSURES_BY_ID` with all enclosures from Excel
- [ ] Populate `ANIMALS_BY_SLUG` with all animals from Excel
- [ ] Test all UI components
- [ ] Remove compatibility layer (optional, if all code updated)

## Next Steps

1. **Create Excel → JSON Converter**: Build a script that reads the Excel files and generates the data structures
2. **Populate Data**: Run the converter to populate `ENCLOSURES_BY_ID` and `ANIMALS_BY_SLUG`
3. **Update All References**: Ensure all code uses the helper functions instead of direct access
4. **Remove Compatibility Layer**: Once all code is updated, remove the `buildReptileData()` function

## Notes

- The compatibility layer (`buildReptileData()`) maintains backward compatibility with existing code
- Enclosures are automatically filtered by `show` status and approved IDs
- The `link` field is used for all URLs (no separate `amazonUrl`/`productUrl` in normalized data)
- The compatibility layer converts `link` to `amazonUrl` or `productUrl` based on URL pattern

