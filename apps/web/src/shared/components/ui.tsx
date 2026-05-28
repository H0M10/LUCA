import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'accent' }
>(({ variant = 'primary', className = '', children, ...rest }, ref) => {
  const variants = {
    // Turquesa — CTA principal, llamativo con sombra y leve elevación
    primary:
      'bg-moss-700 text-white shadow-moss hover:bg-moss-800 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-moss-300 disabled:shadow-none disabled:hover:translate-y-0',
    // Azul petróleo — CTA secundario
    accent:
      'bg-ink-900 text-white shadow-ink hover:bg-ink-700 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-ink-300 disabled:shadow-none',
    // Contorno — acción terciaria
    ghost:
      'bg-white text-ink-900 border-2 border-paper-300 hover:border-moss-700 hover:text-moss-700 hover:bg-moss-50',
    danger:
      'bg-clay-600 text-white shadow-paper hover:bg-clay-700 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-clay-300',
  };
  return (
    <button
      ref={ref}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 font-sans text-sm font-semibold tracking-tight transition-all duration-200 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-full border border-paper-300 bg-white px-5 py-2.5 font-sans text-base text-ink-900 placeholder-ink-300 outline-none transition focus:border-moss-700 focus:ring-2 focus:ring-moss-700/20 ${className}`}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...rest }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-2xl border border-paper-300 bg-white px-4 py-3 font-sans text-base text-ink-900 placeholder-ink-300 outline-none transition focus:border-moss-700 focus:ring-2 focus:ring-moss-700/20 ${className}`}
      {...rest}
    />
  ),
);
Textarea.displayName = 'Textarea';

export function Field({
  label,
  hint,
  error,
  children,
  number,
}: {
  label: string;
  hint?: string;
  error?: string;
  number?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between">
        <span className="font-sans text-xs uppercase tracking-widest text-ink-500">
          {number && <span className="mr-2 font-mono text-ink-300">{number}</span>}
          {label}
        </span>
        {hint && <span className="font-sans text-xs text-ink-300">{hint}</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 block font-sans text-xs italic text-clay-600">— {error}</span>
      )}
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card-paper p-6 md:p-8 ${className}`}>{children}</div>;
}

export function ErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-clay-300 bg-clay-100/50 px-4 py-3 text-sm text-clay-700">
      <span className="mt-0.5 font-mono text-xs">!</span>
      <span className="font-sans">{message}</span>
    </div>
  );
}

export function Select({
  children,
  className = '',
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full appearance-none rounded-full border border-paper-300 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path d=%22M1 1l4 4 4-4%22 stroke=%22%23123F52%22 stroke-width=%221.2%22 fill=%22none%22/></svg>')] bg-[right_1rem_center] bg-no-repeat px-5 py-2.5 pr-10 font-sans text-base text-ink-900 outline-none transition focus:border-moss-700 focus:ring-2 focus:ring-moss-700/20 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
