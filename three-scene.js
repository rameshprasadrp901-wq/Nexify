// ===== THREE.JS 3D SCENE =====
(function initThree() {
    const container = document.getElementById('three-container');
    const fallback = document.getElementById('fallbackMsg');

    // Check WebGL support
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) throw new Error('WebGL not supported');
    } catch (e) {
        fallback.style.display = 'flex';
        return;
    }
    fallback.style.display = 'none';

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d0f);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x2ea043, 0.5, 10);
    pointLight.position.set(-1, 1, 2);
    scene.add(pointLight);

    // Main sphere
    const sphereGeo = new THREE.SphereGeometry(1.0, 40, 40);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x2ea043,
        emissive: 0x1a6b2e,
        emissiveIntensity: 0.25,
        roughness: 0.25,
        metalness: 0.3,
        transparent: true,
        opacity: 0.9,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Wireframe overlay
    const wireGeo = new THREE.SphereGeometry(1.05, 20, 20);
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x2ea043,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
    });
    const wireframe = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireframe);

    // Floating nodes
    const nodeGroup = new THREE.Group();
    const nodeCount = 24;
    const nodePositions = [];
    for (let i = 0; i < nodeCount; i++) {
        const size = 0.05 + Math.random() * 0.07;
        const nodeMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.6 ? 0x2ea043 : 0x58d68d,
            emissive: 0x1a6b2e,
            emissiveIntensity: 0.15,
        });
        const node = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), nodeMat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 1.6 + Math.random() * 0.5;
        node.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta) * 0.8,
            radius * Math.cos(phi)
        );
        nodeGroup.add(node);
        nodePositions.push({ theta, phi, radius, speed: 0.002 + Math.random() * 0.004 });
    }
    scene.add(nodeGroup);

    // Particles
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        const r = 2.5 + Math.random() * 2.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        particlePos[i] = r * Math.sin(phi) * Math.cos(theta);
        particlePos[i + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
        particlePos[i + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0x2ea043,
        size: 0.02,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    let isTouchDevice = false;

    document.addEventListener('touchstart', () => { isTouchDevice = true; }, { passive: true });

    document.addEventListener('mousemove', (e) => {
        if (isTouchDevice) return;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX = x * 0.5;
        mouseY = y * 0.35;
    });

    // Resize
    function resize() {
        const w = container.clientWidth;
        const h = container.clientHeight || 420;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    window.addEventListener('resize', resize);

    // Animation loop
    let time = 0;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.005;

        sphere.rotation.x += 0.002;
        sphere.rotation.y += 0.004;
        wireframe.rotation.x = sphere.rotation.x;
        wireframe.rotation.y = sphere.rotation.y;

        nodeGroup.children.forEach((node, idx) => {
            const data = nodePositions[idx];
            if (data) {
                data.theta += data.speed * 0.8;
                const r = data.radius + Math.sin(time * 0.5 + idx) * 0.06;
                node.position.x = r * Math.sin(data.theta) * Math.cos(data.phi);
                node.position.y = r * Math.sin(data.theta) * Math.sin(data.phi) * 0.8;
                node.position.z = r * Math.cos(data.theta);
            }
        });

        particles.rotation.y += 0.0005;
        particles.rotation.x += 0.0002;

        // Subtle mouse follow
        if (!isTouchDevice) {
            sphere.position.x += (mouseX * 0.06 - sphere.position.x) * 0.02;
            sphere.position.y += (-mouseY * 0.06 - sphere.position.y) * 0.02;
        }
        wireframe.position.copy(sphere.position);
        nodeGroup.position.copy(sphere.position);
        particles.position.copy(sphere.position);

        renderer.render(scene, camera);
    }

    animate();

    // Fallback if canvas fails
    setTimeout(() => {
        if (renderer.domElement && renderer.domElement.width === 0) {
            fallback.style.display = 'flex';
        }
    }, 800);
})();