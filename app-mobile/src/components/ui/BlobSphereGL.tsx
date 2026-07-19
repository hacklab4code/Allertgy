/**
 * Blob 3D morphing — port fedele del riferimento Three.js + SimplexNoise.
 * Vertici spostati con noise3D, MeshPhongMaterial, luci direzionali.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

/** Parametri animazione blob */
const SPEED = 22;
const SPIKES = 0.6;
const PROCESSING = 1.4;
/** Tempo con un solo colore (tutta la sfera) */
const COLOR_HOLD_MS = 3000;
/** Tempo in cui il colore successivo si propaga sulla superficie */
const COLOR_SWEEP_MS = 1400;
/** Morbidezza del fronte d'onda */
const COLOR_SWEEP_SOFT = 0.11;
/** Segmenti sfera — bilanciamento qualità / FPS su mobile */
const SPHERE_SEGMENTS = 72;
/** Normals ricalcolate ogni N frame (meno lag, aspetto quasi identico) */
const NORMAL_EVERY_N_FRAMES = 2;
const MAX_PIXEL_RATIO = 1.75;

/** Palette gradiente scanSphere: scuro → saturo → highlight */
type GradientSet = { deep: THREE.Color; mid: THREE.Color; hi: THREE.Color };

const GRADIENT_SETS: GradientSet[] = [
  {
    deep: new THREE.Color('#059669'),
    mid: new THREE.Color('#34D399'),
    hi: new THREE.Color('#6EE7B7'),
  },
  {
    deep: new THREE.Color('#D97706'),
    mid: new THREE.Color('#FBBF24'),
    hi: new THREE.Color('#FDE68A'),
  },
  {
    deep: new THREE.Color('#DC2626'),
    mid: new THREE.Color('#F87171'),
    hi: new THREE.Color('#FCA5A5'),
  },
];

/** Bump palette — forza reload GLView dopo cambio colori */
const PALETTE_VERSION = 'v6-violet-brand';

const HSL = { h: 0, s: 0, l: 0 };

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function tuneColor(colorIndex: number, src: THREE.Color, out: THREE.Color) {
  src.getHSL(HSL);
  if (colorIndex === 1) {
    out.setHSL(HSL.h, Math.min(1, HSL.s * 1.22 + 0.08), Math.min(0.58, Math.max(0.42, HSL.l)));
    return;
  }
  if (colorIndex === 2) {
    out.setHSL(HSL.h, Math.min(1, HSL.s * 1.16 + 0.05), Math.min(0.56, Math.max(0.38, HSL.l)));
    return;
  }
  out.setHSL(
    HSL.h,
    Math.min(1, HSL.s * 1.18 + 0.04),
    Math.min(0.62, Math.max(0.36, HSL.l * 1.02)),
  );
}

/** Ombreggiatura gradiente — stessa logica per tutti, tuning leggero per colore */
function shadeGradient(
  set: GradientSet,
  colorIndex: number,
  x: number,
  y: number,
  z: number,
  out: THREE.Color,
) {
  const t = Math.max(0, Math.min(1, x * 0.3 + y * 0.46 + z * 0.1 + 0.5));

  if (t < 0.38) {
    out.copy(set.deep).lerp(set.mid, t / 0.38);
  } else if (t < 0.76) {
    out.copy(set.mid).lerp(set.hi, (t - 0.38) / 0.38);
  } else {
    out.copy(set.hi).lerp(set.mid, (t - 0.76) / 0.24 * 0.22);
  }
  tuneColor(colorIndex, out, out);
}

function colorCyclePhase(now: number) {
  const segment = COLOR_HOLD_MS + COLOR_SWEEP_MS;
  const cycle = segment * 3;
  const t = now % cycle;
  const index = Math.floor(t / segment);
  const local = t % segment;
  const hold = local < COLOR_HOLD_MS;
  const sweep = hold ? 0 : smoothstep((local - COLOR_HOLD_MS) / COLOR_SWEEP_MS);
  return { index, hold, sweep };
}

type Props = {
  size: number;
};

