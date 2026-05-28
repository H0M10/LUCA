import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { LoginSchema, type LoginInput } from '@genograma/shared';
import { useLogin } from '../hooks/useAuth.js';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TwoFactorChallenge } from './TwoFactorChallenge.js';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Branch } from '../../../shared/brand/Logo.js';
import { GoogleButton } from '../components/GoogleButton.js';
import { toast } from '../../../shared/stores/toast.js';

const OAUTH_ERRORS: Record<string, string> = {
  google_not_configured: 'Google OAuth aún no está configurado en el servidor.',
  missing_params: 'Faltan parámetros en la respuesta de Google.',
  no_state_cookie: 'Tu navegador bloqueó cookies necesarias para el login con Google. Activa las cookies de terceros o intenta en otro navegador.',
  bad_cookie: 'Cookie de seguridad inválida. Vuelve a intentar.',
  state_mismatch: 'Validación de estado falló. Vuelve a intentar.',
  nonce_mismatch: 'Validación de seguridad falló. Vuelve a intentar.',
  oauth_failed: 'No pudimos completar el inicio de sesión con Google.',
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate, isPending, error } = useLogin();
  const [challengeId, setChallengeId] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err && OAUTH_ERRORS[err]) {
      const msg = searchParams.get('msg');
      toast.error(OAUTH_ERRORS[err]!, msg ?? undefined);
    }
  }, [searchParams]);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  if (challengeId) return <TwoFactorChallenge challengeId={challengeId} />;

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
              <GoogleButton />
              <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-widest text-ink-300">
                <span className="h-px flex-1 bg-paper-300" />
                <span>o con correo</span>
                <span className="h-px flex-1 bg-paper-300" />
              </div>
              <form
                onSubmit={handleSubmit((d) =>
                  mutate(d, {
                    onSuccess: (result) => {
                      if (result.kind === '2fa') {
                        setChallengeId(result.challengeId);
                      } else {
                        toast.success(`Bienvenido, ${result.user.fullName.split(' ')[0]}`);
                        navigate('/dashboard');
                      }
                    },
                  }),
                )}
                className="space-y-8"
              >
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
