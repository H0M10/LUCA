import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import type { PersonDto } from '../api/trees.js';

interface GlobePoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
  size: number;
}

/**
 * Globo 3D (ThreeJS/WebGL) que coloca a cada persona con lugar de origen
 * registrado. La textura del globo se carga desde un CDN público.
 */
export function GlobeView({ persons }: { persons: PersonDto[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });

  const points = useMemo<GlobePoint[]>(
    () =>
      persons
        .filter((p) => p.birthLat != null && p.birthLng != null)
        .map((p) => ({
          lat: p.birthLat as number,
          lng: p.birthLng as number,
          label: `${p.firstName} ${p.lastName ?? ''}${p.birthPlace ? ` · ${p.birthPlace}` : ''}`,
          color: p.isProband ? '#42A7A5' : '#8AB96B',
          size: p.isProband ? 0.9 : 0.6,
        })),
    [persons],
  );

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    if (points[0]) g.pointOfView({ lat: points[0].lat, lng: points[0].lng, altitude: 1.8 }, 1200);
  }, [points]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-paper-300 shadow-paper" style={{ background: '#0b1a22' }}>
      <div ref={wrap} className="h-[78vh] w-full">
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="#0b1a22"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#42A7A5"
          atmosphereAltitude={0.18}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.06}
          pointRadius="size"
          pointLabel="label"
          pointsMerge={false}
          ringsData={points}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (t: number) => `rgba(66,167,165,${1 - t})`}
          ringMaxRadius={3}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1400}
        />
      </div>

      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="pointer-events-auto max-w-sm rounded-2xl bg-ink-950/70 px-6 py-5 backdrop-blur">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-moss-300">— Globo de orígenes</p>
            <p className="mt-2 font-display text-lg text-white">Aún nadie tiene lugar de origen</p>
            <p className="mt-1 font-sans text-sm text-paper-100/70">
              Edita una persona y usa el buscador de “Lugar de origen” para colocarla en el mapa.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink-950/70 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-white backdrop-blur">
        {points.length} {points.length === 1 ? 'origen' : 'orígenes'}
      </div>
    </div>
  );
}
