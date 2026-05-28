import { useEffect, useState } from 'react';
import { Branch } from '../brand/Logo.js';

const STORAGE_KEY = 'luca:tour-done';

interface Step {
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: 'Bienvenido a Luca',
    body: 'Tu árbol genealógico con historial clínico, en un solo lugar. Te muestro cómo en 4 pasos.',
  },
  {
    title: 'Empieza por ti',
    body: 'En el centro de tu árbol estás tú (el "proband"). Desde ahí crece todo lo demás. Marca tu nombre y fecha de nacimiento.',
  },
  {
    title: 'Agrega familia con un click',
    body: 'Click sobre cualquier persona y verás botones "+ Agregar padre / madre / pareja / hijo / hermano". Llenas el nombre y se conecta sola.',
  },
  {
    title: 'Tipo de sangre, condiciones, alergias',
    body: 'En el panel de cada persona hay una pestaña "Salud" para registrar tipo de sangre, enfermedades del catálogo CIE-10, alergias y hábitos.',
  },
  {
    title: 'Pro tip: busca con "/"',
    body: 'Presiona la tecla "/" para buscar a cualquier persona. Usa el botón "Resumen clínico" para ver patrones hereditarios. ¡Listo para empezar!',
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const done = window.localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Mostrar después de un pequeño delay para que la página termine de cargar
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;
  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={finish}
    >
      <div
        className="relative w-full max-w-md animate-scale-in border border-ink-900/10 bg-paper-50 px-8 py-10 text-center shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Branch className="mx-auto h-6 w-32 text-moss-700" />
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          Paso {step + 1} de {STEPS.length}
        </p>
        <h2 className="mt-3 font-display text-3xl font-light leading-tight text-ink-900">
          {current.title}
        </h2>
        <p className="mx-auto mt-4 max-w-sm font-display text-base leading-relaxed text-ink-700">
          {current.body}
        </p>

        {/* Progress dots */}
        <div className="mt-8 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 transition-all ${i === step ? 'w-8 bg-moss-700' : 'w-3 bg-paper-300'}`}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
          >
            Saltar tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-full border border-paper-400 px-5 py-2 font-sans text-sm text-ink-700 hover:border-ink-900"
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep(step + 1))}
              className="rounded-full bg-ink-900 px-5 py-2 font-sans text-sm font-medium text-paper-50 transition hover:bg-moss-700"
            >
              {isLast ? '¡Empezar!' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
