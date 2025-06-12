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
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Create enclosure
        this.createEnclosure();

        // Start animation loop
        this.animate();

        // Add event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.setupDragAndDrop();

        // Make the builder globally accessible
        window.enclosureBuilder = this;
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

        // Update camera position
        const maxDim = Math.max(length, width, height);
        this.camera.position.set(maxDim * 2, maxDim * 1.5, maxDim * 2);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
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
        
        // Materials
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.25,
            roughness: 0,
            transmission: 0.95,
            thickness: 0.005,
            envMapIntensity: 1.0
        });

        const aluminumMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.1
        });

        const screenMaterial = new THREE.MeshBasicMaterial({
            color: 0x404040,
            transparent: true,
            opacity: 0.7
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

        // Door handles
        const handleGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.01);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

        const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        leftHandle.position.set(length/2 - 0.005, 0, -doorWidth/2 - frameThickness/2 - 0.02);
        leftHandle.rotation.z = Math.PI/2;
        enclosure.add(leftHandle);

        const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        rightHandle.position.set(length/2 - 0.005, 0, doorWidth/2 + frameThickness/2 + 0.02);
        rightHandle.rotation.z = Math.PI/2;
        enclosure.add(rightHandle);

        // Top ventilation screen
        const screenGeometry = new THREE.PlaneGeometry(length - 2*frameThickness, width - 2*frameThickness);
        const topScreen = new THREE.Mesh(screenGeometry, screenMaterial);
        topScreen.position.set(0, height/2 - 0.001, 0);
        topScreen.rotation.x = -Math.PI/2;
        enclosure.add(topScreen);

        // Side ventilation strips
        const sideScreenHeight = height * 0.2;
        const leftSideScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(length * 0.6, sideScreenHeight),
            screenMaterial
        );
        leftSideScreen.position.set(0, height * 0.2, -width/2 + 0.001);
        enclosure.add(leftSideScreen);

        const rightSideScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(length * 0.6, sideScreenHeight),
            screenMaterial
        );
        rightSideScreen.position.set(0, height * 0.2, width/2 - 0.001);
        enclosure.add(rightSideScreen);
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
        builder.controls.rotateLeft(Math.PI / 4);
    });
    
    document.getElementById('rotate-right').addEventListener('click', () => {
        builder.controls.rotateRight(Math.PI / 4);
    });
    
    document.getElementById('zoom-in').addEventListener('click', () => {
        builder.controls.zoomIn();
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        builder.controls.zoomOut();
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
}); 