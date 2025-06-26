// Optimized Enclosure Builder - Uses pre-generated 3D models for better performance
class OptimizedEnclosureBuilder {
    constructor() {
        this.scene = new THREE.Scene();
        this.modelRegistry = null;
        this.loadedModels = new Map(); // Cache for loaded models
        this.currentModel = null;
        this.items = [];
        this.selectedItem = null;
        this.measurementsVisible = true;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Optimized Enclosure Builder...');
        
        // Setup renderer with better performance settings
        const canvas = document.getElementById('enclosure-canvas');
        const canvasContainer = canvas.parentElement;
        const containerWidth = canvasContainer.clientWidth - 40;
        const containerHeight = 600;
        
        this.camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            powerPreference: "high-performance"  // Use high-performance GPU if available
        });
        
        this.renderer.setSize(containerWidth, containerHeight);
        this.renderer.setClearColor(0xf8f8f8);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Performance optimizations
        this.renderer.sortObjects = false;  // Disable sorting for better performance
        this.renderer.alpha = true;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio

        // Setup camera
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);

        // Add optimized lighting
        this.setupOptimizedLighting();

        // Add controls with optimized settings
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.3;
        this.controls.maxDistance = 5.0;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.0;

        // Load model registry
        await this.loadModelRegistry();

        // Setup event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.setupDragAndDrop();
        this.setupCanvasEvents();

        // Start animation loop
        this.animate();

        // Make globally accessible
        window.optimizedEnclosureBuilder = this;
        
        console.log('✅ Optimized Enclosure Builder initialized');
    }

    setupOptimizedLighting() {
        // Use fewer, more efficient lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;
        
        // Optimize shadow map size based on device capabilities
        const shadowMapSize = window.devicePixelRatio > 1 ? 1024 : 2048;
        directionalLight.shadow.mapSize.width = shadowMapSize;
        directionalLight.shadow.mapSize.height = shadowMapSize;
        
        this.scene.add(directionalLight);
    }

    async loadModelRegistry() {
        try {
            console.log('📋 Loading model registry...');
            const response = await fetch('models/model_registry.json');
            
            if (!response.ok) {
                console.warn('⚠️  Model registry not found. Falling back to procedural generation.');
                this.modelRegistry = null;
                return;
            }
            
            this.modelRegistry = await response.json();
            console.log(`✅ Loaded ${Object.keys(this.modelRegistry.models).length} model definitions`);
            
        } catch (error) {
            console.warn('⚠️  Failed to load model registry:', error);
            this.modelRegistry = null;
        }
    }

    async loadEnclosureModel(modelName) {
        if (!this.modelRegistry || !this.modelRegistry.models[modelName]) {
            console.warn(`⚠️  Model ${modelName} not found in registry. Using fallback.`);
            return this.createFallbackModel(modelName);
        }

        // Check cache first
        if (this.loadedModels.has(modelName)) {
            console.log(`🎯 Using cached model: ${modelName}`);
            return this.loadedModels.get(modelName).clone();
        }

        const modelInfo = this.modelRegistry.models[modelName];
        console.log(`📥 Loading model: ${modelName}`);

        try {
            if (modelInfo.file.endsWith('.glb')) {
                // Load GLB model
                return await this.loadGLBModel(modelInfo);
            } else if (modelInfo.file.endsWith('.json')) {
                // Load JSON model
                return await this.loadJSONModel(modelInfo);
            }
        } catch (error) {
            console.error(`❌ Failed to load model ${modelName}:`, error);
            return this.createFallbackModel(modelName);
        }
    }

    async loadGLBModel(modelInfo) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(
                `models/${modelInfo.file}`,
                (gltf) => {
                    const model = gltf.scene;
                    model.userData = modelInfo;
                    
                    // Optimize materials for performance
                    model.traverse((child) => {
                        if (child.isMesh) {
                            // Enable frustum culling
                            child.frustumCulled = true;
                            
                            // Optimize materials
                            if (child.material) {
                                child.material.needsUpdate = false;
                                if (child.material.transparent) {
                                    child.renderOrder = 1; // Render transparent objects later
                                }
                            }
                        }
                    });
                    
                    // Cache the model
                    this.loadedModels.set(modelInfo.name, model);
                    console.log(`✅ Loaded GLB model: ${modelInfo.name}`);
                    resolve(model);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`📊 Loading ${modelInfo.name}: ${percent}%`);
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
            const data = await response.json();
            
            if (data.model_data && data.model_data.type === 'simple') {
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
        
        // Convert vertices to Float32Array
        const vertices = new Float32Array(modelData.vertices.flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // Convert faces to indices
        const indices = new Uint16Array(modelData.faces.flat());
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        
        // Compute normals for proper lighting
        geometry.computeVertexNormals();
        
        // Create material based on enclosure type
        const material = this.createMaterialForType(modelInfo.type);
        
        const model = new THREE.Mesh(geometry, material);
        model.userData = modelInfo;
        
        // Cache the model
        this.loadedModels.set(modelInfo.name, model);
        console.log(`✅ Created model from JSON: ${modelInfo.name}`);
        
        return model;
    }

    createMaterialForType(type) {
        switch (type) {
            case 'reptizoo':
                return new THREE.MeshLambertMaterial({
                    color: 0xf0f0f0,
                    transparent: true,
                    opacity: 0.35,
                    side: THREE.DoubleSide
                });
            case 'pvc':
                return new THREE.MeshLambertMaterial({
                    color: 0xe6e6d9,
                    side: THREE.DoubleSide
                });
            case 'basic':
            default:
                return new THREE.MeshLambertMaterial({
                    color: 0xd9e6f0,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide
                });
        }
    }

    createFallbackModel(modelName) {
        console.log(`🔧 Creating fallback model for: ${modelName}`);
        
        // Extract dimensions from model name if possible
        const match = modelName.match(/(\d+)x(\d+)x(\d+)/);
        const dimensions = match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [36, 18, 18];
        
        // Create simple box geometry
        const [length, width, height] = dimensions.map(d => d * 0.0254); // Convert to meters
        const geometry = new THREE.BoxGeometry(length, width, height);
        const material = new THREE.MeshLambertMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        
        const model = new THREE.Mesh(geometry, material);
        model.userData = {
            name: modelName,
            dimensions: dimensions,
            type: 'fallback',
            description: `Fallback model for ${modelName}`
        };
        
        return model;
    }

    async setEnclosureModel(modelName) {
        console.log(`🔄 Switching to model: ${modelName}`);
        
        // Remove current model
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }

        // Load and add new model
        try {
            this.currentModel = await this.loadEnclosureModel(modelName);
            this.scene.add(this.currentModel);
            
            // Update camera position based on model bounds
            this.updateCameraForModel(this.currentModel);
            
            // Add measurements if enabled
            if (this.measurementsVisible && this.currentModel.userData.dimensions) {
                this.createMeasurements(this.currentModel.userData.dimensions);
            }
            
            console.log(`✅ Successfully loaded model: ${modelName}`);
            
        } catch (error) {
            console.error(`❌ Failed to set enclosure model ${modelName}:`, error);
            
            // Try fallback
            this.currentModel = this.createFallbackModel(modelName);
            this.scene.add(this.currentModel);
        }
    }

    updateCameraForModel(model) {
        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Update camera position
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2.5;
        
        this.camera.position.set(distance, distance * 0.6, distance);
        this.camera.lookAt(center);
        
        // Update controls
        this.controls.target.copy(center);
        this.controls.update();
    }

    createMeasurements(dimensions) {
        // Remove existing measurements
        const existingMeasurements = this.scene.getObjectByName('measurements');
        if (existingMeasurements) {
            this.scene.remove(existingMeasurements);
        }

        if (!dimensions || dimensions.length !== 3) return;

        const measurementGroup = new THREE.Group();
        measurementGroup.name = 'measurements';

        // Convert dimensions to meters
        const [length, width, height] = dimensions.map(d => d * 0.0254);

        // Create dimension labels
        const loader = new THREE.FontLoader();
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

        // For simplicity, create basic text sprites instead of 3D text
        this.createTextSprite(`${dimensions[0]}"`, [0, 0, -height/2 - 0.1], measurementGroup);
        this.createTextSprite(`${dimensions[1]}"`, [-length/2 - 0.1, 0, 0], measurementGroup);
        this.createTextSprite(`${dimensions[2]}"`, [-length/2 - 0.1, width/2 + 0.1, 0], measurementGroup);

        this.scene.add(measurementGroup);
    }

    createTextSprite(text, position, parent) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#333333';
        context.font = '16px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width/2, canvas.height/2 + 6);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.set(...position);
        sprite.scale.set(0.2, 0.1, 1);
        
        parent.add(sprite);
    }

    toggleMeasurements() {
        this.measurementsVisible = !this.measurementsVisible;
        
        if (this.measurementsVisible && this.currentModel && this.currentModel.userData.dimensions) {
            this.createMeasurements(this.currentModel.userData.dimensions);
        } else {
            const measurements = this.scene.getObjectByName('measurements');
            if (measurements) {
                this.scene.remove(measurements);
            }
        }
    }

    // Add item to the scene (maintain existing functionality)
    addItem(itemData) {
        if (!itemData || !itemData.position) return;

        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const material = new THREE.MeshStandardMaterial({ color: itemData.color || 0x00ff00 });
        const item = new THREE.Mesh(geometry, material);
        
        item.position.set(...itemData.position);
        item.userData = { ...itemData, id: Date.now() };
        
        this.scene.add(item);
        this.items.push(item);
        
        return item;
    }

    removeItem(itemId) {
        const itemIndex = this.items.findIndex(item => item.userData.id === itemId);
        if (itemIndex === -1) return;

        const item = this.items[itemIndex];
        this.scene.remove(item);
        this.items.splice(itemIndex, 1);
        
        if (this.selectedItem === item) {
            this.selectedItem = null;
        }
    }

    // Event handlers (simplified versions of existing methods)
    setupDragAndDrop() {
        // Implement drag and drop functionality
        // This would be similar to the original but optimized
    }

    setupCanvasEvents() {
        // Setup mouse/touch events for interaction
        // This would be similar to the original but optimized
    }

    onWindowResize() {
        const canvas = document.getElementById('enclosure-canvas');
        const canvasContainer = canvas.parentElement;
        const containerWidth = canvasContainer.clientWidth - 40;
        const containerHeight = 600;

        this.camera.aspect = containerWidth / containerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(containerWidth, containerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    // Utility methods for external integration
    getAvailableModels() {
        return this.modelRegistry ? Object.keys(this.modelRegistry.models) : [];
    }

    getCurrentModelInfo() {
        return this.currentModel ? this.currentModel.userData : null;
    }

    // Performance monitoring
    getPerformanceInfo() {
        const info = this.renderer.info;
        return {
            triangles: info.render.triangles,
            points: info.render.points,
            lines: info.render.lines,
            calls: info.render.calls,
            frame: info.render.frame,
            memory: {
                geometries: info.memory.geometries,
                textures: info.memory.textures
            }
        };
    }
}

// Integration function to replace the old builder
async function initializeOptimizedEnclosureBuilder() {
    console.log('🔄 Initializing optimized enclosure builder...');
    
    // Create the optimized builder
    const builder = new OptimizedEnclosureBuilder();
    
    // Wait for initialization to complete
    await new Promise(resolve => {
        const checkInit = () => {
            if (builder.modelRegistry !== undefined) {
                resolve();
            } else {
                setTimeout(checkInit, 100);
            }
        };
        checkInit();
    });
    
    console.log('✅ Optimized enclosure builder ready!');
    return builder;
}

// Make available globally
window.OptimizedEnclosureBuilder = OptimizedEnclosureBuilder;
window.initializeOptimizedEnclosureBuilder = initializeOptimizedEnclosureBuilder; 