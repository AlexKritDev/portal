import './style.css'
import * as dat from 'dat.gui'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'

import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'

import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragShader from './shaders/portal/fragment.glsl';


/**
 * Base
 */
// Debug

const debugObj = {};
const gui = new dat.GUI({
    width: 300
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Object
 */
// const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshBasicMaterial()
// )
//
// scene.add(cube)


// texture

const bakedTexture = textureLoader.load('/baked.jpg');
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

//materials

const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture});

// pole light material

debugObj.portalColorStart ='#000000';
debugObj.portalColorEnd ='#ffffff';
const poleLightMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color(debugObj.portalColorEnd)});

gui.addColor(debugObj, 'portalColorStart').onChange(()=>{
    portalLightMaterial.uniforms.uColorStart.value.set(debugObj.portalColorStart)
});
gui.addColor(debugObj, 'portalColorEnd').onChange(()=>{
    portalLightMaterial.uniforms.uColorEnd.value.set(debugObj.portalColorEnd)
});

const portalLightMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragShader,
    uniforms: {
        uTime: {value: 0},
        uColorStart: {value: new THREE.Color(debugObj.portalColorStart)},
        uColorEnd: {value: new THREE.Color(debugObj.portalColorEnd)},
    }
});


//model
gltfLoader.load('portal.glb',
    (gltf) => {
        gltf.scene.traverse((child) => {
            const childName = child.name;
            if (childName === 'poleLightA' || childName === 'poleLightB') {
                child.material = poleLightMaterial;
            } else if (childName === 'portalLight') {
                child.material = portalLightMaterial;
            } else {
                child.material = bakedMaterial;
            }
        })
        scene.add(gltf.scene)
    });
//fireflies

const firefliesGeometry = new THREE.BufferGeometry()

const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3] = (Math.random() - .5) * 2.9;
    positionArray[i * 3 + 1] = Math.random() * 1.5;
    positionArray[i * 3 + 2] = (Math.random() - .5) * 3.4;

    scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));

const firefliesMaterial = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
        uPixelRation: {value: Math.min(window.devicePixelRatio, 2)},
        uSize: {value: 100},
        uTime: {value: 0},
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
});

gui.add(firefliesMaterial.uniforms.uSize, 'value', 1.0, 100.0, 1.0);
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    firefliesMaterial.uniforms.uPixelRation.value = Math.min(window.devicePixelRatio, 2);
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding;


debugObj.clearColor = '#52480f';
renderer.setClearColor(debugObj.clearColor);
gui.addColor(debugObj, 'clearColor').onChange(() => {
    renderer.setClearColor(debugObj.clearColor);
})


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    firefliesMaterial.uniforms.uTime.value = elapsedTime;
    portalLightMaterial.uniforms.uTime.value = elapsedTime;

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()