import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../../../shared/lib/http.js';
import type { PersonDto } from '../api/trees.js';
import { toast } from '../../../shared/stores/toast.js';

/**
 * Componente de subida de foto:
 * 1) usuario elige imagen
 * 2) la redimensionamos a 256x256 (cover) en canvas
 * 3) la convertimos a JPEG 0.82 → data URL ~30-80 KB
 * 4) PUT al backend, que la guarda en person.photo_data
 */
export function PhotoUpload({ person, treeId }: { person: PersonDto; treeId: string }) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const save = useMutation({
    mutationFn: (dataUrl: string) =>
      http(`/api/persons/${person.id}/photo`, {
        method: 'PUT',
        body: JSON.stringify({ dataUrl }),
      }),
    onSuccess: () => {
      toast.success('Foto actualizada');
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
    },
    onError: () => toast.error('No se pudo guardar la foto'),
  });

  const remove = useMutation({
    mutationFn: () => http(`/api/persons/${person.id}/photo`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Foto eliminada');
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
    },
  });

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar la misma
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagen muy grande', 'Máximo 10 MB.');
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await resizeImage(file, 256, 0.82);
      save.mutate(dataUrl);
    } catch {
      toast.error('No se pudo procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  const hasPhoto = !!person.photoData;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-paper-300 bg-paper-100">
        {hasPhoto ? (
          <img src={person.photoData!} alt={person.firstName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-ink-300">
            {person.firstName[0]?.toUpperCase()}
          </div>
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 text-paper-50">
            <span className="text-xs">…</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={onSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={processing || save.isPending}
          className="rounded-full border border-ink-900 bg-ink-900 px-3 py-1 font-sans text-xs font-medium text-paper-50 hover:bg-moss-700 disabled:opacity-50"
        >
          {hasPhoto ? 'Cambiar foto' : '+ Subir foto'}
        </button>
        {hasPhoto && (
          <button
            onClick={() => {
              if (confirm('¿Eliminar la foto?')) remove.mutate();
            }}
            className="text-left font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Lee un File, lo dibuja en canvas centrado (cover) en un cuadrado del tamaño dado
 * y devuelve un dataURL JPEG.
 */
function resizeImage(file: File, size: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas ctx'));

        const aspect = img.width / img.height;
        let sx = 0,
          sy = 0,
          sw = img.width,
          sh = img.height;
        if (aspect > 1) {
          // landscape — recortar a los lados
          sw = img.height;
          sx = (img.width - img.height) / 2;
        } else {
          // portrait — recortar arriba/abajo
          sh = img.width;
          sy = (img.height - img.width) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
