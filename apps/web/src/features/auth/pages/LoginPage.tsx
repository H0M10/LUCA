import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { LoginSchema, type LoginInput } from '@genograma/shared';
import { useLogin } from '../hooks/useAuth.js';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Branch } from '../../../shared/brand/Logo.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  return (
    <div>
      <Navbar />
      <main className="editorial py-16 md:py-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          {/* Left — editorial side note */}
          <aside className="col-span-12 md:col-span-5 lg:col-span-4">
            <p className="section-number">— Bienvenido / Login</p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              Retoma tu{' '}
              <em className="fr-italic text-moss-700">archivo</em>.
            </h1>
            <p className="mt-6 max-w-sm font-display text-lg italic leading-snug text-ink-500">
              «Cada vez que regresas, otro detalle se vuelve memoria.»
            </p>
            <Branch className="mt-10 h-6 w-32 text-moss-700" />
          </aside>

          {/* Right — form */}
          <div className="col-span-12 md:col-span-7 lg:col-span-7 lg:col-start-6">
            <div className="max-w-md">
              <form onSubmit={handleSubmit((d) => mutate(d, { onSuccess: () => navigate('/dashboard') }))} className="space-y-8">
                <Field number="01" label="Correo electrónico" error={errors.email?.message}>
                  <Input type="email" autoComplete="email" placeholder="tu@correo.com" {...register('email')} />
                </Field>

                <Field number="02" label="Contraseña" error={errors.password?.message}>
                  <Input type="password" autoComplete="current-password" placeholder="••••••••••" {...register('password')} />
                </Field>

                <ErrorAlert message={error ? (error as { message: string }).message : undefined} />

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Entrando…' : 'Entrar'}
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Button>
                  <span className="font-sans text-sm text-ink-500">
                    ¿Nuevo aquí?{' '}
                    <Link to="/register" className="link-underline font-medium text-ink-900">
                      Crear cuenta
                    </Link>
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