function setupBlobScene(gl: ExpoWebGLRenderingContext) {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const ratio = Math.min(PixelRatio.get(), MAX_PIXEL_RATIO);

  const renderer = new THREE.WebGLRenderer({
    canvas: {
      width,
      height,
      style: {},
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      clientHeight: height,
      clientWidth: width,
    } as unknown as HTMLCanvasElement,
    context: gl as unknown as WebGLRenderingContext,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(ratio);
  renderer.setSize(width / ratio, height / ratio);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 5;

  const geometry = new THREE.SphereGeometry(0.8, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertexCount = position.count;
  const unitDirs = new Float32Array(vertexCount * 3);

  for (let i = 0; i < vertexCount; i++) {
    const ix = i * 3;
    const x = position.array[ix];
    const y = position.array[ix + 1];
    const z = position.array[ix + 2];
    const len = Math.hypot(x, y, z) || 1;
    unitDirs[ix] = x / len;
    unitDirs[ix + 1] = y / len;
    unitDirs[ix + 2] = z / len;
  }

  const colors = new Float32Array(vertexCount * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    color: 0xffffff,
    emissive: 0x222222,
    emissiveIntensity: 0.2,
    shininess: 82,
    specular: new THREE.Color('#EEEEEE'),
  });

  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  const lightTop = new THREE.DirectionalLight(0xffffff, 0.84);
  lightTop.position.set(0, 500, 200);
  scene.add(lightTop);

  const lightBottom = new THREE.DirectionalLight(0xffffff, 0.32);
  lightBottom.position.set(0, -500, 400);
  scene.add(lightBottom);

  scene.add(new THREE.AmbientLight(0xffffff, 0.46));

  const vertexColor = new THREE.Color();
  const shadedA = new THREE.Color();
  const shadedB = new THREE.Color();
  const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
  const colorArr = colorAttr.array as Float32Array;
  let frameId = 0;
  let frame = 0;
  let disposed = false;
  const radius = 0.8;

  const update = () => {
    const now = performance.now();
    const time = now * 0.00001 * SPEED * PROCESSING ** 3;
    const { index, hold, sweep } = colorCyclePhase(now);
    const currentSet = GRADIENT_SETS[index];
    const nextSet = GRADIENT_SETS[(index + 1) % 3];
    const spikeAmt = SPIKES * PROCESSING;
    const positions = position.array;

    for (let i = 0; i < vertexCount; i++) {
      const ix = i * 3;
      const x = unitDirs[ix];
      const y = unitDirs[ix + 1];
      const z = unitDirs[ix + 2];
      const n = noise3D(x * spikeAmt, y * spikeAmt, z * spikeAmt + time);
      const scale = radius * (1 + 0.3 * n);

      positions[ix] = x * scale;
      positions[ix + 1] = y * scale;
      positions[ix + 2] = z * scale;

      shadeGradient(currentSet, index, x, y, z, shadedA);

      if (hold || sweep <= 0.001) {
        vertexColor.copy(shadedA);
      } else {
        const angle = Math.atan2(z, x) / (Math.PI * 2) + 0.5;
        const organic = noise3D(x * 1.1, y * 1.1, z * 1.1) * 0.11;
        const spatial = (angle + y * 0.18 + organic + 1) % 1;
        const front = smoothstep((sweep - spatial) / COLOR_SWEEP_SOFT);
        const nextIndex = (index + 1) % 3;
        shadeGradient(nextSet, nextIndex, x, y, z, shadedB);
        vertexColor.copy(shadedA).lerp(shadedB, front);
      }

      colorArr[ix] = vertexColor.r;
      colorArr[ix + 1] = vertexColor.g;
      colorArr[ix + 2] = vertexColor.b;
    }
    position.needsUpdate = true;
    colorAttr.needsUpdate = true;

    if (frame % NORMAL_EVERY_N_FRAMES === 0) {
      geometry.computeVertexNormals();
    }
    frame += 1;
  };

  const render = () => {
    if (disposed) return;
    frameId = requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
    gl.endFrameEXP();
  };

  render();

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}

export function BlobSphereGL({ size }: Props) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    cleanupRef.current?.();
    cleanupRef.current = setupBlobScene(gl);
  }, []);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <GLView
        key={PALETTE_VERSION}
        style={StyleSheet.absoluteFill}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
});
