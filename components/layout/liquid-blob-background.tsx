"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BlobParticle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  targetR: number;
  growing: boolean;
  phase1: number;
  phase2: number;
  w1: number;
  w2: number;
  cooldown: number;
  squishV: number;
  squishH: number;
};

type RenderBlob = Pick<BlobParticle, "id">;

type LiquidBlobBackgroundProps = {
  count?: number;
  opacity?: number;
  className?: string;
};

type Bounds = {
  w: number;
  h: number;
};

const BASE_COLOR = "#137fec";
const HIGHLIGHT_COLOR = "rgba(255, 255, 255, 0.44)";
const MIN_BLOBS = 7;
const MAX_BLOBS = 12;
const MAX_RADIUS_FACTOR = 0.18;
const MIN_RADIUS_FACTOR = 0.065;
const ATTRACT_DISTANCE = 2.7;
const MERGE_DISTANCE = 0.62;
const SPLIT_CHILDREN = 3;

let blobUid = 0;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function nextBlobId() {
  blobUid += 1;
  return `blob-${blobUid}`;
}

function getRadiusLimits(w: number, h: number) {
  const shortestSide = Math.max(Math.min(w, h), 320);

  return {
    min: shortestSide * MIN_RADIUS_FACTOR,
    max: shortestSide * MAX_RADIUS_FACTOR,
  };
}

function createEdgePosition(w: number, h: number, r: number) {
  const side = Math.floor(randomBetween(0, 4));
  const speed = randomBetween(14, 30);

  if (side === 0) {
    return {
      x: -r * 0.35,
      y: randomBetween(0, h),
      vx: speed,
      vy: randomBetween(-speed, speed),
    };
  }

  if (side === 1) {
    return {
      x: w + r * 0.35,
      y: randomBetween(0, h),
      vx: -speed,
      vy: randomBetween(-speed, speed),
    };
  }

  if (side === 2) {
    return {
      x: randomBetween(0, w),
      y: -r * 0.35,
      vx: randomBetween(-speed, speed),
      vy: speed,
    };
  }

  return {
    x: randomBetween(0, w),
    y: h + r * 0.35,
    vx: randomBetween(-speed, speed),
    vy: -speed,
  };
}

function createBlob(
  bounds: Bounds,
  spawnFromEdge = false,
  targetRadius?: number,
): BlobParticle {
  const { min, max } = getRadiusLimits(bounds.w, bounds.h);
  const baseRadius = targetRadius ?? randomBetween(min, max * 0.74);
  const position = spawnFromEdge
    ? createEdgePosition(bounds.w, bounds.h, baseRadius)
    : {
        x: randomBetween(baseRadius, bounds.w - baseRadius),
        y: randomBetween(baseRadius, bounds.h - baseRadius),
        vx: randomBetween(-18, 18),
        vy: randomBetween(-18, 18),
      };

  return {
    id: nextBlobId(),
    x: position.x,
    y: position.y,
    vx: position.vx,
    vy: position.vy,
    r: spawnFromEdge ? baseRadius * 0.08 : baseRadius,
    targetR: baseRadius,
    growing: spawnFromEdge,
    phase1: randomBetween(0, Math.PI * 2),
    phase2: randomBetween(0, Math.PI * 2),
    w1: randomBetween(0.26, 0.44),
    w2: randomBetween(0.2, 0.36),
    cooldown: spawnFromEdge ? 1.1 : 0,
    squishV: 0,
    squishH: 0,
  };
}

