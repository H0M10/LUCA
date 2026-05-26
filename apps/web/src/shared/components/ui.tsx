import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'accent' }
>(({ variant = 'primary', className = '', children, ...rest }, ref) => {
  const variants = {
    primary:
      'bg-ink-900 text-paper-50 hover:bg-moss-700 disabled:bg-ink-300 disabled:text-paper-100',
    accent:
      'bg-moss-700 text-paper-50 hover:bg-moss-800 disabled:bg-moss-300',
    ghost:
      'bg-transparent text-ink-900 border border-ink-900/30 hover:border-ink-900 hover:bg-paper-200',
    danger:
      'bg-clay-600 text-paper-50 hover:bg-clay-700 disabled:bg-clay-300',
  };
  return (
    <button
      ref={ref}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-sans text-sm font-medium tracking-tight transition-all disabled:cursor-not-allowed ${variants[variant]} ${className}`}
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
      className={`w-full border-b border-ink-300 bg-transparent px-0 py-2.5 font-sans text-base text-ink-900 placeholder-ink-300 outline-none transition focus:border-moss-700 ${className}`}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...rest }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-sm border border-paper-300 bg-paper-50 px-3 py-2.5 font-sans text-base text-ink-900 placeholder-ink-300 outline-none transition focus:border-moss-700 ${className}`}
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
    <div className="flex items-start gap-3 rounded-sm border border-clay-300 bg-clay-100/50 px-4 py-3 text-sm text-clay-700">
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
      className={`w-full appearance-none border-b border-ink-300 bg-transparent bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path d=%22M1 1l4 4 4-4%22 stroke=%22%231F1A14%22 stroke-width=%221.2%22 fill=%22none%22/></svg>')] bg-[right_4px_center] bg-no-repeat py-2.5 pr-6 font-sans text-base text-ink-900 outline-none transition focus:border-moss-700 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
