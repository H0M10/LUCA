import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../../auth/hooks/useAuth.js';
import { updateProfile, type UpdateProfileInput } from '../api/profile.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Button, ErrorAlert, Field, Input, Select } from '../../../shared/components/ui.js';

export function ProfilePage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateProfileInput>({
    defaultValues: {
      fullName: me?.fullName ?? '',
      birthDate: me?.birthDate ?? '',
      gender: (me?.gender ?? undefined) as UpdateProfileInput['gender'],
      locale: me?.locale ?? 'es',
    },
  });

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (u) => qc.setQueryData(['me'], u),
  });

  return (
    <div>
      <Navbar />
      <main className="editorial py-12 md:py-20">
        <button
          onClick={() => navigate('/dashboard')}
          className="link-underline mb-6 font-mono text-[10px] uppercase tracking-widest text-ink-500"
        >
          ← Archivos
        </button>

        <header className="grid grid-cols-12 items-end gap-x-6 gap-y-8 border-b border-paper-300 pb-10">
          <div className="col-span-12 md:col-span-4">
            <div className="flex h-32 w-32 items-center justify-center border border-ink-900 bg-ink-900 font-display text-6xl font-light text-paper-50">
              {me?.fullName?.[0]?.toUpperCase()}
            </div>
          </div>
          <div className="col-span-12 md:col-span-8">
            <p className="section-number">— Mi expediente</p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              {me?.fullName?.split(' ')[0]}
            </h1>
            <p className="mt-3 font-sans text-sm text-ink-500">{me?.email}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Rol: {me?.role} · Estado: {me?.status}
            </p>
          </div>
        </header>

        <section className="mt-12 grid grid-cols-12 gap-x-6 gap-y-8">
          <div className="col-span-12 md:col-span-4">
            <p className="section-number">— 01</p>
            <h2 className="mt-2 font-display text-3xl font-light text-ink-900">
              Datos<br />
              <em className="fr-italic">personales</em>.
            </h2>
          </div>
          <form onSubmit={handleSubmit((d) => mutate(d))} className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-7 md:col-start-6">
            <Field number="01" label="Nombre completo" error={errors.fullName?.message}>
              <Input {...register('fullName')} />
            </Field>
            <Field number="02" label="Fecha de nacimiento" error={errors.birthDate?.message}>
              <Input type="date" {...register('birthDate')} />
            </Field>
            <Field number="03" label="Género">
              <Select {...register('gender')}>
                <option value="">— Seleccionar —</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="nonbinary">No binario</option>
                <option value="unknown">Prefiero no decir</option>
              </Select>
            </Field>
            <Field number="04" label="Idioma">
              <Select {...register('locale')}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <div className="col-span-2">
              <ErrorAlert message={error ? (error as { message: string }).message : undefined} />
              {isSuccess && (
                <p className="border-l-2 border-moss-700 bg-moss-50 px-4 py-3 font-sans text-sm text-moss-800">
                  ✓ Cambios guardados.
                </p>
              )}
            </div>
            <div className="col-span-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando…' : 'Guardar cambios'}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Button>
            </div>
          </form>
        </section>

        <section className="mt-16 border-t border-paper-300 pt-12">
          <div className="grid grid-cols-12 gap-x-6 gap-y-6">
            <div className="col-span-12 md:col-span-4">
              <p className="section-number">— 02</p>
              <h2 className="mt-2 font-display text-3xl font-light text-ink-900">
                Zona<br />
                <em className="fr-italic text-clay-600">sensible</em>.
              </h2>
            </div>
            <div className="col-span-12 md:col-span-7 md:col-start-6">
              <p className="font-sans text-sm leading-relaxed text-ink-500">
                Próximamente: cambiar contraseña, activar autenticación de dos factores y eliminar cuenta de forma definitiva.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
