// Solar System and Night Sky Interactive Features
console.log('Loading interactive.js...');

// Import Three.js from CDN (this will be referenced in HTML)
import * as THREE from 'three';
console.log('THREE loaded in interactive.js');
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
console.log('OrbitControls loaded in interactive.js');
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
console.log('CSS2DRenderer loaded in interactive.js');

// Solar System
class SolarSystem {
    constructor(containerId) {
        console.log('Initializing Solar System with container:', containerId);
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        try {
            this.init();
            this.loadTexturesAndCreateBodies();
        } catch (error) {
            console.error('Error initializing Solar System:', error);
            // Display error message in container
            this.container.innerHTML = `<div class="p-4 text-red-500">Error initializing Solar System: ${error.message}</div>`;
        }
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        console.log('Scene created');
        
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        console.log('Camera created');
        
        try {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            console.log('WebGL renderer created');
        } catch (error) {
            console.error('Failed to create WebGL renderer:', error);
            throw new Error('WebGL not supported or failed to initialize');
        }
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        console.log('Renderer added to container');

        // Initialize label renderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.container.appendChild(this.labelRenderer.domElement);

        // Camera position and movement settings
        this.camera.position.z = 100;
        this.camera.position.y = 50;
        this.camera.lookAt(0, 0, 0);
        this.moveSpeed = 1.0;
        this.rotateSpeed = 0.02;

        // Setup keyboard controls
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            // Only prevent default if the event originated from our container
            if (this.container.contains(e.target) || e.target === document.body) {
                this.keys[e.key] = true;
                if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                    e.preventDefault();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (this.container.contains(e.target) || e.target === document.body) {
                this.keys[e.key] = false;
            }
        });

        // Add control instructions
        const instructions = document.createElement('div');
        instructions.style.position = 'absolute';
        instructions.style.bottom = '10px';
        instructions.style.left = '10px';
        instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        instructions.style.padding = '10px';
        instructions.style.borderRadius = '5px';
        instructions.style.color = 'white';
        instructions.innerHTML = `
            Kontrollet:<br>
            W/S - Lëviz para/prapa<br>
            A/D - Lëviz majtas/djathtas<br>
            ←/→ - Rrotullo majtas/djathtas<br>
            ↑/↓ - Shiko lart/poshtë
        `;
        this.container.appendChild(instructions);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        const pointLight = new THREE.PointLight(0xffffff, 2, 300);
        pointLight.position.set(0, 0, 0); // Place at sun's position
        this.scene.add(ambientLight, pointLight);
        console.log('Lights added');

