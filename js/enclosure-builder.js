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
        this.topMeshVisible = false; // DEFAULT: No top mesh for better visibility and performance
        
        // Initialize shared materials for performance
        this.initSharedMaterials();
        
        this.init();
    }

    initSharedMaterials() {
        // Shared materials to reduce draw calls and memory usage
        this.sharedMaterials = {
            glass: new THREE.MeshLambertMaterial({
                color: 0xf0f0f0,
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide,
                depthWrite: false,
                flatShading: false
            }),
            
            aluminum: new THREE.MeshStandardMaterial({
                color: 0xc0c0c0,
                metalness: 0.9,
                roughness: 0.1
            }),
            
            pvc: new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                roughness: 0.3,
                metalness: 0.1
            }),
            
            screen: new THREE.MeshBasicMaterial({
                color: 0x2a2a2a,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            }),
            
            handle: new THREE.MeshStandardMaterial({ 
                color: 0x2c2c2c,
                roughness: 0.8,
                metalness: 0.1
            }),
            
            bottomPlastic: new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                roughness: 0.8,
                metalness: 0.1
            })
        };
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

    createEnclosure() {
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

        // Create enclosure group
        const enclosure = new THREE.Group();
        enclosure.name = 'enclosure';

        // Convert dimensions to meters (1 inch = 0.0254 meters)
        const length = this.enclosureDimensions.length * 0.0254;
        const width = this.enclosureDimensions.width * 0.0254;
        const height = this.enclosureDimensions.height * 0.0254;

        // Check the enclosure type for enhanced features
        const isReptizoo = this.currentEnclosureData && this.currentEnclosureData.id && this.currentEnclosureData.id.includes('reptizoo');
        const isPVC = this.currentEnclosureData && this.currentEnclosureData.enclosureType === 'pvc';

        if (isReptizoo) {
            this.createReptizooModel(enclosure, length, width, height);
        } else if (isPVC) {
            this.createPVCPanelModel(enclosure, length, width, height);
        } else {
            this.createBasicEnclosure(enclosure, length, width, height);
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
        // OPTIMIZED VERSION - Uses merged geometries for better performance
        
        // Create glass material
        const glassMaterial = this.sharedMaterials.glass;

        // Merge all glass panel geometries into one
        const mergedGlassGeometry = new THREE.BufferGeometry();
        const glassGeometries = [];

        // Create individual geometries and position them
        const glassThickness = 0.002;

        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(length, height, glassThickness);
        backWallGeometry.translate(0, 0, -width/2);
        glassGeometries.push(backWallGeometry);

        // Side walls
        const leftWallGeometry = new THREE.BoxGeometry(glassThickness, height, width);
        leftWallGeometry.translate(-length/2, 0, 0);
        glassGeometries.push(leftWallGeometry);

        const rightWallGeometry = new THREE.BoxGeometry(glassThickness, height, width);
        rightWallGeometry.translate(length/2, 0, 0);
        glassGeometries.push(rightWallGeometry);

        // Bottom
        const bottomGeometry = new THREE.BoxGeometry(length, glassThickness, width);
        bottomGeometry.translate(0, -height/2, 0);
        glassGeometries.push(bottomGeometry);

        // Merge all glass geometries into one - MAJOR PERFORMANCE BOOST
        const mergedGlass = THREE.BufferGeometryUtils.mergeBufferGeometries(glassGeometries);
        const glassMesh = new THREE.Mesh(mergedGlass, glassMaterial);
        glassMesh.name = 'merged-glass-panels';
        enclosure.add(glassMesh);

        // Enable geometry disposal for memory management
        glassGeometries.forEach(geo => geo.dispose());
    }

    createReptizooModel(enclosure, length, width, height) {
        // OPTIMIZED REPTIZOO MODEL - Merged geometries for better performance

        const frameThickness = 0.01;
        const glassThickness = 0.003;
        
        // Use shared materials
        const glassMaterial = this.sharedMaterials.glass;
        const aluminumMaterial = this.sharedMaterials.aluminum;
        const bottomMaterial = this.sharedMaterials.bottomPlastic;
        const railMaterial = this.sharedMaterials.bottomPlastic;
        const handleMaterial = this.sharedMaterials.handle;

        // STEP 1: Merge all aluminum frame pieces into one geometry
        const frameGeometries = [];
        const frameBoxGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, frameThickness);

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

        // Add frame corner geometries
        [...bottomCorners, ...topCorners].forEach(pos => {
            const frameGeo = frameBoxGeometry.clone();
            frameGeo.translate(pos[0], pos[1], pos[2]);
            frameGeometries.push(frameGeo);
        });

        // Vertical posts
        const verticalPostGeometry = new THREE.BoxGeometry(frameThickness, height, frameThickness);
        const verticalPosts = [
            [-length/2 + frameThickness/2, 0, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, 0, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, 0, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, 0, width/2 - frameThickness/2]
        ];

        verticalPosts.forEach(pos => {
            const postGeo = verticalPostGeometry.clone();
            postGeo.translate(pos[0], pos[1], pos[2]);
            frameGeometries.push(postGeo);
        });

        // Merge all frame geometries - REDUCES ~12 DRAW CALLS TO 1
        if (frameGeometries.length > 0) {
            const mergedFrameGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(frameGeometries);
            const frameMesh = new THREE.Mesh(mergedFrameGeometry, aluminumMaterial);
            frameMesh.name = 'merged-aluminum-frame';
            enclosure.add(frameMesh);
            
            // Clean up temporary geometries
            frameGeometries.forEach(geo => geo.dispose());
        }

        // STEP 2: Merge all glass panels into one geometry
        const glassGeometries = [];

        // Back panel
        const backPanelGeo = new THREE.BoxGeometry(length - 2*frameThickness, height - 2*frameThickness, glassThickness);
        backPanelGeo.translate(0, 0, -width/2 + glassThickness/2);
        glassGeometries.push(backPanelGeo);

        // Side panels
        const leftPanelGeo = new THREE.BoxGeometry(glassThickness, height - 2*frameThickness, width - 2*frameThickness);
        leftPanelGeo.translate(-length/2 + glassThickness/2, 0, 0);
        glassGeometries.push(leftPanelGeo);

        const rightPanelGeo = new THREE.BoxGeometry(glassThickness, height - 2*frameThickness, width - 2*frameThickness);
        rightPanelGeo.translate(length/2 - glassThickness/2, 0, 0);
        glassGeometries.push(rightPanelGeo);

        // Front doors
        const doorWidth = (length - 3*frameThickness) / 2;
        const railHeight = height * 0.25;
        const railThickness = 0.012;
        const doorHeight = height - 2*frameThickness - railHeight - railThickness;
        
        const leftDoorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, glassThickness);
        leftDoorGeo.translate(-doorWidth/2 - frameThickness/2, railHeight/2 + railThickness/2, width/2 - glassThickness/2);
        glassGeometries.push(leftDoorGeo);

        const rightDoorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, glassThickness);
        rightDoorGeo.translate(doorWidth/2 + frameThickness/2, railHeight/2 + railThickness/2, width/2 - glassThickness/2);
        glassGeometries.push(rightDoorGeo);

        // Merge all glass geometries - REDUCES ~5 DRAW CALLS TO 1
        const mergedGlassGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(glassGeometries);
        const glassMesh = new THREE.Mesh(mergedGlassGeometry, glassMaterial);
        glassMesh.name = 'merged-glass-panels';
        enclosure.add(glassMesh);

        // Clean up
        glassGeometries.forEach(geo => geo.dispose());

        // STEP 3: Create single bottom panel
        const bottomPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, 0.008, width - 2*frameThickness),
            bottomMaterial
        );
        bottomPanel.position.set(0, -height/2 + 0.004, 0);
        bottomPanel.name = 'bottom-panel';
        enclosure.add(bottomPanel);

        // STEP 4: Merge all rail components
        const railGeometries = [];
        
        // Create rail geometries and merge them
        const frontRailLeftGeo = new THREE.BoxGeometry((length - 3*frameThickness)/2, railThickness, railThickness);
        frontRailLeftGeo.translate(-(length - 3*frameThickness)/4 - frameThickness, -height/2 + railHeight, width/2 - railThickness/2);
        railGeometries.push(frontRailLeftGeo);
        
        const frontRailRightGeo = new THREE.BoxGeometry((length - 3*frameThickness)/2, railThickness, railThickness);
        frontRailRightGeo.translate((length - 3*frameThickness)/4 + frameThickness, -height/2 + railHeight, width/2 - railThickness/2);
        railGeometries.push(frontRailRightGeo);
        
        const backRailGeo = new THREE.BoxGeometry(length, railThickness, railThickness);
        backRailGeo.translate(0, -height/2 + railHeight, -width/2 + railThickness/2);
        railGeometries.push(backRailGeo);
        
        const leftRailGeo = new THREE.BoxGeometry(railThickness, railThickness, width);
        leftRailGeo.translate(-length/2 + railThickness/2, -height/2 + railHeight, 0);
        railGeometries.push(leftRailGeo);
        
        const rightRailGeo = new THREE.BoxGeometry(railThickness, railThickness, width);
        rightRailGeo.translate(length/2 - railThickness/2, -height/2 + railHeight, 0);
        railGeometries.push(rightRailGeo);

        // Merge all rails - REDUCES ~5 DRAW CALLS TO 1
        const mergedRailGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(railGeometries);
        const railMesh = new THREE.Mesh(mergedRailGeometry, railMaterial);
        railMesh.name = 'merged-rails';
        enclosure.add(railMesh);

        // Clean up
        railGeometries.forEach(geo => geo.dispose());

        // STEP 5: Center circle between glass doors (front middle)
        const circleRadius = 0.0127; // ~1 inch diameter
        const circleSegments = 48;
        const circleGeometry = new THREE.CircleGeometry(circleRadius, circleSegments);
        const centerCircle = new THREE.Mesh(circleGeometry, handleMaterial);
        const yFrontRail = -height/2 + railHeight; // Align with black front rail supporting the glass
        centerCircle.position.set(0, yFrontRail, width/2 + 0.001);
        centerCircle.name = 'front-center-circle';
        enclosure.add(centerCircle);
    }

    createPVCPanelModel(enclosure, length, width, height) {
        // OPTIMIZED PVC Panel model - Fixed top mesh handling
        
        // Use shared materials for performance
        const pvcMaterial = this.sharedMaterials.pvc;
        const aluminumMaterial = this.sharedMaterials.aluminum;
        const glassMaterial = this.sharedMaterials.glass;
        const acrylicMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf8f8f8,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1,
            transmission: 0.8
        });
        const handleMaterial = this.sharedMaterials.handle;

        const frameThickness = 0.015;  // Thicker aluminum frame
        const panelThickness = 0.008;   // PVC panel thickness

        // STEP 1: Create main structure frame (excluding top frame - it's optional)
        const frameGeometries = [];
        const frameBoxGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, frameThickness);
        
        // Bottom frame corners ONLY
        const bottomCorners = [
            [-length/2 + frameThickness/2, -height/2 + frameThickness/2, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, -height/2 + frameThickness/2, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, -height/2 + frameThickness/2, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, -height/2 + frameThickness/2, width/2 - frameThickness/2]
        ];

        // Add bottom frame corner geometries
        bottomCorners.forEach(pos => {
            const frameGeo = frameBoxGeometry.clone();
            frameGeo.translate(pos[0], pos[1], pos[2]);
            frameGeometries.push(frameGeo);
        });

        // Vertical frame posts
        const verticalPostGeometry = new THREE.BoxGeometry(frameThickness, height, frameThickness);
        const verticalPosts = [
            [-length/2 + frameThickness/2, 0, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, 0, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, 0, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, 0, width/2 - frameThickness/2]
        ];

        verticalPosts.forEach(pos => {
            const postGeo = verticalPostGeometry.clone();
            postGeo.translate(pos[0], pos[1], pos[2]);
            frameGeometries.push(postGeo);
        });

        // Merge main frame geometries (excluding top)
        if (frameGeometries.length > 0) {
            const mergedFrameGeometry = this.safelyMergeGeometries(frameGeometries, 'pvc-main-frame');
            if (mergedFrameGeometry) {
                const frameMesh = new THREE.Mesh(mergedFrameGeometry, aluminumMaterial);
                frameMesh.name = 'pvc-main-frame';
                enclosure.add(frameMesh);
                frameGeometries.forEach(geo => geo.dispose());
            }
        }

        // STEP 2: Create PVC panels (merged)
        const pvcGeometries = [];

        // Side panels
        const leftPanelGeo = new THREE.BoxGeometry(panelThickness, height - 2*frameThickness, width - 2*frameThickness);
        leftPanelGeo.translate(-length/2 + panelThickness/2, 0, 0);
        pvcGeometries.push(leftPanelGeo);

        const rightPanelGeo = new THREE.BoxGeometry(panelThickness, height - 2*frameThickness, width - 2*frameThickness);
        rightPanelGeo.translate(length/2 - panelThickness/2, 0, 0);
        pvcGeometries.push(rightPanelGeo);

        // Back panel
        const backPanelGeo = new THREE.BoxGeometry(length - 2*frameThickness, height - 2*frameThickness, panelThickness);
        backPanelGeo.translate(0, 0, -width/2 + panelThickness/2);
        pvcGeometries.push(backPanelGeo);

        // Bottom panel - FIXED POSITIONING to eliminate gap with walls
        const bottomPanelGeo = new THREE.BoxGeometry(length - 2*frameThickness, panelThickness*1.5, width - 2*frameThickness);
        bottomPanelGeo.translate(0, -height/2 + frameThickness + panelThickness*0.75, 0);
        pvcGeometries.push(bottomPanelGeo);

        // Merge PVC panels
        const mergedPVCGeometry = this.safelyMergeGeometries(pvcGeometries, 'pvc-panels');
        if (mergedPVCGeometry) {
            const pvcMesh = new THREE.Mesh(mergedPVCGeometry, pvcMaterial);
            pvcMesh.name = 'pvc-panels';
            enclosure.add(pvcMesh);
            pvcGeometries.forEach(geo => geo.dispose());
        }

        // STEP 3: Front section with glass sliding doors - NO CENTER FRAME
        const availableInteriorHeight = height - 2*frameThickness; // Space inside the frame
        const upperDoorHeight = availableInteriorHeight * 0.6;
        const blackBarHeight = 0.025;
        const lowerGlassHeight = availableInteriorHeight * 0.3;
        const doorWidth = (length - 2*frameThickness) / 2; // NO center frame, just 2 doors

        // Calculate proper Y positions to avoid clipping
        const topOfInterior = height/2 - frameThickness;
        const bottomOfInterior = -height/2 + frameThickness;
        
        // Add clearance gap to prevent z-fighting and clipping during rotation
        const topClearance = 0.008; // Small gap from top frame
        const bottomClearance = 0.010; // Increased gap from bottom frame (was 0.004, now 0.010)
        
        // Adjust available space accounting for clearances
        const adjustedAvailableHeight = availableInteriorHeight - topClearance - bottomClearance;
        const adjustedUpperDoorHeight = adjustedAvailableHeight * 0.75; // Increased from 0.6 to 0.75
        const adjustedLowerGlassHeight = adjustedAvailableHeight * 0.20; // Reduced from 0.3 to 0.20 (2/3rds smaller)
        
        // Upper doors position: start from top of interior with clearance, work down
        const upperDoorCenterY = topOfInterior - topClearance - adjustedUpperDoorHeight/2;
        
        // Black bar position: below upper doors with clearance
        const blackBarCenterY = topOfInterior - topClearance - adjustedUpperDoorHeight - blackBarHeight/2;
        
        // Add clearance between black bar and lower panel to prevent clipping
        const barToGlassClearance = 0.012; // Increased gap between black bar and lower glass (was 0.008)
        
        // Calculate bottom trim position and add clearance
        const bottomFrameHeight = 0.03; // Height of bottom trim piece
        const bottomTrimTopY = -height/2 + frameThickness + bottomFrameHeight;
        const trimToGlassClearance = 0.012; // Increased gap between bottom trim and lower glass (was 0.008)
        
        // Add extra safety margins to prevent frame clipping during rotation
        const extraTopSafety = 0.006; // Additional clearance from top frame
        const extraBottomSafety = 0.006; // Additional clearance from bottom frame
        
        // Calculate safe bounds within the aluminum frame with extra margins
        const safeTopBound = topOfInterior - topClearance - extraTopSafety;
        const safeBottomBound = bottomOfInterior + bottomClearance + extraBottomSafety;
        
        // Lower panel position: positioned between black bar and bottom trim with proper clearances
        const requestedTopY = blackBarCenterY - blackBarHeight/2 - barToGlassClearance;
        const requestedBottomY = bottomTrimTopY + trimToGlassClearance;
        
        // Ensure we stay within safe frame bounds
        const actualTopY = Math.min(requestedTopY, safeTopBound);
        const actualBottomY = Math.max(requestedBottomY, safeBottomBound);
        
        const availableSpaceForLowerPanel = actualTopY - actualBottomY;
        const lowerPanelCenterY = actualBottomY + availableSpaceForLowerPanel/2;

        // Debug logging for glass positioning validation
        console.log('PVC Glass Positioning Debug (with enhanced safety clearances):');
        console.log(`  Interior bounds: ${bottomOfInterior.toFixed(3)} to ${topOfInterior.toFixed(3)}`);
        console.log(`  Safe bounds (with extra margins): ${safeBottomBound.toFixed(3)} to ${safeTopBound.toFixed(3)}`);
        console.log(`  Top clearance: ${topClearance.toFixed(3)}, Bottom clearance: ${bottomClearance.toFixed(3)}`);
        console.log(`  Bar-to-glass clearance: ${barToGlassClearance.toFixed(3)} (increased from 0.008)`);
        console.log(`  Trim-to-glass clearance: ${trimToGlassClearance.toFixed(3)} (increased from 0.008)`);
        console.log(`  Extra safety margins: top ${extraTopSafety.toFixed(3)}, bottom ${extraBottomSafety.toFixed(3)}`);
        console.log(`  Bottom trim top Y: ${bottomTrimTopY.toFixed(3)}`);
        console.log(`  Requested bounds: ${requestedBottomY.toFixed(3)} to ${requestedTopY.toFixed(3)}`);
        console.log(`  Actual bounds used: ${actualBottomY.toFixed(3)} to ${actualTopY.toFixed(3)}`);
        console.log(`  Available space for lower panel: ${availableSpaceForLowerPanel.toFixed(3)}`);
        console.log(`  Adjusted upper door height: ${adjustedUpperDoorHeight.toFixed(3)} (was ${upperDoorHeight.toFixed(3)}) - 75% of space`);
        console.log(`  Adjusted lower panel height: ${adjustedLowerGlassHeight.toFixed(3)} - 20% of space (reduced from 30%)`);
        console.log(`  Upper door center Y: ${upperDoorCenterY.toFixed(3)} (bounds: ${(upperDoorCenterY - adjustedUpperDoorHeight/2).toFixed(3)} to ${(upperDoorCenterY + adjustedUpperDoorHeight/2).toFixed(3)})`);
        console.log(`  Black bar center Y: ${blackBarCenterY.toFixed(3)} (bounds: ${(blackBarCenterY - blackBarHeight/2).toFixed(3)} to ${(blackBarCenterY + blackBarHeight/2).toFixed(3)})`);
        console.log(`  Lower panel center Y: ${lowerPanelCenterY.toFixed(3)} (bounds: ${(lowerPanelCenterY - adjustedLowerGlassHeight/2).toFixed(3)} to ${(lowerPanelCenterY + adjustedLowerGlassHeight/2).toFixed(3)})`);
        console.log(`  Frame clearance check - Top: ${(safeTopBound - (lowerPanelCenterY + adjustedLowerGlassHeight/2)).toFixed(3)}, Bottom: ${(lowerPanelCenterY - adjustedLowerGlassHeight/2 - safeBottomBound).toFixed(3)}`);

        // Black horizontal bar (divider)
        const blackBar = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, blackBarHeight, panelThickness),
            pvcMaterial
        );
        blackBar.position.set(0, blackBarCenterY, width/2 - panelThickness/2);
        blackBar.name = 'pvc-black-bar';
        enclosure.add(blackBar);

        // Merge glass components - OVERLAPPING DOORS (no center frame)
        const glassGeometries = [];
        
        // Calculate overlapping door positions - doors nearly touch in middle
        const overlapAmount = 0.002; // Small overlap for realistic sliding doors
        const adjustedDoorWidth = doorWidth + overlapAmount; // Slightly wider doors

        // Upper sliding glass doors - OVERLAPPING DESIGN
        const leftDoorGeo = new THREE.BoxGeometry(adjustedDoorWidth, adjustedUpperDoorHeight, 0.004);
        leftDoorGeo.translate(-doorWidth/2, upperDoorCenterY, width/2 - 0.002);
        glassGeometries.push(leftDoorGeo);

        const rightDoorGeo = new THREE.BoxGeometry(adjustedDoorWidth, adjustedUpperDoorHeight, 0.004);
        rightDoorGeo.translate(doorWidth/2, upperDoorCenterY, width/2 - 0.002);
        glassGeometries.push(rightDoorGeo);

        // Lower acrylic viewing panel - POSITIONED WITHIN BOUNDS
        const lowerPanelGeo = new THREE.BoxGeometry(length - 2*frameThickness, adjustedLowerGlassHeight, 0.006);
        lowerPanelGeo.translate(0, lowerPanelCenterY, width/2 - 0.003);
        glassGeometries.push(lowerPanelGeo);

        // Merge glass components
        const mergedGlassGeometry = this.safelyMergeGeometries(glassGeometries, 'pvc-glass');
        if (mergedGlassGeometry) {
            const glassMesh = new THREE.Mesh(mergedGlassGeometry, glassMaterial);
            glassMesh.name = 'pvc-glass';
            enclosure.add(glassMesh);
            glassGeometries.forEach(geo => geo.dispose());
        }

        // NOTE: Center vertical frame REMOVED - doors now overlap naturally

        // STEP 4: Door handles - BLACK, VERTICAL (rotated 90 degrees), ON DOOR EDGES
        const handleLength = 0.08; // Much longer handles (was 0.02)
        const handleWidth = 0.004; // Thinner width (was 0.008)
        const handleDepth = 0.008; // Thicker depth for vertical orientation
        const handleGeometry = new THREE.BoxGeometry(handleWidth, handleLength, handleDepth);
        
        // Use black material for handles (same as PVC components)
        const blackHandleMaterial = pvcMaterial;

        // Left door handle - positioned on left edge of left door, vertical
        const leftHandle = new THREE.Mesh(handleGeometry, blackHandleMaterial);
        leftHandle.position.set(-doorWidth + adjustedDoorWidth/4, upperDoorCenterY, width/2 + 0.008);
        leftHandle.name = 'pvc-left-handle';
        enclosure.add(leftHandle);

        // Right door handle - positioned on right edge of right door, vertical
        const rightHandle = new THREE.Mesh(handleGeometry, blackHandleMaterial);
        rightHandle.position.set(doorWidth - adjustedDoorWidth/4, upperDoorCenterY, width/2 + 0.008);
        rightHandle.name = 'pvc-right-handle';
        enclosure.add(rightHandle);

        // STEP 5: Door tracks - FIXED POSITIONING
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0xa0a0a0,
            metalness: 0.7,
            roughness: 0.2
        });

        // Bottom track (at black bar level) - FIXED POSITIONING
        const bottomTrack = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, 0.008, 0.012),
            trackMaterial
        );
        bottomTrack.position.set(0, blackBarCenterY - blackBarHeight/2 - 0.004, width/2 - 0.006);
        bottomTrack.name = 'pvc-bottom-track';
        enclosure.add(bottomTrack);

        // STEP 6: Bottom black frame/trim (underneath lower glass, aligned with legs)
        const bottomFrame = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, bottomFrameHeight, panelThickness),
            pvcMaterial // Use same material as other black components
        );
        // Position at bottom of enclosure, just above the bottom aluminum frame
        bottomFrame.position.set(0, -height/2 + frameThickness + bottomFrameHeight/2, width/2 - panelThickness/2);
        bottomFrame.name = 'pvc-bottom-frame';
        enclosure.add(bottomFrame);

        // STEP 7: Wire management bump on right side wall (top right, outside)
        const wireManagementBump = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.025, 0.04), // Depth, height, width (oriented for side wall)
            pvcMaterial
        );
        // Position on outside of right side wall, top right corner when facing front
        wireManagementBump.position.set(
            length/2 - frameThickness - 0.0075, // On outside of right side wall
            height/2 - 0.06, // Near top
            0.05 // Forward from center, near front
        );
        wireManagementBump.name = 'pvc-wire-management';
        enclosure.add(wireManagementBump);

        // NOTE: Top track is now part of optional top mesh, not created here
        // NOTE: Screen mesh is now part of optional top mesh, not created here
        // NOTE: Top frame corners are now part of optional top mesh, not created here

        // Add brand marking
        const brandGeometry = new THREE.BoxGeometry(0.025, 0.004, 0.001);
        const brandMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const brand = new THREE.Mesh(brandGeometry, brandMaterial);
        brand.position.set(0, -height/2 + 0.015, width/2 + 0.001);
        brand.name = 'pvc-brand';
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
        console.log('Measurements toggled:', this.measurementsVisible);
    }

    toggleTopMesh() {
        this.topMeshVisible = !this.topMeshVisible;
        
        // Remove existing top mesh if any
        const existingTopMesh = this.scene.getObjectByName('top-mesh');
        if (existingTopMesh) {
            this.scene.remove(existingTopMesh);
        }
        
        // Add top mesh if enabled
        if (this.topMeshVisible) {
            this.createTopMesh();
        }
        
        console.log('Top mesh toggled:', this.topMeshVisible);
        
        // Update button text if available
        const topMeshButton = document.getElementById('toggle-top-mesh');
        if (topMeshButton) {
            topMeshButton.innerHTML = this.topMeshVisible ? '🚫 Remove Top' : '📦 Add Top';
        }
    }

    createTopMesh() {
        // Convert dimensions to meters
        const length = this.enclosureDimensions.length * 0.0254;
        const width = this.enclosureDimensions.width * 0.0254;
        const height = this.enclosureDimensions.height * 0.0254;

        // Check the enclosure type to match the style
        const isReptizoo = this.currentEnclosureData && this.currentEnclosureData.id && this.currentEnclosureData.id.includes('reptizoo');
        const isPVC = this.currentEnclosureData && this.currentEnclosureData.enclosureType === 'pvc';

        const topMeshGroup = new THREE.Group();
        topMeshGroup.name = 'top-mesh';

        if (isReptizoo) {
            this.createReptizooTopMesh(topMeshGroup, length, width, height);
        } else if (isPVC) {
            this.createPVCTopMesh(topMeshGroup, length, width, height);
        } else {
            this.createBasicTopMesh(topMeshGroup, length, width, height);
        }

        this.scene.add(topMeshGroup);
    }

    createBasicTopMesh(topMeshGroup, length, width, height) {
        // Simple glass top for basic enclosures
        const glassMaterial = this.sharedMaterials.glass;
        const glassThickness = 0.002;

        const topPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length, glassThickness, width),
            glassMaterial
        );
        topPanel.position.set(0, height/2, 0);
        topPanel.name = 'basic-top';
        topMeshGroup.add(topPanel);
    }

    createReptizooTopMesh(topMeshGroup, length, width, height) {
        // REPTIZOO style screen top with black rim (OPTIMIZED)
        const frameThickness = 0.01;
        const rimMaterial = this.sharedMaterials.bottomPlastic;
        const screenMaterial = this.sharedMaterials.screen;

        // Create rim frame (merged geometry for performance)
        const rimGeometries = [];
        const rimThickness = 0.008;
        const rimHeight = 0.003;

        // Top rim pieces
        const topRimGeo = new THREE.BoxGeometry(length, rimHeight, rimThickness);
        topRimGeo.translate(0, height/2 + rimHeight/2, -width/2 + rimThickness/2);
        rimGeometries.push(topRimGeo);

        const bottomRimGeo = new THREE.BoxGeometry(length, rimHeight, rimThickness);
        bottomRimGeo.translate(0, height/2 + rimHeight/2, width/2 - rimThickness/2);
        rimGeometries.push(bottomRimGeo);

        const leftRimGeo = new THREE.BoxGeometry(rimThickness, rimHeight, width);
        leftRimGeo.translate(-length/2 + rimThickness/2, height/2 + rimHeight/2, 0);
        rimGeometries.push(leftRimGeo);

        const rightRimGeo = new THREE.BoxGeometry(rimThickness, rimHeight, width);
        rightRimGeo.translate(length/2 - rimThickness/2, height/2 + rimHeight/2, 0);
        rimGeometries.push(rightRimGeo);

        // Merge rim geometries for better performance
        const mergedRimGeometry = this.safelyMergeGeometries(rimGeometries, 'reptizoo-top-rim');
        if (mergedRimGeometry) {
            const rimMesh = new THREE.Mesh(mergedRimGeometry, rimMaterial);
            rimMesh.name = 'reptizoo-top-rim';
            topMeshGroup.add(rimMesh);
            rimGeometries.forEach(geo => geo.dispose());
        }

        // Simple screen panel instead of individual mesh elements (PERFORMANCE OPTIMIZED)
        const screenWidth = length - 2*frameThickness;
        const screenDepth = width - 2*frameThickness;

        const screenPanel = new THREE.Mesh(
            new THREE.PlaneGeometry(screenWidth, screenDepth),
            screenMaterial
        );
        screenPanel.position.set(0, height/2 + 0.001, 0);
        screenPanel.rotation.x = -Math.PI/2;
        screenPanel.name = 'reptizoo-screen';
        topMeshGroup.add(screenPanel);
    }

    createPVCTopMesh(topMeshGroup, length, width, height) {
        // FIXED PVC style top mesh - includes frame, track, and screen
        const aluminumMaterial = this.sharedMaterials.aluminum;
        const screenMaterial = this.sharedMaterials.screen;
        const frameThickness = 0.015;

        // STEP 1: Top frame corners (that were excluded from main structure)
        const topFrameGeometries = [];
        const frameBoxGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, frameThickness);

        const topCorners = [
            [-length/2 + frameThickness/2, height/2 - frameThickness/2, -width/2 + frameThickness/2],
            [length/2 - frameThickness/2, height/2 - frameThickness/2, -width/2 + frameThickness/2],
            [-length/2 + frameThickness/2, height/2 - frameThickness/2, width/2 - frameThickness/2],
            [length/2 - frameThickness/2, height/2 - frameThickness/2, width/2 - frameThickness/2]
        ];

        // Add top frame corner geometries
        topCorners.forEach(pos => {
            const frameGeo = frameBoxGeometry.clone();
            frameGeo.translate(pos[0], pos[1], pos[2]);
            topFrameGeometries.push(frameGeo);
        });

        // Top horizontal frame rails
        const frontRailGeo = new THREE.BoxGeometry(length, frameThickness, frameThickness);
        frontRailGeo.translate(0, height/2 - frameThickness/2, width/2 - frameThickness/2);
        topFrameGeometries.push(frontRailGeo);

        const backRailGeo = new THREE.BoxGeometry(length, frameThickness, frameThickness);
        backRailGeo.translate(0, height/2 - frameThickness/2, -width/2 + frameThickness/2);
        topFrameGeometries.push(backRailGeo);

        const leftRailGeo = new THREE.BoxGeometry(frameThickness, frameThickness, width - 2*frameThickness);
        leftRailGeo.translate(-length/2 + frameThickness/2, height/2 - frameThickness/2, 0);
        topFrameGeometries.push(leftRailGeo);

        const rightRailGeo = new THREE.BoxGeometry(frameThickness, frameThickness, width - 2*frameThickness);
        rightRailGeo.translate(length/2 - frameThickness/2, height/2 - frameThickness/2, 0);
        topFrameGeometries.push(rightRailGeo);

        // Merge all top frame geometries
        const mergedTopFrameGeometry = this.safelyMergeGeometries(topFrameGeometries, 'pvc-top-frame');
        if (mergedTopFrameGeometry) {
            const topFrameMesh = new THREE.Mesh(mergedTopFrameGeometry, aluminumMaterial);
            topFrameMesh.name = 'pvc-top-frame';
            topMeshGroup.add(topFrameMesh);
            topFrameGeometries.forEach(geo => geo.dispose());
        }

        // STEP 2: Top track (for sliding doors) - FIXED POSITIONING
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0xa0a0a0,
            metalness: 0.7,
            roughness: 0.2
        });

        // Calculate proper position for top track - should align with upper doors
        const topOfInterior = height/2 - frameThickness;
        const availableInteriorHeight = height - 2*frameThickness;
        const upperDoorHeight = availableInteriorHeight * 0.6;
        const topTrackY = topOfInterior - 0.004; // Just below the top frame

        const topTrack = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, 0.008, 0.012),
            trackMaterial
        );
        topTrack.position.set(0, topTrackY, width/2 - 0.006);
        topTrack.name = 'pvc-top-track';
        topMeshGroup.add(topTrack);

        // STEP 3: Screen panel (OPTIMIZED - single panel instead of individual mesh elements)
        const screenWidth = length - 2*frameThickness;
        const screenDepth = width - 2*frameThickness;

        const screenPanel = new THREE.Mesh(
            new THREE.PlaneGeometry(screenWidth, screenDepth),
            screenMaterial
        );
        screenPanel.position.set(0, height/2 - frameThickness/2, 0);
        screenPanel.rotation.x = -Math.PI/2;
        screenPanel.name = 'pvc-screen';
        topMeshGroup.add(screenPanel);

        // STEP 4: Corner reinforcements (typical of PVC construction)
        const cornerMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4
        });

        const cornerGeometries = [];
        const cornerSize = 0.012;
        const cornerBoxGeometry = new THREE.BoxGeometry(cornerSize, cornerSize, cornerSize);

        const cornerPositions = [
            [-length/2 + cornerSize/2, height/2 - cornerSize/2, -width/2 + cornerSize/2],
            [length/2 - cornerSize/2, height/2 - cornerSize/2, -width/2 + cornerSize/2],
            [-length/2 + cornerSize/2, height/2 - cornerSize/2, width/2 - cornerSize/2],
            [length/2 - cornerSize/2, height/2 - cornerSize/2, width/2 - cornerSize/2]
        ];

        cornerPositions.forEach(pos => {
            const cornerGeo = cornerBoxGeometry.clone();
            cornerGeo.translate(pos[0], pos[1], pos[2]);
            cornerGeometries.push(cornerGeo);
        });

        // Merge corner reinforcements
        const mergedCornerGeometry = this.safelyMergeGeometries(cornerGeometries, 'pvc-corners');
        if (mergedCornerGeometry) {
            const cornerMesh = new THREE.Mesh(mergedCornerGeometry, cornerMaterial);
            cornerMesh.name = 'pvc-corners';
            topMeshGroup.add(cornerMesh);
            cornerGeometries.forEach(geo => geo.dispose());
        }
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

    safelyMergeGeometries(geometries, materialName = 'merged') {
        // Check if BufferGeometryUtils is available
        if (!THREE.BufferGeometryUtils || !THREE.BufferGeometryUtils.mergeBufferGeometries) {
            console.warn('BufferGeometryUtils not available, falling back to individual meshes');
            return null;
        }

        try {
            // Filter out any null/undefined geometries
            const validGeometries = geometries.filter(geo => geo && geo.attributes);
            
            if (validGeometries.length === 0) {
                console.warn('No valid geometries to merge');
                return null;
            }

            const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(validGeometries);
            if (!merged) {
                console.warn('Geometry merging failed');
                return null;
            }

            console.log(`Successfully merged ${validGeometries.length} geometries for ${materialName}`);
            return merged;
        } catch (error) {
            console.error('Error merging geometries:', error);
            return null;
        }
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
            case 't':
                e.preventDefault();
                console.log('T key pressed - Toggle Top Mesh');
                builder.toggleTopMesh();
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