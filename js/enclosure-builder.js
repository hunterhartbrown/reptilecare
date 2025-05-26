// Import Three.js from CDN in the HTML file
class EnclosureBuilder {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('enclosure-canvas'), antialias: true });
        this.items = [];
        this.selectedItem = null;
        this.enclosureDimensions = { length: 36, width: 18, height: 18 }; // Default size
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.6);
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

        // Add to scene
        this.scene.add(enclosure);

        // Update camera position
        const maxDim = Math.max(length, width, height);
        this.camera.position.set(maxDim * 2, maxDim * 1.5, maxDim * 2);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
    }

    updateEnclosureDimensions(length, width, height) {
        this.enclosureDimensions = { length, width, height };
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
        const container = this.renderer.domElement.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
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