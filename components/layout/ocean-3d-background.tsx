"use client";

import React, { useEffect, useRef } from "react";

interface Ocean3dBackgroundProps {
  className?: string;
}

/**
 * Ultra-lightweight WebGL Ocean 3D Wave Shader background.
 * - Replaces heavy Three.js (~650KB) with vanilla WebGL (< 3KB).
 * - Offloads all math to the GPU via 3D Gerstner wave simulation & surface normals.
 * - Zero CPU overhead on Cloudflare Worker SSR.
 * - Auto-pauses on background tabs or when reduced motion is preferred.
 */
export function Ocean3dBackground({ className = "" }: Ocean3dBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for user reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const gl =
      canvas.getContext("webgl", {
        powerPreference: "low-power",
        alpha: true,
        antialias: false,
        depth: false,
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      return;
    }

    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      uniform float u_is_dark;
      varying vec2 vUv;

      // 3D Gerstner multi-harmonic wave height function
      float getWaveHeight(vec2 p, float t) {
        float w1 = sin(p.x * 2.5 + p.y * 1.2 + t * 0.75) * 0.16;
        float w2 = cos(p.x * -1.8 + p.y * 2.8 - t * 0.6) * 0.10;
        float w3 = sin(p.x * 4.8 + p.y * -3.6 + t * 1.1) * 0.05;
        float w4 = sin(p.x * 10.5 + p.y * 8.5 + t * 1.6) * 0.025;
        return w1 + w2 + w3 + w4;
      }

      void main() {
        // Aspect ratio correction to prevent non-uniform stretching
        float minRes = min(u_resolution.x, u_resolution.y);
        vec2 aspect = u_resolution.xy / max(minRes, 1.0);
        vec2 p = (vUv - 0.5) * aspect * 3.5;
        float t = u_time * 0.55;

        // Wave height & finite-difference 3D surface normal
        float h = getWaveHeight(p, t);
        float eps = 0.02;
        float hX = getWaveHeight(p + vec2(eps, 0.0), t);
        float hY = getWaveHeight(p + vec2(0.0, eps), t);

        vec3 normal = normalize(vec3((h - hX) / eps * 2.2, (h - hY) / eps * 2.2, 1.0));

        // Key light (sun) and View vector
        vec3 lightDir = normalize(vec3(0.5, 0.7, 1.0));
        vec3 viewDir = vec3(0.0, 0.0, 1.0);

        // Blinn-Phong specular glint on wave crests
        vec3 halfVec = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 28.0);

        // Fresnel rim reflection
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

        // Interactive mouse disturbance / reflection
        vec2 mouseP = (u_mouse - 0.5) * aspect * 3.5;
        float mouseDist = length(mouseP - p);
        float mouseLight = smoothstep(1.5, 0.0, mouseDist);
        vec3 mouseHalf = normalize(normalize(vec3(mouseP - p, 0.8)) + viewDir);
        float mouseSpec = pow(max(dot(normal, mouseHalf), 0.0), 18.0) * mouseLight;

        // Vertical ocean depth gradient
        float depth = clamp(vUv.y * 0.75 + h * 0.6 + 0.15, 0.0, 1.0);

        // High-contrast color palettes
        // Light Mode: Crisp azure mist -> clear aquatic blue -> vibrant cyan wave ridges
        // Dark Mode: Deep abyssal navy -> bioluminescent electric cyan
        vec3 deepColor   = u_is_dark > 0.5 ? vec3(0.015, 0.045, 0.09) : vec3(0.85, 0.93, 0.98);
        vec3 oceanColor  = u_is_dark > 0.5 ? vec3(0.025, 0.11, 0.22)  : vec3(0.68, 0.86, 0.96);
        vec3 crestColor  = u_is_dark > 0.5 ? vec3(0.02, 0.75, 0.88)   : vec3(0.06, 0.58, 0.82);
        vec3 sunColor    = u_is_dark > 0.5 ? vec3(0.40, 0.95, 1.0)    : vec3(1.0, 1.0, 1.0);

        vec3 col = mix(deepColor, oceanColor, depth);
        float crestFactor = smoothstep(0.08, 0.25, h + fresnel * 0.35);
        col = mix(col, crestColor, crestFactor * (u_is_dark > 0.5 ? 0.85 : 0.65));

        // Add sparkling specular reflection
        col += sunColor * (spec * (u_is_dark > 0.5 ? 0.45 : 0.4) + mouseSpec * 0.45);

        float alpha = u_is_dark > 0.5 ? 0.92 : 0.86;
        gl_FragColor = vec4(col, alpha);
      }
    `;

    function compileShader(type: number, source: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, "u_time");
    const mouseLoc = gl.getUniformLocation(program, "u_mouse");
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const darkLoc = gl.getUniformLocation(program, "u_is_dark");

    let mouseX = 0.5;
    let mouseY = 0.5;
    let isVisible = true;
    let animId: number | null = null;
    let startTime = performance.now();

    function resize() {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouseX = (e.clientX - rect.left) / rect.width;
        mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    function render(timeNow: number) {
      if (!isVisible || !gl || !canvas) return;

      const isDark = document.documentElement.classList.contains("dark")
        ? 1.0
        : 0.0;
      const elapsed = (timeNow - startTime) / 1000.0;

      gl.uniform1f(timeLoc, elapsed);
      gl.uniform2f(mouseLoc, mouseX, mouseY);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(darkLoc, isDark);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    }

    // Single static render for reduced motion
    if (prefersReducedMotion) {
      render(performance.now());
    } else {
      animId = requestAnimationFrame(render);
    }

    // Auto-pause when page is hidden
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        isVisible = false;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isVisible = true;
        startTime = performance.now();
        if (!prefersReducedMotion) {
          animId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (gl) {
        gl.deleteBuffer(posBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
