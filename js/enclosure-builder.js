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

    createEnclosure() {
        // Remove existing enclosure if any
        const existingEnclosure = this.scene.getObjectByName('enclosure');
        if (existingEnclosure) {
            this.scene.remove(existingEnclosure);
        }

        // Create enclosure group
        const enclosure = new THREE.Group();
        enclosure.name = 'enclosure';

        // Convert dimensions to meters (1 inch = 0.0254 meters)
        const length = this.enclosureDimensions.length * 0.0254;
        const width = this.enclosureDimensions.width * 0.0254;
        const height = this.enclosureDimensions.height * 0.0254;

        // Check if this is the REPTIZOO model for enhanced features
        const isReptizoo = this.currentEnclosureData && this.currentEnclosureData.id && this.currentEnclosureData.id.includes('reptizoo');

        if (isReptizoo) {
            this.createReptizooModel(enclosure, length, width, height);
        } else {
            this.createBasicEnclosure(enclosure, length, width, height);
        }

        // Add to scene
        this.scene.add(enclosure);

        // Update camera position - optimize for the model type
        this.updateCameraPosition(length, width, height, isReptizoo);
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
        
        // Materials - Improved glass that's visible from all angles
        const glassMaterial = new THREE.MeshLambertMaterial({
            color: 0xe8e8e8,  // Light grey tint
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,  // Render both sides to prevent disappearing
            depthWrite: false  // Prevent depth sorting issues
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

        // Back panel
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(glassThickness, height - 2*frameThickness, width - 2*frameThickness),
            glassMaterial
        );
        backPanel.position.set(-length/2 + glassThickness/2, 0, 0);
        enclosure.add(backPanel);

        // Side panels
        const leftPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, height - 2*frameThickness, glassThickness),
            glassMaterial
        );
        leftPanel.position.set(0, 0, -width/2 + glassThickness/2);
        enclosure.add(leftPanel);

        const rightPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, height - 2*frameThickness, glassThickness),
            glassMaterial
        );
        rightPanel.position.set(0, 0, width/2 - glassThickness/2);
        enclosure.add(rightPanel);

        // Bottom panel
        const bottomPanel = new THREE.Mesh(
            new THREE.BoxGeometry(length - 2*frameThickness, glassThickness, width - 2*frameThickness),
            glassMaterial
        );
        bottomPanel.position.set(0, -height/2 + glassThickness/2, 0);
        enclosure.add(bottomPanel);

        // Front doors (double hinge)
        const doorWidth = (length - 3*frameThickness) / 2;
        
        const leftDoor = new THREE.Mesh(
            new THREE.BoxGeometry(glassThickness, height - 2*frameThickness, doorWidth),
            glassMaterial
        );
        leftDoor.position.set(length/2 - glassThickness/2, 0, -doorWidth/2 - frameThickness/2);
        enclosure.add(leftDoor);

        const rightDoor = new THREE.Mesh(
            new THREE.BoxGeometry(glassThickness, height - 2*frameThickness, doorWidth),
            glassMaterial
        );
        rightDoor.position.set(length/2 - glassThickness/2, 0, doorWidth/2 + frameThickness/2);
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

        // Left door handle
        const leftHandleGeometry = new THREE.BoxGeometry(handleDepth, handleHeight, handleWidth);
        const leftHandle = new THREE.Mesh(leftHandleGeometry, handleMaterial);
        leftHandle.position.set(length/2 + 0.008, 0, -doorWidth/2 - frameThickness/2 - 0.015);
        enclosure.add(leftHandle);

        // Right door handle  
        const rightHandleGeometry = new THREE.BoxGeometry(handleDepth, handleHeight, handleWidth);
        const rightHandle = new THREE.Mesh(rightHandleGeometry, handleMaterial);
        rightHandle.position.set(length/2 + 0.008, 0, doorWidth/2 + frameThickness/2 + 0.015);
        enclosure.add(rightHandle);

        // Add handle mounting screws for realism
        const screwGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.002);
        const screwMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

        // Left handle screws
        const leftScrew1 = new THREE.Mesh(screwGeometry, screwMaterial);
        leftScrew1.position.set(length/2 + 0.006, 0.008, -doorWidth/2 - frameThickness/2 - 0.015);
        leftScrew1.rotation.z = Math.PI/2;
        enclosure.add(leftScrew1);

        const leftScrew2 = new THREE.Mesh(screwGeometry, screwMaterial);
        leftScrew2.position.set(length/2 + 0.006, -0.008, -doorWidth/2 - frameThickness/2 - 0.015);
        leftScrew2.rotation.z = Math.PI/2;
        enclosure.add(leftScrew2);

        // Right handle screws
        const rightScrew1 = new THREE.Mesh(screwGeometry, screwMaterial);
        rightScrew1.position.set(length/2 + 0.006, 0.008, doorWidth/2 + frameThickness/2 + 0.015);
        rightScrew1.rotation.z = Math.PI/2;
        enclosure.add(rightScrew1);

        const rightScrew2 = new THREE.Mesh(screwGeometry, screwMaterial);
        rightScrew2.position.set(length/2 + 0.006, -0.008, doorWidth/2 + frameThickness/2 + 0.015);
        rightScrew2.rotation.z = Math.PI/2;
        enclosure.add(rightScrew2);

        // Add door lock mechanism (center latch)
        const lockGeometry = new THREE.BoxGeometry(0.015, 0.006, 0.004);
        const lockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,  // Black plastic
            roughness: 0.9 
        });
        
        const doorLock = new THREE.Mesh(lockGeometry, lockMaterial);
        doorLock.position.set(length/2 + 0.005, -height/4, 0);  // Center between doors, lower position
        enclosure.add(doorLock);

        // Add door frame separators
        const frameSeparatorGeometry = new THREE.BoxGeometry(frameThickness, height - 2*frameThickness, frameThickness);
        
        // Center vertical separator between doors
        const centerSeparator = new THREE.Mesh(frameSeparatorGeometry, aluminumMaterial);
        centerSeparator.position.set(length/2 - frameThickness/2, 0, 0);
        enclosure.add(centerSeparator);

        // Add realistic hinges
        const hingeGeometry = new THREE.BoxGeometry(0.003, 0.015, 0.008);
        const hingeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,  // Dark metal
            metalness: 0.8,
            roughness: 0.3
        });

        // Left door hinges (2 hinges per door)
        const leftHinge1 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        leftHinge1.position.set(length/2 - 0.002, height/3, -width/2 + frameThickness);
        enclosure.add(leftHinge1);

        const leftHinge2 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        leftHinge2.position.set(length/2 - 0.002, -height/3, -width/2 + frameThickness);
        enclosure.add(leftHinge2);

        // Right door hinges
        const rightHinge1 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        rightHinge1.position.set(length/2 - 0.002, height/3, width/2 - frameThickness);
        enclosure.add(rightHinge1);

        const rightHinge2 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        rightHinge2.position.set(length/2 - 0.002, -height/3, width/2 - frameThickness);
        enclosure.add(rightHinge2);

        // Top ventilation screen with mesh pattern
        const topScreenWidth = length - 2*frameThickness;
        const topScreenDepth = width - 2*frameThickness;
        
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

        // Side ventilation strips with improved positioning
        const sideScreenHeight = height * 0.15;
        const sideScreenWidth = length * 0.7;
        
        // Left side ventilation
        const leftSideScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(sideScreenWidth, sideScreenHeight),
            screenMaterial
        );
        leftSideScreen.position.set(0, height * 0.25, -width/2 + 0.001);
        enclosure.add(leftSideScreen);

        // Right side ventilation
        const rightSideScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(sideScreenWidth, sideScreenHeight),
            screenMaterial
        );
        rightSideScreen.position.set(0, height * 0.25, width/2 - 0.001);
        enclosure.add(rightSideScreen);

        // Add REPTIZOO branding (small text on front bottom)
        // Note: In a real implementation, you'd use TextGeometry, but for simplicity we'll add a small logo placeholder
        const logoGeometry = new THREE.BoxGeometry(0.03, 0.005, 0.001);
        const logoMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(length/2 + 0.001, -height/2 + 0.02, 0);
        enclosure.add(logo);
    }

    updateEnclosureDimensions(length, width, height, enclosureData = null) {
        this.enclosureDimensions = { length, width, height };
        this.currentEnclosureData = enclosureData;
        this.createEnclosure();
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
    updateCameraPosition(length, width, height, isReptizoo = false) {
        const maxDim = Math.max(length, width, height);
        
        if (isReptizoo) {
            // Position camera to showcase REPTIZOO features (front-angled view)
            this.camera.position.set(maxDim * 1.8, maxDim * 1.2, maxDim * 2.2);
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
        
        this.updateCameraPosition(length, width, height, isReptizoo);
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
        }
    });

    // Add event listeners for dimension inputs
    const updateDimensions = () => {
        const length = parseFloat(document.getElementById('length').value) || 36;
        const width = parseFloat(document.getElementById('width').value) || 18;
        const height = parseFloat(document.getElementById('height').value) || 18;
        builder.updateEnclosureDimensions(length, width, height);
    };

    document.getElementById('length').addEventListener('change', updateDimensions);
    document.getElementById('width').addEventListener('change', updateDimensions);
    document.getElementById('height').addEventListener('change', updateDimensions);
    
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