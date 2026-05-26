import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterSchema, type RegisterInput } from '@genograma/shared';
import { useRegister } from '../hooks/useAuth.js';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  return (
    <div>
      <Navbar />
      <main className="editorial py-16 md:py-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <aside className="col-span-12 md:col-span-5 lg:col-span-4">
            <p className="section-number">— Nueva cuenta</p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              Planta tu primer{' '}
              <em className="fr-italic text-moss-700">árbol</em>.
            </h1>
            <p className="mt-6 max-w-sm font-display text-lg italic leading-snug text-ink-500">
              Llevará menos de un minuto. Después podrás añadir generaciones a tu propio ritmo.
            </p>

            <ul className="mt-10 space-y-3 font-sans text-sm text-ink-700">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-px w-4 bg-moss-700" />
                <span>Tu información clínica es <em>solo tuya</em>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-px w-4 bg-moss-700" />
                <span>Sin tarjeta de crédito.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-px w-4 bg-moss-700" />
                <span>Exporta o elimina cuando quieras.</span>
              </li>
            </ul>
          </aside>

          <div className="col-span-12 md:col-span-7 lg:col-span-7 lg:col-start-6">
            <div className="max-w-md">
              <form onSubmit={handleSubmit((d) => mutate(d, { onSuccess: () => navigate('/dashboard') }))} className="space-y-8">
                <Field number="01" label="Nombre completo" error={errors.fullName?.message}>
                  <Input autoComplete="name" placeholder="María Eugenia Pérez" {...register('fullName')} />
                </Field>
                <Field number="02" label="Correo" error={errors.email?.message}>
                  <Input type="email" autoComplete="email" placeholder="tu@correo.com" {...register('email')} />
                </Field>
                <Field
                  number="03"
                  label="Contraseña"
                  hint="10+ chars, mayúscula, minúscula y número"
                  error={errors.password?.message}
                >
                  <Input type="password" autoComplete="new-password" placeholder="••••••••••" {...register('password')} />
                </Field>

                <ErrorAlert message={error ? (error as { message: string }).message : undefined} />

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creando…' : 'Crear cuenta'}
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Button>
                  <span className="font-sans text-sm text-ink-500">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="link-underline font-medium text-ink-900">
                      Entrar
                    </Link>
                  </span>
                </div>

                <p className="border-t border-paper-300 pt-6 font-sans text-xs text-ink-500">
                  Al crear tu cuenta aceptas que Luca conserve tu información de forma cifrada y privada.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
