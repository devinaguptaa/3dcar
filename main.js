import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class ModelViewer {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.loaderElement = document.getElementById('loader');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.model = null;
        this.controls = null;

        this.init();
    }

    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.setClearColor(0xf8f8f7); // Match Swiss Cream White
        this.container.appendChild(this.renderer.domElement);

        // Camera setup
        this.camera.position.set(4, 2, 4);
        this.camera.lookAt(0, 0, 0);

        // Lighting - High contrast for a black car
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Key light
        const mainLight = new THREE.DirectionalLight(0xffffff, 2);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        // Rim light to highlight the car's silhouette
        const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
        rimLight.position.set(-5, 5, -5);
        this.scene.add(rimLight);

        // Bottom light to fill shadows
        const fillLight = new THREE.PointLight(0xffffff, 0.8);
        fillLight.position.set(0, -2, 0);
        this.scene.add(fillLight);

        // Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        this.controls.autoRotate = false;

        // Ensure base is sticky (constrain vertical rotation if needed)
        // this.controls.maxPolarAngle = Math.PI / 2; // Limit to horizon

        // Load Model
        this.loadModel();

        // Events
        window.addEventListener('resize', () => this.onResize());

        // Start animation
        this.animate();
    }

    loadModel() {
        const loader = new GLTFLoader();
        const modelUrl = '/911.glb';

        loader.load(
            modelUrl,
            (gltf) => {
                this.model = gltf.scene;
                this.scene.add(this.model);

                // Scale model first
                const box = new THREE.Box3().setFromObject(this.model);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.5 / maxDim;
                this.model.scale.set(scale, scale, scale);

                // Update world matrix to get accurate bounding box after scaling
                this.model.updateMatrixWorld(true);

                // Recalculate box and center after scaling
                const scaledBox = new THREE.Box3().setFromObject(this.model);
                const center = scaledBox.getCenter(new THREE.Vector3());

                // Reposition model so its geometric center is exactly at (0, 0, 0)
                this.model.position.x -= center.x;
                this.model.position.y -= center.y;
                this.model.position.z -= center.z;

                // Reset controls target to origin
                if (this.controls) {
                    this.controls.target.set(0, 0, 0);
                    this.controls.update();
                }

                // Hide loader
                this.loaderElement.style.opacity = '0';
                setTimeout(() => {
                    this.loaderElement.style.display = 'none';
                }, 500);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        if (this.model) {
            // Model rotation removed - now stationary
            // Subtle floating animation removed to keep "stuck to base" feel if desired, 
            // or keep it if "base" means the model itself is stationary but can float.
            // User said "base is sticked to the base", so let's remove floating too for a more grounded feel.
            // this.model.position.y = Math.sin(Date.now() * 0.001) * 0.1;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new ModelViewer();
