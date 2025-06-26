// 3D Model Loader Utility
// Handles loading and caching of pre-generated 3D enclosure models

class ModelLoader {
    constructor() {
        this.registry = null;
        this.loadedModels = new Map();
        this.loaders = {
            gltf: new THREE.GLTFLoader(),
            json: null // Will use fetch for JSON
        };
        
        this.loadRegistry();
    }
    
    async loadRegistry() {
        try {
            console.log('📋 Loading model registry...');
            const response = await fetch('models/model_registry.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.registry = await response.json();
            console.log(`✅ Registry loaded: ${Object.keys(this.registry.models).length} models available`);
            
            // Preload a default model
            await this.preloadModel('reptizoo_36x18x18');
            
        } catch (error) {
            console.error('❌ Failed to load model registry:', error);
            this.registry = null;
        }
    }
    
    async preloadModel(modelName) {
        if (!this.registry?.models[modelName]) {
            console.warn(`⚠️  Model ${modelName} not found in registry`);
            return null;
        }
        
        try {
            const model = await this.loadModel(modelName);
            console.log(`🎯 Preloaded model: ${modelName}`);
            return model;
        } catch (error) {
            console.error(`❌ Failed to preload model ${modelName}:`, error);
            return null;
        }
    }
    
    async loadModel(modelName) {
        // Check cache first
        if (this.loadedModels.has(modelName)) {
            console.log(`🎯 Using cached model: ${modelName}`);
            return this.loadedModels.get(modelName).clone();
        }
        
        if (!this.registry?.models[modelName]) {
            throw new Error(`Model ${modelName} not found in registry`);
        }
        
        const modelInfo = this.registry.models[modelName];
        console.log(`📥 Loading model: ${modelName} (${modelInfo.file})`);
        
        let model;
        if (modelInfo.file.endsWith('.glb')) {
            model = await this.loadGLBModel(modelInfo);
        } else if (modelInfo.file.endsWith('.json')) {
            model = await this.loadJSONModel(modelInfo);
        } else {
            throw new Error(`Unsupported model format: ${modelInfo.file}`);
        }
        
        // Cache the model
        this.loadedModels.set(modelName, model);
        console.log(`✅ Model loaded and cached: ${modelName}`);
        
        return model.clone();
    }
    
    loadGLBModel(modelInfo) {
        return new Promise((resolve, reject) => {
            this.loaders.gltf.load(
                `models/${modelInfo.file}`,
                (gltf) => {
                    const model = gltf.scene;
                    model.userData = modelInfo;
                    
                    console.log(`🔍 GLB Model Debug for ${modelInfo.name}:`);
                    console.log('  - Scene children:', model.children.length);
                    
                    // Optimize for performance while preserving materials
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.frustumCulled = true;
                            console.log(`  - Mesh found: ${child.name || 'unnamed'}, material:`, child.material?.type || 'none');
                            
                            if (child.material) {
                                child.material.needsUpdate = false;
                                // Enhance transparency handling
                                if (child.material.transparent) {
                                    child.renderOrder = 1;
                                    console.log(`    - Transparent material detected`);
                                }
                            }
                        }
                    });
                    
                    resolve(model);
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = (progress.loaded / progress.total * 100).toFixed(1);
                        console.log(`📊 Loading ${modelInfo.name}: ${percent}%`);
                    }
                },
                (error) => {
                    console.error(`❌ GLB loading error for ${modelInfo.name}:`, error);
                    reject(error);
                }
            );
        });
    }
    
    async loadJSONModel(modelInfo) {
        try {
            const response = await fetch(`models/${modelInfo.file}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.model_data?.type === 'simple') {
                return this.createModelFromSimpleData(data.model_data, modelInfo);
            }
            
            throw new Error('Unsupported JSON model format');
            
        } catch (error) {
            console.error(`❌ JSON loading error for ${modelInfo.name}:`, error);
            throw error;
        }
    }
    
    createModelFromSimpleData(modelData, modelInfo) {
        const geometry = new THREE.BufferGeometry();
        
        // Convert vertices array to Float32Array
        const verticesFlat = modelData.vertices.flat();
        const vertices = new Float32Array(verticesFlat);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // Convert faces to indices
        const facesFlat = modelData.faces.flat();
        const indices = new Uint16Array(facesFlat);
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        
        // Compute normals for proper lighting
        geometry.computeVertexNormals();
        
        // Create material based on enclosure type
        const material = this.createMaterialForType(modelInfo.type);
        
        const model = new THREE.Group();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = modelInfo;
        model.add(mesh);
        model.userData = modelInfo;
        
        return model;
    }
    
    createMaterialForType(type) {
        // Don't override materials for GLB models - they come with their own materials
        // This method is only used for JSON/simple models
        const materials = {
            'reptizoo': new THREE.MeshLambertMaterial({
                color: 0x262626,  // Dark frame color like real REPTIZOO
                transparent: false,
                side: THREE.DoubleSide
            }),
            'pvc': new THREE.MeshLambertMaterial({
                color: 0xe6e6d9,
                side: THREE.DoubleSide
            }),
            'basic': new THREE.MeshLambertMaterial({
                color: 0xd9e6f0,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                alphaTest: 0.1
            })
        };
        
        return materials[type] || materials['basic'];
    }
    
    getAvailableModels() {
        if (!this.registry) return [];
        return Object.keys(this.registry.models);
    }
    
    getModelInfo(modelName) {
        if (!this.registry?.models[modelName]) return null;
        return { ...this.registry.models[modelName] };
    }
    
    getAllModelsInfo() {
        if (!this.registry) return {};
        return { ...this.registry.models };
    }
    
    clearCache() {
        this.loadedModels.clear();
        console.log('🧹 Model cache cleared');
    }
    
    getCacheInfo() {
        return {
            cachedModels: Array.from(this.loadedModels.keys()),
            cacheSize: this.loadedModels.size,
            registryLoaded: !!this.registry
        };
    }
}

// Make globally available
window.ModelLoader = ModelLoader; 