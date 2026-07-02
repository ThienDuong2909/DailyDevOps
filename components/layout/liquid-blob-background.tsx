"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type BlobState = {
  mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial>;
  material: THREE.ShaderMaterial;
  center: THREE.Vector3;
  velocity: THREE.Vector3;
  baseScale: number;
  driftX: number;
  driftY: number;
  driftSpeed: number;
  turnSpeed: number;
  seed: number;
  age: number;
  birthDuration: number;
  lifeDuration: number;
};

type LiquidBlobBackgroundProps = {
  count?: number;
  className?: string;
};

const BLOB_COLOR = new THREE.Color("#137fec");
const BLOB_OPACITY = 0.3;
const TURN_AXIS = new THREE.Vector3(0, 0, 1);
const VIEW_HEIGHT = 10;
const MIN_BLOBS = 6;
const MAX_BLOBS = 10;
const VERTEX_SHADER = `
uniform float u_intensity;
uniform float u_time;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDisplacement;

vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vDisplacement = cnoise(position + vec3(1.85 * u_time));

  vec3 newPosition = position + normal * (u_intensity * vDisplacement);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform vec3 u_color;
uniform float u_opacity;
uniform float u_time;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDisplacement;

void main() {
  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 1.9);
  float glow = 0.72 + 0.22 * sin(vUv.y * 7.0 + u_time + vDisplacement * 2.0);
  float highlight = smoothstep(0.48, 0.0, distance(vUv, vec2(0.36, 0.3)));
  vec3 color = u_color * glow + vec3(0.36, 0.82, 1.0) * highlight * 0.42 + vec3(0.12, 0.5, 1.0) * rim * 0.5;

  gl_FragColor = vec4(color, u_opacity);
}
`;

function randomUnit() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    return 0.5;
  }

  const values = new Uint32Array(1);
  cryptoApi.getRandomValues(values);
  return values[0] / 2 ** 32;
}

function randomBetween(min: number, max: number) {
  return min + randomUnit() * (max - min);
}

function easeOutBack(progress: number) {
  const overshoot = 1.72;
  const shifted = progress - 1;
  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
}

function getBounds(aspect: number) {
  const halfHeight = VIEW_HEIGHT / 2;
  const halfWidth = halfHeight * aspect;

  return {
    minX: -halfWidth - 0.8,
    maxX: halfWidth + 0.8,
    minY: -halfHeight - 0.8,
    maxY: halfHeight + 0.8,
  };
}

function isOutsideBounds(
  position: THREE.Vector3,
  aspect: number,
  scale: number,
) {
  const bounds = getBounds(aspect);
  const margin = scale + 0.8;

  return (
    position.x < bounds.minX - margin ||
    position.x > bounds.maxX + margin ||
    position.y < bounds.minY - margin ||
    position.y > bounds.maxY + margin
  );
}

function createMaterial(opacity: number) {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      u_color: { value: BLOB_COLOR },
      u_intensity: { value: 0.5 },
      u_opacity: { value: opacity },
      u_time: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
}

function createBlob(
  geometry: THREE.IcosahedronGeometry,
  aspect: number,
  opacity: number,
): BlobState {
  const material = createMaterial(opacity);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  const blob: BlobState = {
    mesh,
    material,
    center: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    baseScale: 1,
    driftX: 0,
    driftY: 0,
    driftSpeed: 1,
    turnSpeed: 0,
    seed: randomBetween(0, Math.PI * 2),
    age: 0,
    birthDuration: randomBetween(1.2, 1.8),
    lifeDuration: randomBetween(12, 22),
  };

  respawnBlob(blob, aspect);
  return blob;
}