        // Start animation loop
        this.animate();
        console.log('Animation loop started');

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Enable scroll in container
        this.container.addEventListener('wheel', (event) => {
            event.stopPropagation();
        });
    }

    loadTexturesAndCreateBodies() {
        const textureLoader = new THREE.TextureLoader();
        const textures = {};
        const textureUrls = {
            sun: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/sun.jpg',
            mercury: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury.jpg',
            venus: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus.jpg',
            earth: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth.jpg',
            mars: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars.jpg',
            jupiter: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter.jpg',
            saturn: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn.jpg',
            uranus: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus.jpg',
            neptune: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/neptune.jpg'
        };

        // Create temporary objects while textures load
        this.createTemporaryBodies();
        console.log('Created temporary bodies while textures load');

        let loadedTextures = 0;
        const totalTextures = Object.keys(textureUrls).length;

        // Create fallback textures for each planet
        const fallbackColors = {
            sun: 0xffff00,
            mercury: 0x888888,
            venus: 0xffd700,
            earth: 0x0077ff,
            mars: 0xff4400,
            jupiter: 0xffaa00,
            saturn: 0xffd700,
            uranus: 0x00ffff,
            neptune: 0x0000ff
        };

        // Load all textures
        Object.entries(textureUrls).forEach(([name, url]) => {
            textureLoader.load(
                url,
                (texture) => {
                    console.log(`Loaded texture for ${name}`);
                    textures[name] = texture;
                    loadedTextures++;

                    // If all textures are loaded, create the real bodies
                    if (loadedTextures === totalTextures) {
                        console.log('All textures loaded, creating final bodies');
                        this.textures = textures;
                        this.createSun();
                        this.createPlanets();
                        this.createLabels();
                    }
                },
                undefined,
                (error) => {
                    console.error(`Error loading ${name} texture:`, error);
                    // Create a fallback texture with a solid color
                    const canvas = document.createElement('canvas');
                    canvas.width = 256;
                    canvas.height = 256;
                    const context = canvas.getContext('2d');
                    const color = fallbackColors[name];
                    const r = (color >> 16) & 255;
                    const g = (color >> 8) & 255;
                    const b = color & 255;
                    context.fillStyle = `rgb(${r},${g},${b})`;
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    
                    const fallbackTexture = new THREE.CanvasTexture(canvas);
                    textures[name] = fallbackTexture;
                    loadedTextures++;

                    // If this was the last texture (even though it failed), create the bodies
                    if (loadedTextures === totalTextures) {
                        console.log('All textures processed (some failed), creating final bodies');
                        this.textures = textures;
                        this.createSun();
                        this.createPlanets();
                        this.createLabels();
                    }
                }
            );
        });
    }

    createTemporaryBodies() {
        // Create a temporary sun with a basic yellow material
        const tempSunGeometry = new THREE.SphereGeometry(8, 32, 32);
        const tempSunMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xff6600,
            emissiveIntensity: 0.5
        });
        this.sun = new THREE.Mesh(tempSunGeometry, tempSunMaterial);
        this.scene.add(this.sun);

        // Create planets with enhanced colors
        const planets = [
            { name: 'Mërkuri', size: 0.8, distance: 15, color: 0xa5a5a5 },  // Silver-gray
            { name: 'Venusi', size: 1.2, distance: 20, color: 0xe6b800 },   // Golden-yellow
            { name: 'Toka', size: 1.5, distance: 28, color: 0x2244cc },     // Blue with hint of green
            { name: 'Marsi', size: 1.3, distance: 35, color: 0xcc4422 },    // Red-orange
            { name: 'Jupiteri', size: 4, distance: 45, color: 0xd8b690 },   // Beige with bands
            { name: 'Saturni', size: 3.5, distance: 55, color: 0xead6b8 },  // Pale gold
            { name: 'Urani', size: 2.5, distance: 65, color: 0x99ccff },    // Light blue
            { name: 'Neptuni', size: 2.3, distance: 75, color: 0x3344aa }   // Deep blue
        ];

        this.planets = planets.map(planet => {
            const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                color: planet.color,
                shininess: 5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = planet.distance;

            // Create orbit ring
            const orbitGeometry = new THREE.RingGeometry(planet.distance - 0.1, planet.distance + 0.1, 90);
            const orbitMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x666666,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbitRing.rotation.x = Math.PI / 2;
            this.scene.add(orbitRing);
            
            const orbit = new THREE.Object3D();
            orbit.add(mesh);
            this.scene.add(orbit);

            // Add Saturn's rings if it's Saturn
            if (planet.name === 'Saturni') {
                const ringGeometry = new THREE.RingGeometry(4, 7, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xc1a875,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 3;
                mesh.add(ring);
            }

            return {
                mesh,
                orbit,
                speed: planet.distance > 40 ? 0.001 : 0.003,
                name: planet.name
            };
        });
    }

    createSun() {
        const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
        const sunMaterial = new THREE.MeshPhongMaterial({ 
            map: this.textures.sun,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        
        // Remove old sun if it exists
        if (this.sun) {
            this.scene.remove(this.sun);
        }
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sun);

        // Add sun glow
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/glow.png'),
            color: 0xffff00,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(40, 40, 1);
        this.sun.add(sprite);
    }

    createPlanets() {
        if (!this.planets) return;

        // Remove old planets if they exist
        this.planets.forEach(planet => {
            if (planet.mesh) this.scene.remove(planet.mesh);
            if (planet.orbit) this.scene.remove(planet.orbit);
        });

        const planets = [
            { name: 'Mërkuri', size: 0.8, distance: 15, texture: 'mercury', speed: 0.01 },
            { name: 'Venusi', size: 1.2, distance: 20, texture: 'venus', speed: 0.008 },
            { name: 'Toka', size: 1.5, distance: 28, texture: 'earth', speed: 0.006 },
            { name: 'Marsi', size: 1.3, distance: 35, texture: 'mars', speed: 0.004 },
            { name: 'Jupiteri', size: 4, distance: 45, texture: 'jupiter', speed: 0.002 },
            { name: 'Saturni', size: 3.5, distance: 55, texture: 'saturn', speed: 0.001 },
            { name: 'Urani', size: 2.5, distance: 65, texture: 'uranus', speed: 0.0008 },
            { name: 'Neptuni', size: 2.3, distance: 75, texture: 'neptune', speed: 0.0006 }
        ];

        this.planets = planets.map(planet => {
            const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                map: this.textures[planet.texture],
                shininess: 5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = planet.distance;

            // Create orbit ring
            const orbitGeometry = new THREE.RingGeometry(planet.distance - 0.1, planet.distance + 0.1, 90);
            const orbitMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x666666,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbitRing.rotation.x = Math.PI / 2;
            this.scene.add(orbitRing);
            
            const orbit = new THREE.Object3D();
            orbit.add(mesh);
            this.scene.add(orbit);

            // Add Saturn's rings if it's Saturn
            if (planet.name === 'Saturni') {
                const ringGeometry = new THREE.RingGeometry(4, 7, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xc1a875,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 3;
                mesh.add(ring);
            }

            return {
                mesh,
                orbit,
                speed: planet.speed,
                name: planet.name
            };
        });
    }

    createLabels() {
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        this.container.appendChild(labelRenderer.domElement);

        // Sun label
        const sunLabel = this.createLabel('Dielli');
        this.sun.add(sunLabel);

        // Planet labels
        this.planets.forEach(planet => {
            const label = this.createLabel(planet.name);
            planet.mesh.add(label);
        });
    }

    createLabel(text) {
        const div = document.createElement('div');
        div.className = 'planet-label';
        div.textContent = text;
        div.style.color = '#00ff00'; // Bright green
        div.style.padding = '2px 6px';
        div.style.fontSize = '14px';
        div.style.fontWeight = 'bold';
        div.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)'; // Add shadow for better visibility
        div.style.pointerEvents = 'none';
        const label = new CSS2DObject(div);
        label.position.set(0, -2, 0); // Position label below the planet
        return label;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update camera based on keyboard input
        this.updateCamera();

        // Rotate sun
        if (this.sun) {
            this.sun.rotation.y += 0.001;
        }

        // Rotate planets
        if (this.planets && Array.isArray(this.planets)) {
            this.planets.forEach(planet => {
                if (planet && planet.orbit && planet.mesh) {
                    planet.orbit.rotation.y += planet.speed;
                    planet.mesh.rotation.y += planet.speed * 2;
                }
            });
        }

        // Update label visibility and orientation
        if (this.planets && Array.isArray(this.planets)) {
            this.planets.forEach(planet => {
                if (planet && planet.mesh) {
                    // Make labels always face the camera
                    const label = planet.mesh.children.find(child => child instanceof CSS2DObject);
                    if (label) {
                        label.element.style.opacity = '1'; // Always visible
                        label.quaternion.copy(this.camera.quaternion);
                    }
                }
            });
        }

        // Make sun label always face camera
        if (this.sun) {
            const sunLabel = this.sun.children.find(child => child instanceof CSS2DObject);
            if (sunLabel) {
                sunLabel.element.style.opacity = '1';
                sunLabel.quaternion.copy(this.camera.quaternion);
            }
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            if (this.labelRenderer) {
                this.labelRenderer.render(this.scene, this.camera);
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        if (this.labelRenderer) {
            this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    updateCamera() {
        if (!this.camera || !this.keys) return;

        // Forward/Backward
        if (this.keys['w'] || this.keys['W']) {
            this.camera.translateZ(-this.moveSpeed);
        }
        if (this.keys['s'] || this.keys['S']) {
            this.camera.translateZ(this.moveSpeed);
        }

        // Strafe left/right
        if (this.keys['a'] || this.keys['A']) {
            this.camera.translateX(-this.moveSpeed);
        }
        if (this.keys['d'] || this.keys['D']) {
            this.camera.translateX(this.moveSpeed);
        }

        // Rotation with arrow keys
        if (this.keys['ArrowLeft']) {
            this.camera.rotateY(this.rotateSpeed);
        }
        if (this.keys['ArrowRight']) {
            this.camera.rotateY(-this.rotateSpeed);
        }

        // Look up/down
        if (this.keys['ArrowUp']) {
            this.camera.rotateX(this.rotateSpeed);
        }
        if (this.keys['ArrowDown']) {
            this.camera.rotateX(-this.rotateSpeed);
        }

        // Limit vertical rotation
        const rotation = this.camera.rotation.x;
        if (rotation < -Math.PI / 2) this.camera.rotation.x = -Math.PI / 2;
        if (rotation > Math.PI / 2) this.camera.rotation.x = Math.PI / 2;
    }
}

// Night Sky Simulator
class NightSky {
    constructor(containerId) {
        console.log('Initializing Night Sky with container:', containerId);
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        try {
            this.init();
            this.setupKeyboardControls();
        } catch (error) {
            console.error('Error initializing Night Sky:', error);
            this.container.innerHTML = `<div class="p-4 text-red-500">Error initializing Night Sky: ${error.message}</div>`;
        }
    }

    init() {
        // Scene setup for star field
        this.scene = new THREE.Scene();
        console.log('Night Sky scene created');
        
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 1, 1000);
        console.log('Night Sky camera created');
        
        try {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            console.log('Night Sky WebGL renderer created');
            
            // Initialize CSS2D renderer for labels
            this.labelRenderer = new CSS2DRenderer();
            this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.labelRenderer.domElement.style.position = 'absolute';
            this.labelRenderer.domElement.style.top = '0';
            this.container.appendChild(this.labelRenderer.domElement);
            console.log('Night Sky label renderer created');
        } catch (error) {
            console.error('Failed to create Night Sky renderers:', error);
            throw new Error('WebGL not supported or failed to initialize');
        }
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        console.log('Night Sky renderer added to container');

        // Camera position for Albania's approximate latitude (41°N)
        this.camera.position.z = 100;
        this.camera.rotation.x = THREE.MathUtils.degToRad(41);

        // Disable OrbitControls as we'll use keyboard controls
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.maxPolarAngle = Math.PI / 1.5;
        // this.controls.minPolarAngle = Math.PI / 3;

        // Movement settings
        this.moveSpeed = 1.0;
        this.rotateSpeed = 0.02;

        // Create stars and constellations
        this.createStarField();
        this.createConstellations();
        console.log('Night Sky elements created');
        
        // Start animation
        this.animate();
        console.log('Night Sky animation loop started');
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Enable scroll in container
        this.container.addEventListener('wheel', (event) => {
            event.stopPropagation();
        });

        // Update the instructions to reflect new controls
        const instructions = document.createElement('div');
        instructions.style.position = 'absolute';
        instructions.style.bottom = '10px';
        instructions.style.left = '10px';
        instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        instructions.style.padding = '10px';
        instructions.style.borderRadius = '5px';
        instructions.style.color = 'white';
        instructions.innerHTML = `
            Kontrollet:<br>
            W/S - Lëviz para/prapa<br>
            A/D - Lëviz majtas/djathtas<br>
            ←/→ - Rrotullo majtas/djathtas<br>
            ↑/↓ - Shiko lart/poshtë
        `;
        this.container.appendChild(instructions);
    }

    setupKeyboardControls() {
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            // Only prevent default if the event originated from our container
            if (this.container.contains(e.target) || e.target === document.body) {
                this.keys[e.key] = true;
                if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                    e.preventDefault();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (this.container.contains(e.target) || e.target === document.body) {
                this.keys[e.key] = false;
            }
        });
    }

    animate() {
        if (!this.scene || !this.camera || !this.renderer) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Update camera based on keyboard input
        this.updateCamera();
        
        // Update label visibility based on camera direction
        if (this.constellations && Array.isArray(this.constellations)) {
            this.constellations.forEach(constellation => {
                if (!constellation || !constellation.centerPosition) return;
                
                const [x, y, z] = constellation.centerPosition;
                const distance = new THREE.Vector3(x, y, z)
                    .sub(this.camera.position)
                    .length();
                
                // Get all labels for this constellation
                const labels = this.scene.children.filter(
                    child => child instanceof CSS2DObject && 
                    child.element && 
                    child.element.textContent === constellation.name
                );
                
                // Show labels only when close enough
                labels.forEach(label => {
                    if (label && label.element) {
                        label.element.style.opacity = distance < 30 ? '1' : '0';
                    }
                });
            });
        }

        this.renderer.render(this.scene, this.camera);
        if (this.labelRenderer) {
            this.labelRenderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        if (this.labelRenderer) {
            this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    createStarField() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true
        });

        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    createConstellations() {
        const constellations = [
            {
                name: 'Arusha e Madhe',
                stars: [
                    [0, 10, 50], [5, 12, 50], [10, 15, 50], [15, 13, 50],
                    [12, 8, 50], [7, 6, 50], [2, 7, 50]
                ]
            },
            {
                name: 'Kasiopea',
                stars: [
                    [-10, 20, 40], [-8, 25, 40], [-5, 23, 40],
                    [-2, 25, 40], [0, 22, 40]
                ]
            },
            {
                name: 'Orioni',
                stars: [
                    [-20, 0, 45], [-18, 5, 45], [-15, 8, 45],
                    [-20, -5, 45], [-15, -8, 45], [-18, -10, 45]
                ]
            },
            {
                name: 'Drako',
                stars: [
                    [15, 30, 35], [18, 28, 35], [20, 25, 35],
                    [22, 22, 35], [25, 20, 35], [28, 18, 35]
                ]
            },
            {
                name: 'Pegasi',
                stars: [
                    [30, 15, 30], [33, 15, 30], [33, 12, 30],
                    [30, 12, 30]
                ]
            },
            {
                name: 'Luani',
                stars: [
                    [-25, 15, 40], [-22, 18, 40], [-20, 20, 40],
                    [-18, 17, 40], [-15, 15, 40], [-17, 12, 40]
                ]
            },
            {
                name: 'Binjakët',
                stars: [
                    [35, 25, 45], [37, 28, 45], [40, 30, 45],
                    [35, 20, 45], [37, 23, 45], [40, 25, 45]
                ]
            },
            {
                name: 'Demi',
                stars: [
                    [-30, 30, 35], [-27, 33, 35], [-25, 35, 35],
                    [-28, 28, 35], [-26, 30, 35]
                ]
            },
            {
                name: 'Shigjetari',
                stars: [
                    [25, -10, 40], [28, -8, 40], [30, -5, 40],
                    [27, -12, 40], [32, -7, 40]
                ]
            },
            {
                name: 'Akrepi',
                stars: [
                    [-15, -15, 45], [-12, -17, 45], [-10, -20, 45],
                    [-8, -22, 45], [-5, -25, 45], [-3, -27, 45]
                ]
            }
        ];

        this.constellations = constellations.map(constellation => {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({ color: 0x4a9eff });
            
            // Create vertices for constellation lines
            const vertices = constellation.stars.flat();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            
            const lines = new THREE.Line(geometry, material);
            this.scene.add(lines);

            // Add bright stars at constellation points
            const stars = constellation.stars.map(pos => {
                const starGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                const starMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff,
                    emissive: 0xffffcc,
                    emissiveIntensity: 0.5
                });
                const star = new THREE.Mesh(starGeometry, starMaterial);
                star.position.set(...pos);
                this.scene.add(star);
                return star;
            });

            return {
                name: constellation.name,
                lines,
                stars,
                centerPosition: constellation.stars[0]
            };
        });

        // Create labels after all constellations are created
        this.createLabels();
    }

    createLabels() {
        if (!this.constellations) return;
        
        this.constellations.forEach(constellation => {
            const div = document.createElement('div');
            div.className = 'constellation-label';
            div.textContent = constellation.name;
            div.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            div.style.color = 'white';
            div.style.padding = '2px 6px';
            div.style.borderRadius = '3px';
            div.style.fontSize = '12px';
            div.style.opacity = '0'; // Start with hidden labels
            const label = new CSS2DObject(div);
            
            // Position the label above the first star of the constellation
            const [x, y, z] = constellation.centerPosition;
            label.position.set(x, y + 2, z);
            this.scene.add(label);
        });
    }

    updateCamera() {
        if (!this.camera || !this.keys) return;

        // Forward/Backward
        if (this.keys['w'] || this.keys['W']) {
            this.camera.translateZ(-this.moveSpeed);
        }
        if (this.keys['s'] || this.keys['S']) {
            this.camera.translateZ(this.moveSpeed);
        }

        // Strafe left/right (sideways movement)
        if (this.keys['a'] || this.keys['A']) {
            this.camera.translateX(-this.moveSpeed);
        }
        if (this.keys['d'] || this.keys['D']) {
            this.camera.translateX(this.moveSpeed);
        }

        // Rotation with arrow keys
        if (this.keys['ArrowLeft']) {
            this.camera.rotateY(this.rotateSpeed);
        }
        if (this.keys['ArrowRight']) {
            this.camera.rotateY(-this.rotateSpeed);
        }

        // Look up/down
        if (this.keys['ArrowUp']) {
            this.camera.rotateX(this.rotateSpeed);
        }
        if (this.keys['ArrowDown']) {
            this.camera.rotateX(-this.rotateSpeed);
        }

        // Limit vertical rotation
        const rotation = this.camera.rotation.x;
        if (rotation < -Math.PI / 2) this.camera.rotation.x = -Math.PI / 2;
        if (rotation > Math.PI / 2) this.camera.rotation.x = Math.PI / 2;
    }
}

// Export for use in main application
export { SolarSystem, NightSky }; 