function catmullToBezier(points: Array<[number, number]>) {
  const total = points.length;
  let path = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} `;

  for (let index = 0; index < total; index += 1) {
    const p0 = points[(index - 1 + total) % total];
    const p1 = points[index];
    const p2 = points[(index + 1) % total];
    const p3 = points[(index + 2) % total];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    path += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }

  return `${path}Z`;
}

function conserveAreaScale(
  x: number,
  y: number,
  squishV: number,
  squishH: number,
) {
  const sxV = 1 / (1 - squishV);
  const syV = 1 - squishV;
  const sxH = 1 - squishH;
  const syH = 1 / (1 - squishH);

  return [x * sxV * sxH, y * syV * syH] as const;
}

function createBlobPath(blob: BlobParticle, time: number, points = 24) {
  const pathPoints: Array<[number, number]> = [];

  for (let index = 0; index < points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const wobble =
      1 +
      0.04 * Math.sin(angle * 2 + blob.phase1 + time * blob.w1) +
      0.018 * Math.sin(angle * 3 - blob.phase2 + time * blob.w2);
    const radius = blob.r * wobble;
    const [scaledX, scaledY] = conserveAreaScale(
      radius * Math.cos(angle),
      radius * Math.sin(angle),
      blob.squishV,
      blob.squishH,
    );

    pathPoints.push([blob.x + scaledX, blob.y + scaledY]);
  }

  return catmullToBezier(pathPoints);
}

function clampBlobToBounds(blob: BlobParticle, bounds: Bounds) {
  if (blob.x - blob.r < 0) {
    blob.x = blob.r;
    blob.vx = Math.abs(blob.vx);
    blob.squishH = Math.min(
      0.42,
      blob.squishH + Math.min(0.32, Math.abs(blob.vx) / 260),
    );
  }

  if (blob.x + blob.r > bounds.w) {
    blob.x = bounds.w - blob.r;
    blob.vx = -Math.abs(blob.vx);
    blob.squishH = Math.min(
      0.42,
      blob.squishH + Math.min(0.32, Math.abs(blob.vx) / 260),
    );
  }

  if (blob.y - blob.r < 0) {
    blob.y = blob.r;
    blob.vy = Math.abs(blob.vy);
    blob.squishV = Math.min(
      0.42,
      blob.squishV + Math.min(0.32, Math.abs(blob.vy) / 260),
    );
  }

  if (blob.y + blob.r > bounds.h) {
    blob.y = bounds.h - blob.r;
    blob.vy = -Math.abs(blob.vy);
    blob.squishV = Math.min(
      0.42,
      blob.squishV + Math.min(0.32, Math.abs(blob.vy) / 260),
    );
  }
}

function moveBlob(blob: BlobParticle, bounds: Bounds, dt: number) {
  if (blob.growing) {
    blob.r += (blob.targetR - blob.r) * Math.min(dt * 3.2, 1);
    if (Math.abs(blob.r - blob.targetR) < 0.45) {
      blob.r = blob.targetR;
      blob.growing = false;
    }
  }

  blob.cooldown = Math.max(0, blob.cooldown - dt);
  blob.squishV *= Math.exp(-dt * 5.5);
  blob.squishH *= Math.exp(-dt * 5.5);
  blob.x += blob.vx * dt;
  blob.y += blob.vy * dt;
  blob.vx *= 0.999;
  blob.vy *= 0.999;

  clampBlobToBounds(blob, bounds);
}

function applyAttraction(blobs: BlobParticle[], dt: number) {
  for (let i = 0; i < blobs.length; i += 1) {
    for (let j = i + 1; j < blobs.length; j += 1) {
      const first = blobs[i];
      const second = blobs[j];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const influenceRadius = (first.r + second.r) * ATTRACT_DISTANCE;

      if (
        distance >= influenceRadius ||
        first.cooldown > 0 ||
        second.cooldown > 0
      ) {
        continue;
      }

      const pull = (1 - distance / influenceRadius) * 12 * dt;
      const nx = dx / distance;
      const ny = dy / distance;

      first.vx += nx * pull;
      first.vy += ny * pull;
      second.vx -= nx * pull;
      second.vy -= ny * pull;
    }
  }
}

function createSplitBlobs(
  source: BlobParticle,
  bounds: Bounds,
  childCount = SPLIT_CHILDREN,
) {
  const sourceArea = source.r * source.r;
  const childRadius = Math.sqrt(sourceArea / childCount) * 0.94;
  const children: BlobParticle[] = [];

  for (let index = 0; index < childCount; index += 1) {
    const angle =
      (index / childCount) * Math.PI * 2 + randomBetween(-0.35, 0.35);
    const speed = randomBetween(26, 42);
    const offset = source.r * 0.34;
    const child = createBlob(bounds, false, childRadius);

    child.x = Math.min(
      Math.max(source.x + Math.cos(angle) * offset, childRadius),
      bounds.w - childRadius,
    );
    child.y = Math.min(
      Math.max(source.y + Math.sin(angle) * offset, childRadius),
      bounds.h - childRadius,
    );
    child.vx = source.vx * 0.22 + Math.cos(angle) * speed;
    child.vy = source.vy * 0.22 + Math.sin(angle) * speed;
    child.r = childRadius * 0.72;
    child.targetR = childRadius;
    child.growing = true;
    child.cooldown = 1.35;
    children.push(child);
  }

  return children;
}

function mergeOrSplitBlobs(blobs: BlobParticle[], bounds: Bounds) {
  const { max } = getRadiusLimits(bounds.w, bounds.h);

  for (let i = 0; i < blobs.length; i += 1) {
    for (let j = i + 1; j < blobs.length; j += 1) {
      const first = blobs[i];
      const second = blobs[j];

      if (
        first.cooldown > 0 ||
        second.cooldown > 0 ||
        first.growing ||
        second.growing
      ) {
        continue;
      }

      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (distance >= (first.r + second.r) * MERGE_DISTANCE) {
        continue;
      }

      const areaA = first.r * first.r;
      const areaB = second.r * second.r;
      const combinedArea = areaA + areaB;
      const combinedRadius = Math.sqrt(combinedArea);
      const centerX = (first.x * areaA + second.x * areaB) / combinedArea;
      const centerY = (first.y * areaA + second.y * areaB) / combinedArea;
      const velocityX = (first.vx * areaA + second.vx * areaB) / combinedArea;
      const velocityY = (first.vy * areaA + second.vy * areaB) / combinedArea;
      const rest = blobs.filter(
        (blob) => blob.id !== first.id && blob.id !== second.id,
      );

      if (combinedRadius >= max) {
        const temporaryBlob = {
          ...first,
          x: centerX,
          y: centerY,
          vx: velocityX,
          vy: velocityY,
          r: Math.min(combinedRadius, max),
        };
        return [...rest, ...createSplitBlobs(temporaryBlob, bounds)];
      }

      const mergedBlob: BlobParticle = {
        ...first,
        id: nextBlobId(),
        x: centerX,
        y: centerY,
        vx: velocityX,
        vy: velocityY,
        r: combinedRadius,
        targetR: combinedRadius,
        growing: false,
        phase1: randomBetween(0, Math.PI * 2),
        phase2: randomBetween(0, Math.PI * 2),
        cooldown: 0.9,
        squishV: 0,
        squishH: 0,
      };

      return [...rest, mergedBlob];
    }
  }

  return blobs;
}

function replenishBlobs(
  blobs: BlobParticle[],
  bounds: Bounds,
  targetCount: number,
) {
  if (blobs.length >= targetCount && blobs.length <= MAX_BLOBS) {
    return blobs;
  }

  if (blobs.length > MAX_BLOBS) {
    return blobs.slice(0, MAX_BLOBS);
  }

  const nextBlobs = [...blobs];

  while (nextBlobs.length < targetCount) {
    nextBlobs.push(createBlob(bounds, true));
  }

  return nextBlobs;
}

export function LiquidBlobBackground({
  count = MIN_BLOBS,
  opacity = 0.72,
  className = "",
}: Readonly<LiquidBlobBackgroundProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const highlightRefs = useRef(new Map<string, SVGEllipseElement>());
  const blobsRef = useRef<BlobParticle[]>([]);
  const boundsRef = useRef<Bounds>({ w: 0, h: 0 });
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const [renderList, setRenderList] = useState<RenderBlob[]>([]);

  const targetCount = Math.min(Math.max(count, MIN_BLOBS), MAX_BLOBS);
  const syncRenderList = useCallback(() => {
    setRenderList(blobsRef.current.map((blob) => ({ id: blob.id })));
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const initBlobs = (bounds: Bounds) => {
      boundsRef.current = bounds;
      blobsRef.current = Array.from({ length: targetCount }, () =>
        createBlob(bounds),
      );
      syncRenderList();
    };

    const bounds = element.getBoundingClientRect();
    initBlobs({ w: bounds.width, h: bounds.height });

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      boundsRef.current = { w: width, h: height };
    });
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [syncRenderList, targetCount]);

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }

      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = timestamp;
      const bounds = boundsRef.current;

      if (bounds.w > 0 && bounds.h > 0) {
        const blobs = blobsRef.current;
        applyAttraction(blobs, dt);
        blobs.forEach((blob) => moveBlob(blob, bounds, dt));

        const changedBlobs = replenishBlobs(
          mergeOrSplitBlobs(blobs, bounds),
          bounds,
          targetCount,
        );
        if (changedBlobs !== blobs) {
          blobsRef.current = changedBlobs;
          syncRenderList();
        }

        const time = timestamp / 1000;
        blobsRef.current.forEach((blob) => {
          const path = pathRefs.current.get(blob.id);
          if (path) {
            path.setAttribute("d", createBlobPath(blob, time));
          }

          const highlight = highlightRefs.current.get(blob.id);
          if (highlight) {
            highlight.setAttribute("cx", `${blob.x - blob.r * 0.3}`);
            highlight.setAttribute("cy", `${blob.y - blob.r * 0.36}`);
            highlight.setAttribute("rx", `${blob.r * 0.3}`);
            highlight.setAttribute("ry", `${blob.r * 0.18}`);
          }
        });
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [syncRenderList, targetCount]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <svg aria-hidden="true" className="block h-full w-full">
        <defs>
          <filter
            id="liquid-blob-goo"
            x="-45%"
            y="-45%"
            width="190%"
            height="190%"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="18"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <radialGradient id="liquid-blob-gradient" cx="38%" cy="32%" r="74%">
            <stop offset="0%" stopColor="#9bd7ff" />
            <stop offset="52%" stopColor={BASE_COLOR} />
            <stop offset="100%" stopColor="#0758b8" />
          </radialGradient>
        </defs>

        <g filter="url(#liquid-blob-goo)">
          {renderList.map((blob) => (
            <path
              key={blob.id}
              ref={(element) => {
                if (element) {
                  pathRefs.current.set(blob.id, element);
                } else {
                  pathRefs.current.delete(blob.id);
                }
              }}
              fill="url(#liquid-blob-gradient)"
            />
          ))}
        </g>

        <g style={{ mixBlendMode: "screen" }}>
          {renderList.map((blob) => (
            <ellipse
              key={blob.id}
              ref={(element) => {
                if (element) {
                  highlightRefs.current.set(blob.id, element);
                } else {
                  highlightRefs.current.delete(blob.id);
                }
              }}
              fill={HIGHLIGHT_COLOR}
              style={{ filter: "blur(4px)" }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
