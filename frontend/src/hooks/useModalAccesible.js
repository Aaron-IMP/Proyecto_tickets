import { useEffect } from 'react';

/**
 * Accesibilidad común para modales/diálogos:
 *  - Cierra con la tecla Escape (salvo que el cierre esté bloqueado, p. ej. durante un envío).
 *  - Bloquea el scroll del fondo mientras el modal está abierto.
 *
 * El contenedor del modal debe declarar role="dialog" aria-modal="true"
 * y aria-labelledby apuntando al id del título.
 *
 * @param {() => void} onCerrar  Callback para cerrar el modal.
 * @param {{ bloquearCierre?: boolean }} [opciones]
 */
export function useModalAccesible(onCerrar, { bloquearCierre = false } = {}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !bloquearCierre) onCerrar();
    };
    document.addEventListener('keydown', onKeyDown);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onCerrar, bloquearCierre]);
}
