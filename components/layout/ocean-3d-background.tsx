"use client";

import { useEffect, useCallback } from "react";

declare global {
  interface Window {
    particlesJS?: (id: string, config: unknown) => void;
    pJSDom?: Array<{
      pJS: {
        fn: {
          vendors: {
            destroypJS: () => void;
          };
        };
      };
    }>;
  }
}

interface ParticlesBackgroundProps {
  className?: string;
}

export function ParticlesBackground({
  className = "",
}: ParticlesBackgroundProps) {
  const initParticles = useCallback((isDark: boolean) => {
    // cleanup old canvas
    const oldCanvas = document.querySelector("#particles-js canvas");
    if (oldCanvas) oldCanvas.remove();

    if (
      window.pJSDom &&
      Array.isArray(window.pJSDom) &&
      window.pJSDom.length > 0
    ) {
      window.pJSDom.forEach((p) => p.pJS?.fn?.vendors?.destroypJS?.());
    }
    // particles.js sets pJSDom = null in destroypJS; restore array so next call doesn't throw
    window.pJSDom = [];

    const colors = isDark
      ? {
          particles: "#00f5ff",
          lines: "#00d9ff",
          accent: "#0096c7",
        }
      : {
          particles: "#0277bd",
          lines: "#0288d1",
          accent: "#039be5",
        };

    if (typeof window.particlesJS === "function") {
      window.particlesJS("particles-js", {
        particles: {
          number: { value: 140, density: { enable: true, value_area: 800 } },
          color: { value: colors.particles },
          shape: {
            type: "circle",
            stroke: { width: 0.5, color: colors.accent },
          },
          opacity: {
            value: 0.7,
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0.3 },
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: true, speed: 2, size_min: 1 },
          },
          line_linked: {
            enable: true,
            distance: 160,
            color: colors.lines,
            opacity: 0.4,
            width: 1.2,
          },
          move: { enable: true, speed: 2, random: true, out_mode: "bounce" },
        },
        interactivity: {
          detect_on: "window",
          events: {
            onhover: { enable: true, mode: "grab" },
            onclick: { enable: true, mode: "push" },
            resize: true,
          },
          modes: {
            grab: { distance: 220, line_linked: { opacity: 0.8 } },
            push: { particles_nb: 4 },
            repulse: { distance: 180, duration: 0.4 },
          },
        },
        retina_detect: true,
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let observer: MutationObserver | null = null;
    let isMounted = true;
    let hasStarted = false;
    let attachedScript: HTMLScriptElement | null = null;
    let lastIsDark: boolean | null = null;

    const html = document.documentElement;
    const detectDark = () =>
      html.classList.contains("dark") ||
      html.getAttribute("data-theme") === "dark";

    const runInit = (isDark: boolean, isInitial: boolean) => {
      initParticles(isDark);
      if (!isInitial) {
        const canvas = document.querySelector(
          "#particles-js canvas.particles-js-canvas-el",
        ) as HTMLCanvasElement | null;
        if (canvas) {
          canvas.style.animationDuration = "450ms";
        }
      }
    };

    const startParticles = () => {
      if (
        !isMounted ||
        hasStarted ||
        typeof window.particlesJS !== "function"
      ) {
        return;
      }
      hasStarted = true;
      lastIsDark = detectDark();
      runInit(lastIsDark, true);

      observer = new MutationObserver(() => {
        if (!isMounted) return;
        const nextIsDark = detectDark();
        if (nextIsDark !== lastIsDark) {
          lastIsDark = nextIsDark;
          runInit(nextIsDark, false);
        }
      });
      observer.observe(html, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    };

    const handleScriptError = () => {
      if (attachedScript && !attachedScript.src.includes("cdn.jsdelivr.net")) {
        attachedScript.src =
          "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
      }
    };

    if (typeof window.particlesJS === "function") {
      startParticles();
    } else {
      let script = document.querySelector(
        'script[data-particle-script="true"]',
      ) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement("script");
        script.src = "/scripts/particles.min.js";
        script.async = true;
        script.setAttribute("data-particle-script", "true");
        document.body.appendChild(script);
      }

      attachedScript = script;
      script.addEventListener("load", startParticles);
      script.addEventListener("error", handleScriptError);

      // Guard against script finishing between initial check and listener attachment
      if (typeof window.particlesJS === "function") {
        startParticles();
      }
    }

    return () => {
      isMounted = false;
      if (attachedScript) {
        attachedScript.removeEventListener("load", startParticles);
        attachedScript.removeEventListener("error", handleScriptError);
      }
      if (observer) observer.disconnect();
      if (
        window.pJSDom &&
        Array.isArray(window.pJSDom) &&
        window.pJSDom.length > 0
      ) {
        window.pJSDom.forEach((p) => p.pJS?.fn?.vendors?.destroypJS?.());
      }
      window.pJSDom = [];
    };
  }, [initParticles]);

  return (
    <div
      id="particles-js"
      aria-hidden="true"
      className={`
        fixed inset-0 pointer-events-none z-0 h-full w-full
        transition-colors duration-500
        bg-gradient-to-tr from-[#e3f2fd] via-[#90caf9] to-[#64b5f6]
        dark:from-[#000814] dark:via-[#003566] dark:to-[#0077b6]
        ${className}
      `}
    />
  );
}

// Re-export as Ocean3dBackground so all existing references work seamlessly
export { ParticlesBackground as Ocean3dBackground };
export default ParticlesBackground;