function respawnBlob(blob: BlobState, aspect: number) {
  const bounds = getBounds(aspect);
  const angle = randomBetween(0, Math.PI * 2);
  const speed = randomBetween(0.32, 0.58);

  blob.center.set(
    randomBetween(bounds.minX, bounds.maxX),
    randomBetween(bounds.minY, bounds.maxY),
    randomBetween(-1.8, 0.5),
  );
  blob.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);
  blob.baseScale = randomBetween(0.9, 1.85);
  blob.driftX = randomBetween(0.16, 0.42);
  blob.driftY = randomBetween(0.14, 0.36);
  blob.driftSpeed = randomBetween(0.055, 0.12);
  blob.turnSpeed = randomBetween(0.16, 0.32);
  blob.seed = randomBetween(0, Math.PI * 2);
  blob.age = 0;
  blob.birthDuration = randomBetween(1.15, 1.85);
  blob.lifeDuration = randomBetween(13, 24);
  blob.mesh.position.copy(blob.center);
  blob.mesh.scale.setScalar(0.001);
}

function updateBlob(
  blob: BlobState,
  elapsed: number,
  dt: number,
  aspect: number,
) {
  blob.age += dt;
  if (
    blob.age > blob.lifeDuration ||
    isOutsideBounds(blob.center, aspect, blob.baseScale)
  ) {
    respawnBlob(blob, aspect);
  }

  blob.center.addScaledVector(blob.velocity, dt);
  blob.velocity.applyAxisAngle(
    TURN_AXIS,
    Math.sin(elapsed * blob.turnSpeed + blob.seed) * dt * 0.16,
  );

  const birthProgress = Math.min(blob.age / blob.birthDuration, 1);
  const birthScale = Math.max(easeOutBack(birthProgress), 0);
  const breathe = 1 + Math.sin(elapsed * 0.72 + blob.seed) * 0.035;
  const scale = blob.baseScale * birthScale * breathe;
  const driftTime = elapsed * blob.driftSpeed + blob.seed;

  blob.mesh.position.set(
    blob.center.x + Math.sin(driftTime) * blob.driftX,
    blob.center.y + Math.cos(driftTime * 0.86) * blob.driftY,
    blob.center.z + Math.sin(driftTime * 0.42) * 0.18,
  );
  blob.mesh.rotation.x += dt * (0.035 + blob.driftSpeed * 0.08);
  blob.mesh.rotation.y += dt * (0.05 + blob.driftSpeed * 0.1);
  blob.mesh.scale.setScalar(scale);
  blob.material.uniforms.u_time.value = elapsed * 0.38 + blob.seed;
  blob.material.uniforms.u_intensity.value =
    0.48 + Math.sin(elapsed * 0.48 + blob.seed) * 0.08;
}

export function LiquidBlobBackground({
  count = 8,
  className = "",
}: Readonly<LiquidBlobBackgroundProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let frameId = 0;
    let lastFrame = 0;
    const blobCount = Math.min(Math.max(count, MIN_BLOBS), MAX_BLOBS);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 1.5));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.width = "100%";
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1, 7);
    let aspect = 1;
    const blobs = Array.from({ length: blobCount }, () => {
      const blob = createBlob(geometry, aspect, BLOB_OPACITY);
      scene.add(blob.mesh);
      return blob;
    });

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const safeWidth = Math.max(width, 1);
      const safeHeight = Math.max(height, 1);
      aspect = safeWidth / safeHeight;
      camera.left = (-VIEW_HEIGHT * aspect) / 2;
      camera.right = (VIEW_HEIGHT * aspect) / 2;
      camera.top = VIEW_HEIGHT / 2;
      camera.bottom = -VIEW_HEIGHT / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(safeWidth, safeHeight, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = (timestamp: number) => {
      const elapsed = timestamp / 1000;
      const dt =
        lastFrame === 0 ? 0 : Math.min((timestamp - lastFrame) / 1000, 0.05);
      lastFrame = timestamp;

      blobs.forEach((blob) => updateBlob(blob, elapsed, dt, aspect));
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      blobs.forEach((blob) => {
        scene.remove(blob.mesh);
        blob.material.dispose();
      });
      geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
