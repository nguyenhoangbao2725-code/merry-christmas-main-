const ui = document.getElementById("ui-layer");
ui.classList.add("bottom");
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const MUSIC_URL = "./res/audio.mp3";
let bgMusic = new Audio(MUSIC_URL);
bgMusic.loop = true;
bgMusic.volume = 1.0;

const loader = new THREE.TextureLoader();
const photoFiles = [
  "./res/1.jpg",
  "./res/2.jpg",
  "./res/3.jpg",
  "./res/4.jpg",
  "./res/5.jpg",
  "./res/6.jpg",
  "./res/7.jpg",
  "./res/8.jpg",
  "./res/9.jpg",
];
shuffleArray(photoFiles);
const photoTextures = [];
photoFiles.forEach((f, i) => (photoTextures[i] = loader.load(f)));

// ---   CUSTOM COMPONENTS   ---
function createCustomTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const cx = 64,
    cy = 64;

  if (type === "gold_glow") {
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    grd.addColorStop(0, "#FFFFFF");
    grd.addColorStop(0.2, "#FFFFE0");
    grd.addColorStop(0.5, "#FFD700");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
  } else if (type === "red_light") {
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
    grd.addColorStop(0, "#FFAAAA");
    grd.addColorStop(0.3, "#FF0000");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
  } else if (type === "gift_red") {
    ctx.fillStyle = "#D32F2F"; //
    ctx.fillRect(20, 20, 88, 88);
    ctx.fillStyle = "#FFD700"; //
    ctx.fillRect(54, 20, 20, 88); //
    ctx.fillRect(20, 54, 88, 20); //

    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 88, 88);
  }
  return new THREE.CanvasTexture(canvas);
}
const textures = {
  gold: createCustomTexture("gold_glow"),
  red: createCustomTexture("red_light"),
  gift: createCustomTexture("gift_red"),
};
// ===== CREATE SOFT ROUND SNOW TEXTURE =====
function createSnowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0.0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.4)");
  grad.addColorStop(1.0, "rgba(255,255,255,0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}
function createSquareSoftEdgeMask(size = 256, fade = 32) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);

  // top
  let g = ctx.createLinearGradient(0, 0, 0, fade);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, fade);

  // bottom
  g = ctx.createLinearGradient(0, size - fade, 0, size);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, size - fade, size, fade);

  // left
  g = ctx.createLinearGradient(0, 0, fade, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, fade, size);

  // right
  g = ctx.createLinearGradient(size - fade, 0, size, 0);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(size - fade, 0, fade, size);

  return new THREE.CanvasTexture(canvas);
}
const photoEdgeMask = createSquareSoftEdgeMask();

function createPhotoMaterial(texture) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    alphaMap: photoEdgeMask,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
// ==========================================
// 3D SETUP
// ==========================================
const CONFIG = {
  goldCount: 1000,
  redCount: 150,
  giftCount: 100,
  explodeRadius: 65,
  photoOrbitRadius: 25,
  treeHeight: 70,
  treeBaseRadius: 35,
};

let scene, camera, renderer;
let groupGold, groupRed, groupGift; //
let photoMeshes = [];
let titleMesh, starMesh;

let state = "TREE";
let selectedIndex = 0;
let handX = 0.5;

