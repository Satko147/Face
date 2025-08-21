import * as THREE from "three";
import * as dat from "dat.gui";
import fragmentShd from "./shaders/fragment.glsl";
import vertexShd from "./shaders/vertex.glsl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// import model from "./assets/Cron_head.glb";
import model from "./assets/human_skull.glb";

const loader = new GLTFLoader();
const scene = new THREE.Scene();
const container = document.getElementById("container");
const gui = new dat.GUI();
const settings = {
  progress: 0
};
gui.add(settings, "progress", 0, 6, 0.01);

let height = window.innerHeight;
let width = window.innerWidth;

const imageAspect = 1;
let a1; let a2;
if (height/width > imageAspect) {
  a1 = (width/height) * imageAspect;
  a2 = 1;
} else {
  a1 = 1;
  a2 = (height/width) / imageAspect;
}

let rayCaster = new THREE.Raycaster();    //for reuse
let mouse = new THREE.Vector2();          //for reuse
let intersectPoint = new THREE.Vector3(); //for reuse
let mouseIsDown = false;
let mouseProgress = 0.0;
let interval1;
let interval2;
window.addEventListener('mousedown', () => {
  mouseIsDown = true;
  clearInterval(interval2);
  interval1 = setInterval(function() {
    if (mouseProgress <= 2.75) {
      mouseProgress += 0.2;
    }
  }, 50);
})

window.addEventListener('mouseup', function() {
  mouseIsDown = false;
  clearInterval(interval1);
  interval2 = setInterval(() => {
    if (mouseProgress >= 0) {
      mouseProgress -= 0.1;
    }
  }, 50);
});

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  rayCaster.setFromCamera(mouse, camera); // set rayCaster
  rayCaster.ray.intersectPlane(rayCastPlane, intersectPoint); // find the point of intersection
  skullModel.lookAt(intersectPoint); // face our arrow to this point
})



window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera1.aspect = window.innerWidth / window.innerHeight;
  camera1.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

//*************** CAMERA ***************//
const camera = new THREE.PerspectiveCamera(
  70,
  width / height,
  0.01,
  5
);
camera.position.set(0, -0.15, 1.1);

const camera1 = new THREE.PerspectiveCamera(
  70,
  width / height,
  0.5,
  3.9
)
camera1.position.set(0, 0, 2);
//**************************************//



//************** MAT & GEOM **************//

let rayCastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const material = new THREE.ShaderMaterial({
  fragmentShader: fragmentShd,
  vertexShader: vertexShd,
  uniforms: {
    time: { value: 0 },
    depthInfo: { value: null },
    resolution: { value: new THREE.Vector4() },
    cameraNear: { value: camera1.near },
    cameraFar: { value: camera.far },
    progress: { value: 0 }
  },
  extensions: {
    derivatives: "#extention GL_OES_standard_derivatives : enable"
  },
  side: THREE.DoubleSide
})
material.uniforms.resolution.x = width;
material.uniforms.resolution.y = height;
material.uniforms.resolution.z = a1;
material.uniforms.resolution.w = a2;
camera.updateProjectionMatrix();

// const planeGeometry = new THREE.PlaneGeometry(1, 1, 500, 500);
// const planeMesh = new THREE.Mesh( planeGeometry, material );
// scene.add( planeMesh );

let skullModel = null;
loader.load(model, (gltf) => {
  skullModel = gltf.scene.children[0];
  let s = 5;
  skullModel.scale.set(2*s*(window.innerWidth / window.innerHeight), s, s);
  skullModel.position.set(0, 0, -2.5)
  skullModel.traverse(o => {
    if (o.isMesh) {
      o.material = new THREE.MeshBasicMaterial({
        color: 0x000000
      })
    }
  })
  scene.add(skullModel);
})

const n = 84;
const lineMeshes = [];
for (let i=0; i<n; i++) {
  const geom = new THREE.PlaneGeometry(3, 0.008, 200, 1);
  let mesh = new THREE.Mesh(geom, material);
  let y = [];
  let len = geom.attributes.position.array.length;
  for (let j=0; j<len/3; j++) {
    y.push(i/100);
  }
  geom.setAttribute('y', new THREE.BufferAttribute(new Float32Array(y), 1));

  mesh.position.y = (i - 50)/50;
  lineMeshes.push(mesh);
  scene.add(mesh);
}

const target = new THREE.WebGLRenderTarget(width, height);
target.texture.format = THREE.RGBAFormat;
target.texture.minFilter = THREE.NearestFilter;
target.texture.magFilter = THREE.NearestFilter;
target.texture.generateMipmaps = false;
target.stencilBuffer = false;
target.depthBuffer = true;
target.depthTexture = new THREE.DepthTexture();
target.depthTexture.format = THREE.DepthFormat;
target.depthTexture.type = THREE.UnsignedShortType;

//**************************************//



//*************** LIGHTS ***************//

// const light = new THREE.DirectionalLight(0xffffff, 1);
// light.position.set(0, 0, 5);
// scene.add(light);

//**************************************//

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( width, height );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop( animate );
renderer.physicallyCorrectLights = true;
renderer.setClearColor(0x000000, 1);
document.getElementById("container").appendChild( renderer.domElement );

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.target = new THREE.Vector3(0, -0.15, 0);
// controls.update();

function animate( time ) {
  if (skullModel) {
    skullModel.position.z = mouseProgress*0.2 - 4.;
    // skullModel.rotation.y = 0.1*Math.sin(time/2000);
    skullModel.scale.x = 5.5*(window.innerWidth / window.innerHeight);
  }
  for (const line of lineMeshes) {
    line.visible = false;
  }
  renderer.setRenderTarget(target);
  renderer.render( scene, camera1 );
  material.uniforms.depthInfo.value = target.depthTexture;
  material.uniforms.progress.value = mouseProgress;
  material.uniforms.time.value = time;
  renderer.setRenderTarget(null);
  renderer.clear();
  // planeMesh.visible = true; // da ne bi doslo do render petlje
  for (const line of lineMeshes) {
    line.visible = true;
  }
  renderer.render( scene, camera );
}

