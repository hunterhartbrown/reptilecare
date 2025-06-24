// Import Three.js from CDN in the HTML file
class EnclosureBuilder {
    constructor() {
        this.scene = new THREE.Scene();
        // Use proper aspect ratio based on canvas container
        const canvas = document.getElementById('enclosure-canvas');
        const canvasContainer = canvas.parentElement;
        const containerWidth = canvasContainer.clientWidth - 40;
        const containerHeight = 600;
        this.camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.items = [];
        this.selectedItem = null;
        this.enclosureDimensions = { length: 36, width: 18, height: 18 }; // Default size
        this.measurementsVisible = true; // Add control for measurements visibility
        
        // Initialize optimized model loader
        this.modelLoader = new OptimizedModelLoader();
        
        this.init();
    }

    init() {
        // Setup renderer - use container size instead of window size to prevent overflow
        const canvas = document.getElementById('enclosure-canvas');
        const canvasContainer = canvas.parentElement;
        const containerWidth = canvasContainer.clientWidth - 40; // Account for padding
        const containerHeight = 600; // Fixed height from CSS
        
        this.renderer.setSize(containerWidth, containerHeight);
        this.renderer.setClearColor(0xf8f8f8);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Improve transparency rendering
        this.renderer.sortObjects = true;
        this.renderer.alpha = true;

        // Setup camera
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Add controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Set appropriate zoom limits for terrarium size (36x18x18 inches = ~0.9x0.45x0.45 meters)
        this.controls.minDistance = 0.3;  // Allow close inspection
        this.controls.maxDistance = 5.0;  // Keep model visible
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Ensure zoom is enabled
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.0;

        // Create enclosure
        this.createEnclosure();

        // Start animation loop
        this.animate();

        // Add event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.setupDragAndDrop();
        this.setupCanvasEvents();

        // Make the builder globally accessible
        window.enclosureBuilder = this;
        
        // Debug: Log initial camera position and controls
        console.log('EnclosureBuilder initialized');
        console.log('Camera position:', this.camera.position);
        console.log('Controls zoom enabled:', this.controls.enableZoom);
        console.log('Min/Max distance:', this.controls.minDistance, this.controls.maxDistance);
    }

    async createEnclosure() {
        // Remove existing enclosure if any
        const existingEnclosure = this.scene.getObjectByName('enclosure');
        if (existingEnclosure) {
            this.scene.remove(existingEnclosure);
        }

        // Remove existing measurements
        const existingMeasurements = this.scene.getObjectByName('measurements');
        if (existingMeasurements) {
            this.scene.remove(existingMeasurements);
        }

        // Convert dimensions to meters (1 inch = 0.0254 meters)
        const length = this.enclosureDimensions.length * 0.0254;
        const width = this.enclosureDimensions.width * 0.0254;
        const height = this.enclosureDimensions.height * 0.0254;

        // Check the enclosure type for enhanced features
        const isReptizoo = this.currentEnclosureData && this.currentEnclosureData.id && this.currentEnclosureData.id.includes('reptizoo');
        const isPVC = this.currentEnclosureData && this.currentEnclosureData.enclosureType === 'pvc';

        let enclosure;

        // Try to load optimized pre-generated model first
        if (this.currentEnclosureData && this.modelLoader) {
            const modelConfig = this.modelLoader.getModelConfig(this.currentEnclosureData);
            
            if (modelConfig.modelPath && !modelConfig.fallbackToProcedural) {
                try {
                    console.log('🚀 Loading optimized model instead of procedural generation...');
                    enclosure = await this.modelLoader.loadModel(modelConfig.modelPath, modelConfig.modelId);
                    enclosure.name = 'enclosure';
                    
                    // Scale the model to match expected dimensions (models are created at real scale)
                    // No scaling needed since our Blender script creates models at the correct scale
                    
                    console.log('✅ Optimized model loaded successfully!');
                } catch (error) {
                    console.warn('⚠️ Failed to load optimized model, falling back to procedural generation:', error);
                    enclosure = null;
                }
            }
        }

        // Fall back to procedural generation if optimized model failed or not available
        if (!enclosure) {
            console.log('🔧 Using procedural generation...');
            enclosure = new THREE.Group();
            enclosure.name = 'enclosure';

            if (isReptizoo) {
                this.createReptizooModel(enclosure, length, width, height);
            } else if (isPVC) {
                this.createPVCPanelModel(enclosure, length, width, height);
            } else {
                this.createBasicEnclosure(enclosure, length, width, height);
            }
        }

        // Add to scene
        this.scene.add(enclosure);

        // Add measurements if enabled
        if (this.measurementsVisible) {
            this.createMeasurements(length, width, height);
            console.log('Measurements recreated with dimensions:', this.enclosureDimensions);
        }

        // Update camera position - optimize for the model type
        this.updateCameraPosition(length, width, height, isReptizoo, isPVC);
    }