// ==========================
function init3D() {
  const container = document.getElementById("canvas-container");
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.002);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  //
  groupGold = createParticleSystem("gold", CONFIG.goldCount, 2.0);
  groupRed = createParticleSystem("red", CONFIG.redCount, 3.5); //
  groupGift = createParticleSystem("gift", CONFIG.giftCount, 3.0); //

  createPhotos();
  createDecorations();
  // ========== SNOW SETUP ==========
  snowCount = 900;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(snowCount * 3);
  snowSpeeds = new Float32Array(snowCount);

  for (let i = 0; i < snowCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 600;
    positions[i * 3 + 1] = Math.random() * 400 + 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
    snowSpeeds[i] = 0.2 + Math.random() * 0.6;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const snowMat = new THREE.PointsMaterial({
    map: createSnowTexture(),
    size: 6,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  snow = new THREE.Points(geo, snowMat);
  scene.add(snow);
  animate();
}

function createParticleSystem(type, count, size) {
  const pPositions = [];
  const pExplodeTargets = [];
  const pTreeTargets = [];

  for (let i = 0; i < count; i++) {
    // ---   ---
    const h = Math.random() * CONFIG.treeHeight;
    const y = h - CONFIG.treeHeight / 2;

    //
    let radiusRatio =
      type === "gold" ? Math.sqrt(Math.random()) : 0.9 + Math.random() * 0.1;

    const maxR = (1 - h / CONFIG.treeHeight) * CONFIG.treeBaseRadius;
    const r = maxR * radiusRatio;
    const theta = Math.random() * Math.PI * 2;

    const tx = r * Math.cos(theta);
    const tz = r * Math.sin(theta);
    pTreeTargets.push(tx, y, tz);

    // ---   ---
    const u = Math.random();
    const v = Math.random();
    const phi = Math.acos(2 * v - 1);
    const lam = 2 * Math.PI * u;

    //
    let radMult = type === "gift" ? 1.2 : 1.0;
    const rad = CONFIG.explodeRadius * Math.cbrt(Math.random()) * radMult;

    const ex = rad * Math.sin(phi) * Math.cos(lam);
    const ey = rad * Math.sin(phi) * Math.sin(lam);
    const ez = rad * Math.cos(phi);
    pExplodeTargets.push(ex, ey, ez);

    //
    pPositions.push(tx, y, tz);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pPositions, 3));
  geo.userData = { tree: pTreeTargets, explode: pExplodeTargets };

  const mat = new THREE.PointsMaterial({
    size: size,
    map: textures[type],
    transparent: true,
    opacity: 1.0,
    //
    blending: type === "gift" ? THREE.NormalBlending : THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}
function createPhotoMesh(texture, baseSize = 8) {
  const img = texture.image;
  const aspect = img.width / img.height;

  let w, h;
  if (aspect >= 1) {
    w = baseSize;
    h = baseSize / aspect;
  } else {
    w = baseSize * aspect;
    h = baseSize;
  }

  const geo = new THREE.PlaneGeometry(w, h);
  const mat = createPhotoMaterial(texture);

  return new THREE.Mesh(geo, mat);
}
function createPhotos() {
  for (let i = 0; i < 5; i++) {
    const tex = photoTextures[i];
    if (!tex.image) {
      tex.onUpdate = () => {
        const mesh = createPhotoMesh(tex);
        mesh.visible = false;
        mesh.scale.set(0, 0, 0);
        scene.add(mesh);
        photoMeshes[i] = mesh;
      };
    } else {
      const mesh = createPhotoMesh(tex);
      mesh.visible = false;
      mesh.scale.set(0, 0, 0);
      scene.add(mesh);
      photoMeshes.push(mesh);
    }
  }
}

function createDecorations() {
  //
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.font = 'bold italic 90px "Times New Roman"';
  ctx.fillStyle = "#FFD700";
  ctx.textAlign = "center";
  ctx.shadowColor = "#FF0000";
  ctx.shadowBlur = 40;
  ctx.fillText("MERRY CHRISTMAS", 512, 130);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 15), mat);
  titleMesh.position.set(0, 50, 0);
  scene.add(titleMesh);

  //
  const starCanvas = document.createElement("canvas");
  starCanvas.width = 128;
  starCanvas.height = 128;
  const sCtx = starCanvas.getContext("2d");
  sCtx.fillStyle = "#FFFF00";
  sCtx.shadowColor = "#FFF";
  sCtx.shadowBlur = 20;
  sCtx.beginPath();
  const cx = 64,
    cy = 64,
    outer = 50,
    inner = 20;
  for (let i = 0; i < 5; i++) {
    sCtx.lineTo(
      cx + Math.cos(((18 + i * 72) / 180) * Math.PI) * outer,
      cy - Math.sin(((18 + i * 72) / 180) * Math.PI) * outer
    );
    sCtx.lineTo(
      cx + Math.cos(((54 + i * 72) / 180) * Math.PI) * inner,
      cy - Math.sin(((54 + i * 72) / 180) * Math.PI) * inner
    );
  }
  sCtx.closePath();
  sCtx.fill();
  const starTex = new THREE.CanvasTexture(starCanvas);
  const starMat = new THREE.MeshBasicMaterial({
    map: starTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  starMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), starMat);
  starMesh.position.set(0, CONFIG.treeHeight / 2 + 2, 0);
  scene.add(starMesh);
}

function updateParticleGroup(
  group,
  targetState,
  speed,
  handRotY,
  time,
  isBlinking
) {
  const positions = group.geometry.attributes.position.array;
  const targetKey = targetState === "TREE" ? "tree" : "explode";
  const targets =
    group.geometry.userData[targetState === "PHOTO" ? "explode" : targetKey];

  for (let i = 0; i < positions.length; i++) {
    positions[i] += (targets[i] - positions[i]) * speed;
  }
  group.geometry.attributes.position.needsUpdate = true;

  //
  if (targetState === "TREE") {
    group.rotation.y += 0.003;
    //
    if (isBlinking) {
      //
      //
      const scale = 1 + Math.sin(time * 5) * 0.2;
      group.scale.set(scale, scale, scale);
    } else {
      group.scale.set(1, 1, 1);
    }
  } else {
    group.scale.set(1, 1, 1);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;
  const speed = 0.06;
  const delta = handX - 0.5;
  const rotSpeed = delta * 0.08;
  groupGold.rotation.y += rotSpeed;
  groupRed.rotation.y += rotSpeed;
  groupGift.rotation.y += rotSpeed;

  updateParticleGroup(groupGold, state, speed, 0, time, false);
  updateParticleGroup(groupRed, state, speed, 0, time, false);
  updateParticleGroup(groupGift, state, speed, 0, time, false);

  photoMeshes.forEach((mesh, i) => {
    if (!mesh.material.map && photoTextures[i]) {
      mesh.material.map = photoTextures[i];
      mesh.material.needsUpdate = true;
    }
  });

  if (state === "TREE") {
    titleMesh.visible = true;
    starMesh.visible = true;
    titleMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    starMesh.rotation.z -= 0.02;

    photoMeshes.forEach((m) => {
      m.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      m.visible = false;
    });
  } else if (state === "EXPLODE") {
    titleMesh.visible = false;
    starMesh.visible = false;

    const baseAngle = groupGold.rotation.y;
    const angleStep = (Math.PI * 2) / 5;

    let bestIdx = 0;
    let maxZ = -999;

    photoMeshes.forEach((mesh, i) => {
      mesh.visible = true;

      const angle = baseAngle + i * angleStep;
      const x = Math.sin(angle) * CONFIG.photoOrbitRadius;
      const z = Math.cos(angle) * CONFIG.photoOrbitRadius;
      const y = Math.sin(time + i) * 3;

      mesh.position.lerp(new THREE.Vector3(x, y, z), 0.1);
      mesh.lookAt(camera.position);

      if (z > maxZ) {
        maxZ = z;
        bestIdx = i;
      }

      const scale = z > 5 ? 1.0 + (z / CONFIG.photoOrbitRadius) * 0.8 : 0.6;

      mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    });

    selectedIndex = bestIdx;
  } else if (state === "PHOTO") {
    photoMeshes.forEach((mesh, i) => {
      if (i === selectedIndex) {
        mesh.position.lerp(new THREE.Vector3(0, 0, 60), 0.1);
        mesh.scale.lerp(new THREE.Vector3(5, 5, 5), 0.1);
        mesh.lookAt(camera.position);
        mesh.rotation.z = 0;
      } else {
        mesh.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      }
    });
  }

  const pos = snow.geometry.attributes.position.array;
  for (let i = 0; i < snowCount; i++) {
    pos[i * 3 + 1] -= snowSpeeds[i];
    pos[i * 3] += Math.sin(time + i) * 0.03;

    if (pos[i * 3 + 1] < -150) {
      pos[i * 3 + 1] = 300;
      pos[i * 3] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 600;
    }
  }
  snow.geometry.attributes.position.needsUpdate = true;
  // ===== SNOW OPACITY BY STATE =====
  const targetOpacity = state === "EXPLODE" ? 0.2 : 0.9;
  snow.material.opacity += (targetOpacity - snow.material.opacity) * 0.08;
  renderer.render(scene, camera);
}

// ==========================================
function startSystem() {
  document.getElementById("btnStart").style.display = "none";
  bgMusic.play().catch((e) => console.log(e));
  init3D();

  const video = document.getElementsByClassName("input_video")[0];
  const canvas = document.getElementById("camera-preview");
  const ctx = canvas.getContext("2d");
  const statusDiv = document.getElementById("status");

  let frameCnt = 0;
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  hands.onResults((results) => {
    ctx.clearRect(0, 0, 100, 75);
    ctx.drawImage(results.image, 0, 0, 100, 75);

    if (results.multiHandLandmarks.length > 0) {
      const lm = results.multiHandLandmarks[0];
      handX = lm[9].x;

      const tips = [8, 12, 16, 20];
      const wrist = lm[0];
      let openDist = 0;
      tips.forEach(
        (i) => (openDist += Math.hypot(lm[i].x - wrist.x, lm[i].y - wrist.y))
      );
      const avgDist = openDist / 4;
      const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

      if (avgDist < 0.25) {
        state = "TREE";
        statusDiv.innerText = "✊ TREE";
        statusDiv.style.color = "#FFD700";
      } else if (pinchDist < 0.05) {
        state = "PHOTO";
        statusDiv.innerText = "👌 Image";
        statusDiv.style.color = "#00FFFF";
      } else {
        state = "EXPLODE";
        statusDiv.innerText = "🖐 Explode";
        statusDiv.style.color = "#FFA500";
      }
    } else {
      state = "TREE";
      statusDiv.innerText = "🎄 Merry Christmas 🎄";
      statusDiv.style.color = "#FFF";
    }
  });

  const cameraUtils = new Camera(video, {
    onFrame: async () => {
      frameCnt++;
      if (frameCnt % 3 !== 0) return;
      await hands.send({ image: video });
    },
    width: 320,
    height: 240,
  });
  cameraUtils.start();
}

window.addEventListener("resize", () => {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});
function logError(e) {
  document.getElementById("error-log").style.display = "block";
  document.getElementById("error-log").innerText += e + "\n";
}
