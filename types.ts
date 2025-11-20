/**
 * TypeScript Type Definitions for Reptile Care Website
 * 
 * These types define the normalized data structure for enclosures and animals.
 * The actual implementation uses JavaScript with JSDoc comments matching these types.
 */

/**
 * Enclosure Product - Master data from Enclosure Products.xlsx
 */
export interface EnclosureProduct {
    /** Enclosure ID (6-digit string like '0000002') */
    id: string;
    
    /** Product Name */
    name: string;
    
    /** Link - the only URL that should be used */
    link: string;
    
    /** Dimensions (e.g., "36\" x 18\" x 18\"") */
    dimensions: string;
    
    /** Material */
    material: string;
    
    /** Price */
    price: number;
    
    /** Date Product Last Updated (ISO string) */
    lastUpdated: string;
    
    /** Whether to show this enclosure (derived from Show or Hide column) */
    show: boolean;
    
    // Optional fields from existing code
    /** Image path */
    image?: string;
    
    /** 3D model dimensions */
    model?: {
        length: number;
        width: number;
        height: number;
    };
    
    /** Features description */
    features?: string;
    
    /** Enclosure type */
    enclosureType?: 'glass' | 'pvc' | 'glass-mesh' | string;
}

/**
 * Animal Configuration - Data from Reptile Care Sheet.xlsx
 */
export interface AnimalConfig {
    /** Animal ID (e.g., '0000004') */
    id: string;
    
    /** URL slug (e.g., 'leopard-gecko') */
    slug: string;
    
    /** Common Name */
    commonName: string;
    
    /** Scientific Name */
    scientificName: string;
    
    /** Picture URL */
    pictureUrl: string;
    
    /** Minimum enclosure size */
    minSize: {
        length: number;
        width: number;
        height: number;
    };
    
    /** Recommended enclosure size */
    recommendedSize: {
        length: number;
        width: number;
        height: number;
    };
    
    /** Temperature requirements */
    temperature: {
        basking: string;
        cool: string;
    };
    
    /** Humidity requirement */
    humidity: string;
    
    /** Approved Enclosure IDs (comma-separated list converted to array) */
    approvedEnclosureIds: string[];
    
    /** Approved Enclosure IDs for Juvenile and Younger (optional) */
    juvenileApprovedEnclosureIds?: string[];
}

/**
 * Dictionary of all enclosures keyed by Enclosure ID
 */
export type EnclosuresById = Record<string, EnclosureProduct>;

/**
 * Dictionary of all animals keyed by slug
 */
export type AnimalsBySlug = Record<string, AnimalConfig>;

