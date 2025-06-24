/**
 * Optimized Model Loader for Pre-Generated Enclosure Models
 * Replaces procedural generation with fast .glb loading
 */

class OptimizedModelLoader {
    constructor() {
        this.loader = new THREE.GLTFLoader();
        this.loadedModels = new Map(); // Cache for loaded models
        this.loadingPromises = new Map(); // Track ongoing loads
        
        // Enable Draco compression support if available
        if (THREE.DRACOLoader) {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
            this.loader.setDRACOLoader(dracoLoader);
        }
    }

    /**
     * Load a pre-generated model with caching
     * @param {string} modelPath - Path to the .glb file
     * @param {string} modelId - Unique identifier for caching
     * @returns {Promise<THREE.Group>} - Promise resolving to the loaded model
     */
    async loadModel(modelPath, modelId) {
        // Return cached model if available
        if (this.loadedModels.has(modelId)) {
            return this.loadedModels.get(modelId).clone();
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(modelId)) {
            const cachedModel = await this.loadingPromises.get(modelId);
            return cachedModel.clone();
        }

        // Start new loading process
        console.log(`📦 Loading optimized model: ${modelId}`);
        const loadingPromise = new Promise((resolve, reject) => {
            this.loader.load(
                modelPath,
                (gltf) => {
                    console.log(`✅ Model loaded successfully: ${modelId}`);
                    
                    // Store original in cache
                    this.loadedModels.set(modelId, gltf.scene);
                    this.loadingPromises.delete(modelId);
                    
                    // Return clone for use
                    resolve(gltf.scene.clone());
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`📊 Loading ${modelId}: ${percent}%`);
                },
                (error) => {
                    console.error(`❌ Failed to load model ${modelId}:`, error);
                    this.loadingPromises.delete(modelId);
                    reject(error);
                }
            );
        });

        this.loadingPromises.set(modelId, loadingPromise);
        return loadingPromise;
    }

    /**
     * Get model configuration for different enclosure types
     */
    getModelConfig(enclosureData) {
        const config = {
            modelPath: null,
            modelId: null,
            fallbackToProceduralHorror: false
        };

        // Check for PVC enclosures first
        if (enclosureData.enclosureType === 'pvc' || 
            enclosureData.material?.toLowerCase().includes('pvc')) {
            
            // PVC 50 gallon (36x18x18)
            if (enclosureData.model?.length === 36 && 
                enclosureData.model?.width === 18 && 
                enclosureData.model?.height === 18) {
                config.modelPath = 'models/pvc_50gal_optimized.glb';
                config.modelId = 'pvc_50gal';
                return config;
            }
        }

        // Check for REPTIZOO models
        if (enclosureData.id?.includes('reptizoo')) {
            // Could add REPTIZOO models here in the future
            config.fallbackToProcedural = true;
            return config;
        }

        // Default fallback to procedural generation
        config.fallbackToProcedural = true;
        return config;
    }

    /**
     * Clear cache to free memory
     */
    clearCache() {
        console.log('🧹 Clearing model cache...');
        this.loadedModels.clear();
        this.loadingPromises.clear();
    }

    /**
     * Preload commonly used models
     */
    async preloadCommonModels() {
        const commonModels = [
            {
                path: 'models/pvc_50gal_optimized.glb',
                id: 'pvc_50gal'
            }
            // Add more common models here
        ];

        console.log('🚀 Preloading common models...');
        
        const preloadPromises = commonModels.map(model => {
            return this.loadModel(model.path, model.id).catch(error => {
                console.warn(`⚠️ Failed to preload ${model.id}:`, error);
                return null;
            });
        });

        try {
            await Promise.all(preloadPromises);
            console.log('✅ Common models preloaded successfully');
        } catch (error) {
            console.warn('⚠️ Some models failed to preload:', error);
        }
    }
}

// Export for use in enclosure-builder.js
window.OptimizedModelLoader = OptimizedModelLoader; 