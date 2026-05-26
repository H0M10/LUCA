import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router v6 no hace scroll automático al hash de la URL.
 * Este componente escucha cambios de ruta y desplaza al elemento con el id del hash.
 * También resetea el scroll al cambiar de página sin hash.
 */
export function ScrollToHash(): null {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      // Retry varias veces porque el elemento puede no haber montado aún
      const tryScroll = (attempts = 0): void => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts < 10) {
          window.setTimeout(() => tryScroll(attempts + 1), 60);
        }
      };
      tryScroll();
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname, hash]);

  return null;
}