    createBasicEnclosure(enclosure, length, width, height) {
        // Create glass material
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0,
            transmission: 0.9,
            thickness: 0.05,
            envMapIntensity: 1.0
        });

        // Create walls
        const wallGeometry = new THREE.BoxGeometry(length, height, 0.002);
        const sideWallGeometry = new THREE.BoxGeometry(0.002, height, width);
        const bottomGeometry = new THREE.BoxGeometry(length, 0.002, width);

        // Back wall
        const backWall = new THREE.Mesh(wallGeometry, glassMaterial);
        backWall.position.z = -width/2;
        enclosure.add(backWall);

        // Side walls
        const leftWall = new THREE.Mesh(sideWallGeometry, glassMaterial);
        leftWall.position.x = -length/2;
        enclosure.add(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeometry, glassMaterial);
        rightWall.position.x = length/2;
        enclosure.add(rightWall);

        // Bottom
        const bottom = new THREE.Mesh(bottomGeometry, glassMaterial);
        bottom.position.y = -height/2;
        enclosure.add(bottom);
    }

    createReptizooModel(enclosure, length, width, height) {
        // Enhanced REPTIZOO model with detailed features
        
        // Materials - Consistent glass material for all panels
        const glassMaterial = new THREE.MeshLambertMaterial({
            color: 0xf0f0f0,  // Consistent light grey tint
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,  // Render both sides to prevent disappearing
            depthWrite: false,  // Prevent depth sorting issues
            flatShading: false  // Ensure consistent shading
        });

        const aluminumMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.1
        });

        const screenMaterial = new THREE.MeshBasicMaterial({
            color: 0x2a2a2a,  // Darker screen color
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const frameThickness = 0.01;
        
        // Create aluminum frame structure
        const frameGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, frameThickness);
        
        // Bottom frame
        const bottomFrame = [
            [-length/2 + frameThickness/2, -height/2 + frameThickness/2, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, -height/2 + frameThickness/2, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, -height/2 + frameThickness/2, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, -height/2 + frameThickness/2, width/2 - frameThickness/2]
        ];

        // Top frame
        const topFrame = [
            [-length/2 + frameThickness/2, height/2 - frameThickness/2, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, height/2 - frameThickness/2, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, height/2 - frameThickness/2, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, height/2 - frameThickness/2, width/2 - frameThickness/2]
        ];

        // Vertical posts
        const verticalPosts = [
            [-length/2 + frameThickness/2, 0, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, 0, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, 0, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, 0, width/2 - frameThickness/2]
        ];

        // Create frame pieces
        [...bottomFrame, ...topFrame].forEach(pos => {
            const frame = new THREE.Mesh(frameGeometry, aluminumMaterial);
            frame.position.set(pos[0], pos[1], pos[2]);
            enclosure.add(frame);
        });

        verticalPosts.forEach(pos => {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, height, frameThickness),
                aluminumMaterial
            );
            post.position.set(pos[0], pos[1], pos[2]);
            enclosure.add(post);
        });

        // Glass panels
        const glassThickness = 0.003;

        // Back panel (opposite to doors) - 36" x 18" face at back
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, height - 2*frameThickness, glassThickness),
            glassMaterial
        );
        backPanel.position.set(0, 0, -width/2 + glassThickness/2);
        enclosure.add(backPanel);

        // Side panels (18" x 18" faces - left and right sides)
        const leftPanel = new THREE.Mesh(
            new THREE.BoxGeometry(glassThickness, height - 2*frameThickness, width - 2*frameThickness),
            glassMaterial
        );
        leftPanel.position.set(-length/2 + glassThickness/2, 0, 0);
        enclosure.add(leftPanel);

        const rightPanel = new THREE.Mesh(
            new THREE.BoxGeometry(glassThickness, height - 2*frameThickness, width - 2*frameThickness),
            glassMaterial
        );
        rightPanel.position.set(length/2 - glassThickness/2, 0, 0);
        enclosure.add(rightPanel);

        // Bottom panel - Black plastic base like real REPTIZOO
        const bottomMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,  // Black plastic
            roughness: 0.8,
            metalness: 0.1
        });
        
        const bottomPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, 0.008, width - 2*frameThickness), // Thicker black bottom
            bottomMaterial
        );
        bottomPanel.position.set(0, -height/2 + 0.004, 0);
        enclosure.add(bottomPanel);

        // Horizontal support rail around entire enclosure (1/4 up from bottom)
        const railHeight = height * 0.25;  // 1/4 up from bottom
        const railThickness = 0.012;  // Thicker than top rim
        const railMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,  // Black plastic
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Front rail (will be interrupted by doors but shows structure)
        const frontRailLeft = new THREE.Mesh(
            new THREE.BoxGeometry((length - 3*frameThickness)/2, railThickness, railThickness),
            railMaterial
        );
        frontRailLeft.position.set(-(length - 3*frameThickness)/4 - frameThickness, -height/2 + railHeight, width/2 - railThickness/2);
        enclosure.add(frontRailLeft);
        
        const frontRailRight = new THREE.Mesh(
            new THREE.BoxGeometry((length - 3*frameThickness)/2, railThickness, railThickness),
            railMaterial
        );
        frontRailRight.position.set((length - 3*frameThickness)/4 + frameThickness, -height/2 + railHeight, width/2 - railThickness/2);
        enclosure.add(frontRailRight);
        
        // Back rail
        const backRail = new THREE.Mesh(
            new THREE.BoxGeometry(length, railThickness, railThickness),
            railMaterial
        );
        backRail.position.set(0, -height/2 + railHeight, -width/2 + railThickness/2);
        enclosure.add(backRail);
        
        // Left side rail
        const leftRail = new THREE.Mesh(
            new THREE.BoxGeometry(railThickness, railThickness, width),
            railMaterial
        );
        leftRail.position.set(-length/2 + railThickness/2, -height/2 + railHeight, 0);
        enclosure.add(leftRail);
        
        // Right side rail
        const rightRail = new THREE.Mesh(
            new THREE.BoxGeometry(railThickness, railThickness, width),
            railMaterial
        );
        rightRail.position.set(length/2 - railThickness/2, -height/2 + railHeight, 0);
        enclosure.add(rightRail);

        // Front doors (double hinge) - now shortened to not overlap with rail
        const doorWidth = (length - 3*frameThickness) / 2;
        const doorHeight = height - 2*frameThickness - railHeight - railThickness;  // Height above rail
        
        const leftDoor = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, doorHeight, glassThickness),
            glassMaterial
        );
        leftDoor.position.set(-doorWidth/2 - frameThickness/2, railHeight/2 + railThickness/2, width/2 - glassThickness/2);
        enclosure.add(leftDoor);

        const rightDoor = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, doorHeight, glassThickness),
            glassMaterial
        );
        rightDoor.position.set(doorWidth/2 + frameThickness/2, railHeight/2 + railThickness/2, width/2 - glassThickness/2);
        enclosure.add(rightDoor);

        // Door handles - Accurate REPTIZOO style black plastic handles
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c2c2c,  // Dark grey/black plastic
            roughness: 0.8,
            metalness: 0.1
        });

        // Create more realistic handle shape (rectangular with rounded edges)
        const handleWidth = 0.008;
        const handleHeight = 0.004;
        const handleDepth = 0.025;

        // Left door handle - positioned closer to center but not touching edge, on shortened door
        const leftHandleGeometry = new THREE.BoxGeometry(handleDepth, handleHeight, handleWidth);
        const leftHandle = new THREE.Mesh(leftHandleGeometry, handleMaterial);
        leftHandle.position.set(-doorWidth/4, railHeight/2 + railThickness/2, width/2 + 0.008);  // Centered on shortened door
        enclosure.add(leftHandle);

        // Right door handle - positioned closer to center but not touching edge, on shortened door
        const rightHandleGeometry = new THREE.BoxGeometry(handleDepth, handleHeight, handleWidth);
        const rightHandle = new THREE.Mesh(rightHandleGeometry, handleMaterial);
        rightHandle.position.set(doorWidth/4, railHeight/2 + railThickness/2, width/2 + 0.008);  // Centered on shortened door
        enclosure.add(rightHandle);

        // Add handle mounting screws for realism
        const screwGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.002);
        const screwMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

        // Left handle screws
        const leftScrew1 = new THREE.Mesh(screwGeometry, screwMaterial);
        leftScrew1.position.set(-doorWidth/4, railHeight/2 + railThickness/2 + 0.008, width/2 + 0.006);
        leftScrew1.rotation.z = Math.PI/2;
        enclosure.add(leftScrew1);

        const leftScrew2 = new THREE.Mesh(screwGeometry, screwMaterial);
        leftScrew2.position.set(-doorWidth/4, railHeight/2 + railThickness/2 - 0.008, width/2 + 0.006);
        leftScrew2.rotation.z = Math.PI/2;
        enclosure.add(leftScrew2);

        // Right handle screws
        const rightScrew1 = new THREE.Mesh(screwGeometry, screwMaterial);
        rightScrew1.position.set(doorWidth/4, railHeight/2 + railThickness/2 + 0.008, width/2 + 0.006);
        rightScrew1.rotation.z = Math.PI/2;
        enclosure.add(rightScrew1);

        const rightScrew2 = new THREE.Mesh(screwGeometry, screwMaterial);
        rightScrew2.position.set(doorWidth/4, railHeight/2 + railThickness/2 - 0.008, width/2 + 0.006);
        rightScrew2.rotation.z = Math.PI/2;
        enclosure.add(rightScrew2);

        // Add detailed door lock mechanism (center latch with keyhole)
        const lockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,  // Black plastic
            roughness: 0.9 
        });
        
        // Main lock body (squarish)
        const lockBodyGeometry = new THREE.BoxGeometry(0.02, 0.015, 0.008);
        const lockBody = new THREE.Mesh(lockBodyGeometry, lockMaterial);
        lockBody.position.set(0, -height/6, width/2 + 0.004);  // Positioned on the rail level
        enclosure.add(lockBody);
        
        // Keyhole (circular depression)
        const keyholeGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.002);
        const keyholeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a,  // Darker for depression effect
            roughness: 1.0 
        });
        const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial);
        keyhole.position.set(0, -height/6, width/2 + 0.008);
        keyhole.rotation.x = Math.PI/2;
        enclosure.add(keyhole);
        
        // Lock mounting screws
        const lockScrewGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.001);
        const lockScrewMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        
        const lockScrew1 = new THREE.Mesh(lockScrewGeometry, lockScrewMaterial);
        lockScrew1.position.set(-0.008, -height/6 + 0.006, width/2 + 0.007);
        lockScrew1.rotation.x = Math.PI/2;
        enclosure.add(lockScrew1);
        
        const lockScrew2 = new THREE.Mesh(lockScrewGeometry, lockScrewMaterial);
        lockScrew2.position.set(0.008, -height/6 + 0.006, width/2 + 0.007);
        lockScrew2.rotation.x = Math.PI/2;
        enclosure.add(lockScrew2);

        // Add door frame separators
        const frameSeparatorGeometry = new THREE.BoxGeometry(frameThickness, height - 2*frameThickness, frameThickness);
        
        // Center vertical separator between doors
        const centerSeparator = new THREE.Mesh(frameSeparatorGeometry, aluminumMaterial);
        centerSeparator.position.set(0, 0, width/2 - frameThickness/2);
        enclosure.add(centerSeparator);

        // Add realistic hinges
        const hingeGeometry = new THREE.BoxGeometry(0.003, 0.015, 0.008);
        const hingeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,  // Dark metal
            metalness: 0.8,
            roughness: 0.3
        });

        // Left door hinges (2 hinges per door) - positioned for shortened doors
        const doorTopY = railHeight/2 + railThickness/2 + doorHeight/3;
        const doorBottomY = railHeight/2 + railThickness/2 - doorHeight/3;
        
        const leftHinge1 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        leftHinge1.position.set(-length/2 + frameThickness, doorTopY, width/2 - 0.002);
        enclosure.add(leftHinge1);

        const leftHinge2 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        leftHinge2.position.set(-length/2 + frameThickness, doorBottomY, width/2 - 0.002);
        enclosure.add(leftHinge2);

        // Right door hinges
        const rightHinge1 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        rightHinge1.position.set(length/2 - frameThickness, doorTopY, width/2 - 0.002);
        enclosure.add(rightHinge1);

        const rightHinge2 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        rightHinge2.position.set(length/2 - frameThickness, doorBottomY, width/2 - 0.002);
        enclosure.add(rightHinge2);

        // Top ventilation screen with black rim and mesh pattern
        const topScreenWidth = length - 2*frameThickness;
        const topScreenDepth = width - 2*frameThickness;
        
        // Black rim around the top screen
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,  // Black plastic
            roughness: 0.8,
            metalness: 0.1
        });
        
        const rimThickness = 0.008;
        const rimHeight = 0.003;
        
        // Top rim pieces
        const topRim = new THREE.Mesh(
            new THREE.BoxGeometry(length, rimHeight, rimThickness),
            rimMaterial
        );
        topRim.position.set(0, height/2 + rimHeight/2, -width/2 + rimThickness/2);
        enclosure.add(topRim);
        
        const bottomRim = new THREE.Mesh(
            new THREE.BoxGeometry(length, rimHeight, rimThickness),
            rimMaterial
        );
        bottomRim.position.set(0, height/2 + rimHeight/2, width/2 - rimThickness/2);
        enclosure.add(bottomRim);
        
        const leftRim = new THREE.Mesh(
            new THREE.BoxGeometry(rimThickness, rimHeight, width),
            rimMaterial
        );
        leftRim.position.set(-length/2 + rimThickness/2, height/2 + rimHeight/2, 0);
        enclosure.add(leftRim);
        
        const rightRim = new THREE.Mesh(
            new THREE.BoxGeometry(rimThickness, rimHeight, width),
            rimMaterial
        );
        rightRim.position.set(length/2 - rimThickness/2, height/2 + rimHeight/2, 0);
        enclosure.add(rightRim);
        
        // Create mesh pattern by using multiple small rectangles
        const meshSize = 0.005;  // Size of each mesh opening
        const meshSpacing = 0.008;  // Spacing between mesh elements
        
        for (let x = -topScreenWidth/2; x < topScreenWidth/2; x += meshSpacing) {
            for (let z = -topScreenDepth/2; z < topScreenDepth/2; z += meshSpacing) {
                const meshElement = new THREE.Mesh(
                    new THREE.PlaneGeometry(meshSize, meshSize),
                    screenMaterial
                );
                meshElement.position.set(x, height/2 - 0.001, z);
                meshElement.rotation.x = -Math.PI/2;
                enclosure.add(meshElement);
            }
        }

        // Add REPTIZOO branding (small text on front bottom)
        // Note: In a real implementation, you'd use TextGeometry, but for simplicity we'll add a small logo placeholder
        const logoGeometry = new THREE.BoxGeometry(0.03, 0.005, 0.001);
        const logoMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(0, -height/2 + 0.02, width/2 + 0.001);
        enclosure.add(logo);
    }

    createPVCPanelModel(enclosure, length, width, height) {
        // Enhanced PVC Panel model matching the Dubia.com image
        
        // Materials
        const pvcMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,  // Black PVC panels
            roughness: 0.3,
            metalness: 0.1
        });

        const aluminumMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.1
        });

        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0,
            transmission: 0.9,
            thickness: 0.05
        });

        const acrylicMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf8f8f8,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1,
            transmission: 0.8
        });

        const screenMaterial = new THREE.MeshBasicMaterial({
            color: 0x2a2a2a,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const frameThickness = 0.015;  // Thicker aluminum frame
        const panelThickness = 0.008;   // PVC panel thickness

        // Create aluminum frame structure
        const frameGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, frameThickness);
        
        // Bottom frame corners
        const bottomCorners = [
            [-length/2 + frameThickness/2, -height/2 + frameThickness/2, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, -height/2 + frameThickness/2, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, -height/2 + frameThickness/2, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, -height/2 + frameThickness/2, width/2 - frameThickness/2]
        ];

        // Top frame corners
        const topCorners = [
            [-length/2 + frameThickness/2, height/2 - frameThickness/2, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, height/2 - frameThickness/2, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, height/2 - frameThickness/2, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, height/2 - frameThickness/2, width/2 - frameThickness/2]
        ];

        // Create frame corner pieces
        [...bottomCorners, ...topCorners].forEach(pos => {
            const frame = new THREE.Mesh(frameGeometry, aluminumMaterial);
            frame.position.set(pos[0], pos[1], pos[2]);
            enclosure.add(frame);
        });

        // Vertical frame posts
        const verticalPosts = [
            [-length/2 + frameThickness/2, 0, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, 0, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, 0, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, 0, width/2 - frameThickness/2]
        ];

        verticalPosts.forEach(pos => {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, height, frameThickness),
                aluminumMaterial
            );
            post.position.set(pos[0], pos[1], pos[2]);
            enclosure.add(post);
        });

        // PVC side panels (left and right) - Black
        const leftPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelThickness, height - 2*frameThickness, width - 2*frameThickness),
            pvcMaterial
        );
        leftPanel.position.set(-length/2 + panelThickness/2, 0, 0);
        enclosure.add(leftPanel);

        const rightPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelThickness, height - 2*frameThickness, width - 2*frameThickness),
            pvcMaterial
        );
        rightPanel.position.set(length/2 - panelThickness/2, 0, 0);
        enclosure.add(rightPanel);

        // PVC back panel - Black
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, height - 2*frameThickness, panelThickness),
            pvcMaterial
        );
        backPanel.position.set(0, 0, -width/2 + panelThickness/2);
        enclosure.add(backPanel);

        // PVC bottom panel - Black (thicker)
        const bottomPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, panelThickness*1.5, width - 2*frameThickness),
            pvcMaterial
        );
        bottomPanel.position.set(0, -height/2 + panelThickness*0.75, 0);
        enclosure.add(bottomPanel);

        // Front section with glass sliding doors
        // The image shows sliding doors in the upper portion, with a black bar in the middle, and a lower glass section

        // Calculate door heights based on the image: upper 60%, black bar 10%, lower 30%
        const upperDoorHeight = (height - 2*frameThickness) * 0.6;
        const blackBarHeight = 0.025;  // Black bar thickness
        const lowerGlassHeight = (height - 2*frameThickness) * 0.3;

        // Black horizontal bar (divider between upper and lower glass sections)
        const blackBar = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, blackBarHeight, panelThickness),
            pvcMaterial
        );
        blackBar.position.set(0, -upperDoorHeight/2 + blackBarHeight/2, width/2 - panelThickness/2);
        enclosure.add(blackBar);

        // Upper sliding glass doors (left and right)
        const doorWidth = (length - 3*frameThickness) / 2;  // Account for center frame
        
        const leftDoor = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, upperDoorHeight, 0.004),
            glassMaterial
        );
        leftDoor.position.set(-doorWidth/2 - frameThickness/2, upperDoorHeight/2 - blackBarHeight/2, width/2 - 0.002);
        enclosure.add(leftDoor);

        const rightDoor = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, upperDoorHeight, 0.004),
            glassMaterial
        );
        rightDoor.position.set(doorWidth/2 + frameThickness/2, upperDoorHeight/2 - blackBarHeight/2, width/2 - 0.002);
        enclosure.add(rightDoor);

        // Center vertical frame between doors
        const centerFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, upperDoorHeight, frameThickness),
            aluminumMaterial
        );
        centerFrame.position.set(0, upperDoorHeight/2 - blackBarHeight/2, width/2 - frameThickness/2);
        enclosure.add(centerFrame);

        // Lower acrylic viewing panel
        const lowerPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, lowerGlassHeight, 0.006),
            acrylicMaterial
        );
        lowerPanel.position.set(0, -upperDoorHeight/2 - blackBarHeight/2 - lowerGlassHeight/2, width/2 - 0.003);
        enclosure.add(lowerPanel);

        // Door handles - Black plastic handles on sliding doors
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c2c2c,
            roughness: 0.8,
            metalness: 0.1
        });

        const handleWidth = 0.006;
        const handleHeight = 0.003;
        const handleDepth = 0.02;

        // Left door handle
        const leftHandle = new THREE.Mesh(
            new THREE.BoxGeometry(handleDepth, handleHeight, handleWidth),
            handleMaterial
        );
        leftHandle.position.set(-doorWidth/4, upperDoorHeight/4, width/2 + 0.006);
        enclosure.add(leftHandle);

        // Right door handle
        const rightHandle = new THREE.Mesh(
            new THREE.BoxGeometry(handleDepth, handleHeight, handleWidth),
            handleMaterial
        );
        rightHandle.position.set(doorWidth/4, upperDoorHeight/4, width/2 + 0.006);
        enclosure.add(rightHandle);

        // Door tracks (aluminum rails for sliding doors)
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0xa0a0a0,
            metalness: 0.7,
            roughness: 0.2
        });

        // Top track
        const topTrack = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, 0.008, 0.012),
            trackMaterial
        );
        topTrack.position.set(0, height/2 - frameThickness - 0.004, width/2 - 0.006);
        enclosure.add(topTrack);

        // Bottom track (at black bar level)
        const bottomTrack = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, 0.008, 0.012),
            trackMaterial
        );
        bottomTrack.position.set(0, -blackBarHeight/2 - 0.004, width/2 - 0.006);
        enclosure.add(bottomTrack);

        // Screen top ventilation
        const screenWidth = length - 2*frameThickness;
        const screenDepth = width - 2*frameThickness;
        
        // Create mesh pattern for screen top
        const meshSize = 0.004;
        const meshSpacing = 0.006;
        
        for (let x = -screenWidth/2; x < screenWidth/2; x += meshSpacing) {
            for (let z = -screenDepth/2; z < screenDepth/2; z += meshSpacing) {
                const meshElement = new THREE.Mesh(
                    new THREE.PlaneGeometry(meshSize, meshSize),
                    screenMaterial
                );
                meshElement.position.set(x, height/2 - 0.001, z);
                meshElement.rotation.x = -Math.PI/2;
                enclosure.add(meshElement);
            }
        }

        // Add corner reinforcements (typical of PVC construction)
        const cornerMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4
        });

        const cornerSize = 0.012;
        const corners = [
            [-length/2 + cornerSize/2, height/2 - cornerSize/2, -width/2 + cornerSize/2],
            [length/2 - cornerSize/2, height/2 - cornerSize/2, -width/2 + cornerSize/2],
            [-length/2 + cornerSize/2, height/2 - cornerSize/2, width/2 - cornerSize/2],
            [length/2 - cornerSize/2, height/2 - cornerSize/2, width/2 - cornerSize/2]
        ];

        corners.forEach(pos => {
            const corner = new THREE.Mesh(
                new THREE.BoxGeometry(cornerSize, cornerSize, cornerSize),
                cornerMaterial
            );
            corner.position.set(pos[0], pos[1], pos[2]);
            enclosure.add(corner);
        });

        // Add brand marking for PVC enclosure
        const brandGeometry = new THREE.BoxGeometry(0.025, 0.004, 0.001);
        const brandMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const brand = new THREE.Mesh(brandGeometry, brandMaterial);
        brand.position.set(0, -height/2 + 0.015, width/2 + 0.001);
        enclosure.add(brand);
    }

    createMeasurements(length, width, height) {
        const measurementsGroup = new THREE.Group();
        measurementsGroup.name = 'measurements';

        // Measurement line material
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x333333,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });

        // Text material
        const textMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.9
        });

        // Font loader for text (we'll create simple text for now)
        const fontLoader = new THREE.FontLoader();

        // Since we might not have font loading, let's create simple text using CSS2DRenderer approach
        // For now, we'll create dimension lines and use DOM elements for text

        // Create dimension lines
        this.createDimensionLine(measurementsGroup, 
            new THREE.Vector3(-length/2, -height/2 - 0.05, width/2 + 0.05),
            new THREE.Vector3(length/2, -height/2 - 0.05, width/2 + 0.05),
            `${this.enclosureDimensions.length}"`,
            'length',
            lineMaterial
        );

        this.createDimensionLine(measurementsGroup,
            new THREE.Vector3(-length/2 - 0.05, -height/2 - 0.05, -width/2),
            new THREE.Vector3(-length/2 - 0.05, -height/2 - 0.05, width/2),
            `${this.enclosureDimensions.width}"`,
            'width',
            lineMaterial
        );

        this.createDimensionLine(measurementsGroup,
            new THREE.Vector3(-length/2 - 0.05, -height/2, width/2 + 0.05),
            new THREE.Vector3(-length/2 - 0.05, height/2, width/2 + 0.05),
            `${this.enclosureDimensions.height}"`,
            'height',
            lineMaterial
        );

        // Add grid lines for better scale reference
        this.createGridLines(measurementsGroup, length, width, height);

        this.scene.add(measurementsGroup);
    }

    createDimensionLine(parent, start, end, text, dimension, material) {
        // Create the main dimension line
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        parent.add(line);

        // Create extension lines (perpendicular lines at each end)
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const perpendicular = new THREE.Vector3();
        
        if (dimension === 'height') {
            perpendicular.set(0.02, 0, 0);
        } else if (dimension === 'width') {
            perpendicular.set(0, 0.02, 0);
        } else { // length
            perpendicular.set(0, 0.02, 0);
        }

        // Start extension line
        const startExt1 = start.clone().add(perpendicular);
        const startExt2 = start.clone().sub(perpendicular);
        const startExtGeometry = new THREE.BufferGeometry().setFromPoints([startExt1, startExt2]);
        const startExtLine = new THREE.Line(startExtGeometry, material);
        parent.add(startExtLine);

        // End extension line
        const endExt1 = end.clone().add(perpendicular);
        const endExt2 = end.clone().sub(perpendicular);
        const endExtGeometry = new THREE.BufferGeometry().setFromPoints([endExt1, endExt2]);
        const endExtLine = new THREE.Line(endExtGeometry, material);
        parent.add(endExtLine);

        // Create text label using CSS2D for better readability
        this.createTextLabel(parent, start.clone().lerp(end, 0.5), text, dimension);
    }

    createTextLabel(parent, position, text, dimension) {
        // Create a DOM element for the text
        const textDiv = document.createElement('div');
        textDiv.className = 'measurement-label';
        textDiv.textContent = text;
        textDiv.style.cssText = `
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #333;
            border-radius: 4px;
            padding: 2px 6px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            color: #333;
            text-align: center;
            pointer-events: none;
            user-select: none;
            white-space: nowrap;
        `;

        // Create CSS2DObject (we'll simulate this with a simple plane for now)
        // Since CSS2DRenderer might not be available, let's create a simple text texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 32;
        
        // Set up text style
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#333';
        context.strokeRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#333';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create sprite material and sprite
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Scale the sprite appropriately
        const scale = 0.1;
        sprite.scale.set(scale * 2, scale * 0.5, 1);
        
        // Position the sprite
        sprite.position.copy(position);
        
        // Adjust position based on dimension to avoid overlap
        if (dimension === 'length') {
            sprite.position.y -= 0.03;
        } else if (dimension === 'width') {
            sprite.position.x -= 0.03;
        } else if (dimension === 'height') {
            sprite.position.x -= 0.03;
        }

        parent.add(sprite);
    }

    createGridLines(parent, length, width, height) {
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0xcccccc,
            transparent: true,
            opacity: 0.3
        });

        // Floor grid lines every 6 inches (0.1524 meters)
        const gridSpacing = 6 * 0.0254; // 6 inches in meters
        const gridSize = Math.max(length, width);

        // Create floor grid
        const gridHelper = new THREE.GridHelper(gridSize * 1.5, Math.floor(gridSize / gridSpacing));
        gridHelper.material = gridMaterial;
        gridHelper.position.y = -height/2 - 0.001; // Just below the enclosure floor
        parent.add(gridHelper);

        // Add scale reference markers
        this.createScaleMarkers(parent, length, width, height);
    }

    createScaleMarkers(parent, length, width, height) {
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.8
        });

        // Create small reference markers at key measurements
        const markerSize = 0.01;
        const markerGeometry = new THREE.SphereGeometry(markerSize, 8, 6);

        // Corner markers
        const corners = [
            new THREE.Vector3(-length/2, -height/2, -width/2),
            new THREE.Vector3(length/2, -height/2, -width/2),
            new THREE.Vector3(-length/2, -height/2, width/2),
            new THREE.Vector3(length/2, -height/2, width/2),
            new THREE.Vector3(-length/2, height/2, -width/2),
            new THREE.Vector3(length/2, height/2, -width/2),
            new THREE.Vector3(-length/2, height/2, width/2),
            new THREE.Vector3(length/2, height/2, width/2)
        ];

        corners.forEach(corner => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(corner);
            parent.add(marker);
        });
    }

    toggleMeasurements() {
        this.measurementsVisible = !this.measurementsVisible;
        const measurements = this.scene.getObjectByName('measurements');
        if (measurements) {
            measurements.visible = this.measurementsVisible;
        }
        return this.measurementsVisible;
    }

    updateEnclosureDimensions(length, width, height, enclosureData = null) {
        console.log('Updating enclosure dimensions:', { length, width, height });
        this.enclosureDimensions = { length, width, height };
        this.currentEnclosureData = enclosureData;
        this.createEnclosure();
        console.log('Measurements should now show:', `${length}" x ${width}" x ${height}"`);
    }

    addItem(itemData) {
        // Create a basic mesh for the item (can be enhanced with actual 3D models)
        const geometry = new THREE.BoxGeometry(
            itemData.dimensions.length * 0.0254,
            itemData.dimensions.height * 0.0254,
            itemData.dimensions.width * 0.0254
        );
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x808080,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.userData = itemData;
        mesh.name = itemData.id;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Position the item at the center of the enclosure
        mesh.position.y = -this.enclosureDimensions.height * 0.0254 / 2 + itemData.dimensions.height * 0.0254 / 2;

        this.scene.add(mesh);
        this.items.push(mesh);

        // Update the summary panel
        this.updateSummary();
    }

    removeItem(itemId) {
        const item = this.scene.getObjectByName(itemId);
        if (item) {
            this.scene.remove(item);
            this.items = this.items.filter(i => i.name !== itemId);
            this.updateSummary();
        }
    }

    updateSummary() {
        const summaryList = document.getElementById('summary-list');
        const totalPriceElement = document.getElementById('total-price');
        
        // Clear current summary
        summaryList.innerHTML = '';
        
        // Calculate total price and update summary
        let totalPrice = 0;
        this.items.forEach(item => {
            const itemData = item.userData;
            totalPrice += itemData.price;
            
            const li = document.createElement('li');
            li.className = 'summary-item';
            li.innerHTML = `
                <span>${itemData.name}</span>
                <span>$${itemData.price.toFixed(2)}</span>
            `;
            summaryList.appendChild(li);
        });
        
        totalPriceElement.textContent = `Total: $${totalPrice.toFixed(2)}`;
    }

    setupDragAndDrop() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.addItem(itemData);
        });
    }

    setupCanvasEvents() {
        const canvas = this.renderer.domElement;
        
        // Ensure canvas can receive focus for keyboard events
        canvas.setAttribute('tabindex', '0');
        
        // Add wheel event listener for debugging
        canvas.addEventListener('wheel', (e) => {
            console.log('Wheel event detected:', e.deltaY);
        }, { passive: false });
        
        // Add mouse event listeners for debugging
        canvas.addEventListener('mousedown', (e) => {
            console.log('Mouse down on canvas');
            canvas.focus(); // Ensure canvas has focus
        });
        
        // Prevent context menu on right click
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    onWindowResize() {
        // Update canvas size based on container, not window
        const canvas = document.getElementById('enclosure-canvas');
        const canvasContainer = canvas.parentElement;
        const containerWidth = canvasContainer.clientWidth - 40; // Account for padding
        const containerHeight = 600; // Fixed height from CSS
        
        this.camera.aspect = containerWidth / containerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(containerWidth, containerHeight);
    }

    // Camera control methods
    rotateCamera(angle) {
        // Get current camera position relative to target
        const target = this.controls.target.clone();
        const position = this.camera.position.clone().sub(target);
        
        // Rotate around Y axis
        const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
        position.applyMatrix4(rotationMatrix);
        
        // Set new camera position
        this.camera.position.copy(position.add(target));
        this.camera.lookAt(target);
        this.controls.update();
    }

    zoomCamera(factor) {
        // Get current distance from target
        const target = this.controls.target.clone();
        const direction = this.camera.position.clone().sub(target);
        const currentDistance = direction.length();
        
        // Calculate new distance
        const newDistance = currentDistance * factor;
        
        // Clamp to the same limits as OrbitControls
        const minDistance = this.controls.minDistance;
        const maxDistance = this.controls.maxDistance;
        
        const clampedDistance = Math.max(minDistance, Math.min(maxDistance, newDistance));
        
        // Set new camera position
        direction.normalize().multiplyScalar(clampedDistance);
        this.camera.position.copy(target.clone().add(direction));
        this.camera.lookAt(target);
        this.controls.update();
    }

    // Update camera position based on enclosure type
    updateCameraPosition(length, width, height, isReptizoo = false, isPVC = false) {
        const maxDim = Math.max(length, width, height);
        
        if (isReptizoo) {
            // Position camera to showcase REPTIZOO features (front-angled view)
            this.camera.position.set(maxDim * 1.8, maxDim * 1.2, maxDim * 2.2);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
        } else if (isPVC) {
            // Position camera to showcase PVC sliding doors and front features
            this.camera.position.set(maxDim * 1.6, maxDim * 1.0, maxDim * 2.4);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
        } else {
            // Standard positioning for basic enclosures
            this.camera.position.set(maxDim * 2, maxDim * 1.5, maxDim * 2);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
        }
        
        this.controls.update();
    }

    // Reset camera to optimal viewing position
    resetCamera() {
        const length = this.enclosureDimensions.length * 0.0254;
        const width = this.enclosureDimensions.width * 0.0254;
        const height = this.enclosureDimensions.height * 0.0254;
        const isReptizoo = this.currentEnclosureData && this.currentEnclosureData.id && this.currentEnclosureData.id.includes('reptizoo');
        const isPVC = this.currentEnclosureData && this.currentEnclosureData.enclosureType === 'pvc';
        
        this.updateCameraPosition(length, width, height, isReptizoo, isPVC);
    }

    // Test method to verify zoom functionality
    testZoom() {
        console.log('Testing zoom functionality...');
        const currentDistance = this.camera.position.distanceTo(this.controls.target);
        console.log('Current distance:', currentDistance);
        console.log('Min distance:', this.controls.minDistance);
        console.log('Max distance:', this.controls.maxDistance);
        console.log('Zoom enabled:', this.controls.enableZoom);
        
        // Try manual zoom
        this.zoomCamera(0.8);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the builder when the page loads
window.addEventListener('load', () => {
    const builder = new EnclosureBuilder();
    
    // Add event listeners for controls
    document.getElementById('rotate-left').addEventListener('click', () => {
        builder.rotateCamera(-Math.PI / 4);
    });
    
    document.getElementById('rotate-right').addEventListener('click', () => {
        builder.rotateCamera(Math.PI / 4);
    });
    
    document.getElementById('zoom-in').addEventListener('click', () => {
        console.log('Zoom In button clicked');
        builder.zoomCamera(0.8);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        console.log('Zoom Out button clicked');
        builder.zoomCamera(1.2);
    });
    
    document.getElementById('reset-view').addEventListener('click', () => {
        builder.resetCamera();
    });
    
    document.getElementById('toggle-measurements').addEventListener('click', () => {
        const isVisible = builder.toggleMeasurements();
        const button = document.getElementById('toggle-measurements');
        button.textContent = isVisible ? '📏 Hide Measurements' : '📏 Show Measurements';
        console.log('Measurements toggled:', isVisible ? 'visible' : 'hidden');
    });

    // Help panel toggle
    document.getElementById('help-toggle').addEventListener('click', () => {
        const helpContent = document.getElementById('help-content');
        helpContent.classList.toggle('show');
    });

    // Close help panel when clicking outside
    document.addEventListener('click', (e) => {
        const helpPanel = document.querySelector('.camera-help');
        const helpContent = document.getElementById('help-content');
        
        if (!helpPanel.contains(e.target) && helpContent.classList.contains('show')) {
            helpContent.classList.remove('show');
        }
    });

    // Add keyboard shortcuts for camera controls
    document.addEventListener('keydown', (e) => {
        // Only activate if not typing in an input field
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case 'a':
                e.preventDefault();
                builder.rotateCamera(-Math.PI / 4);
                break;
            case 'd':
                e.preventDefault();
                builder.rotateCamera(Math.PI / 4);
                break;
            case 'w':
                e.preventDefault();
                console.log('W key pressed - Zoom In');
                builder.zoomCamera(0.8);
                break;
            case 's':
                e.preventDefault();
                console.log('S key pressed - Zoom Out');
                builder.zoomCamera(1.2);
                break;
            case 'r':
                e.preventDefault();
                builder.resetCamera();
                break;
            case 'm':
                e.preventDefault();
                console.log('M key pressed - Toggle Measurements');
                const isVisible = builder.toggleMeasurements();
                const button = document.getElementById('toggle-measurements');
                button.textContent = isVisible ? '📏 Hide Measurements' : '📏 Show Measurements';
                break;
        }
    });

    // Note: Dimension inputs are handled through enclosure selection in the HTML
    // The measurements will automatically update when an enclosure is selected
    
    // Global test functions for debugging
    window.testZoom = () => {
        if (window.enclosureBuilder) {
            window.enclosureBuilder.testZoom();
        } else {
            console.log('EnclosureBuilder not initialized');
        }
    };
    
    window.testZoomIn = () => {
        if (window.enclosureBuilder) {
            console.log('Manual zoom in test');
            window.enclosureBuilder.zoomCamera(0.8);
        }
    };
    
    window.testZoomOut = () => {
        if (window.enclosureBuilder) {
            console.log('Manual zoom out test');
            window.enclosureBuilder.zoomCamera(1.2);
        }
    };
}); 