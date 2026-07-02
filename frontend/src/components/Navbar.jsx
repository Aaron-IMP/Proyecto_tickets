import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { usuario, estaAutenticado, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const cerrar = () => setAbierto(false);

  const handleLogout = () => {
    cerrar();
    logout();
    toast('Sesión cerrada');
    navigate('/');
  };

  const linkCls = 'block px-4 py-3 text-sm text-[#A8A8B3] hover:text-white hover:bg-[#2A2A35] rounded-lg transition-colors no-underline';
  const linkDesktopCls = 'px-3 py-2 text-sm text-[#A8A8B3] hover:text-white hover:bg-[#2A2A35] rounded-lg transition-colors no-underline';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#15151D] border-b border-[#3A3A48]">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">

          {/* Logo */}
          <Link to="/" onClick={cerrar} className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Teleticket
            </span>
          </Link>

          {/* Navegación central — solo desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkDesktopCls}>Eventos</Link>
            <Link to="/marketplace" className={linkDesktopCls}>Marketplace</Link>

            {estaAutenticado && usuario?.rol === 'cliente' && (
              <Link to="/mis-tickets" className={linkDesktopCls}>Mis Tickets</Link>
            )}
            {estaAutenticado && usuario?.rol === 'cliente' && (
              <Link to="/pagos" className={linkDesktopCls}>Mis Pagos</Link>
            )}
            {estaAutenticado && (usuario?.rol === 'seguridad' || usuario?.rol === 'admin') && (
              <Link to="/validar" className={linkDesktopCls}>Validar Entrada</Link>
            )}
            {estaAutenticado && usuario?.rol === 'admin' && (
              <Link to="/admin" className={linkDesktopCls}>Administrar</Link>
            )}
          </div>

          {/* Auth + hamburger */}
          <div className="flex items-center gap-2">
            {/* Perfil — solo desktop */}
            {estaAutenticado && (
              <Link to="/perfil"
                    className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity no-underline">
                <div className="w-7 h-7 bg-[#7C3AED] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {usuario?.nombre?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium leading-tight">{usuario?.nombre}</span>
                  <span className="text-[#96969F] text-[10px] capitalize leading-tight">{usuario?.rol}</span>
                </div>
              </Link>
            )}

            {/* Cerrar sesión — solo desktop */}
            {estaAutenticado && (
              <button
                onClick={handleLogout}
                className="hidden md:block px-3 py-1.5 text-xs text-[#A8A8B3] border border-[#3A3A48]
                           rounded-lg hover:text-white hover:border-[#7C3AED] transition-colors
                           cursor-pointer bg-transparent"
              >
                Cerrar sesión
              </button>
            )}

            {/* Links login/registro — solo desktop */}
            {!estaAutenticado && (
              <>
                <Link to="/login" className="hidden md:block px-3 py-1.5 text-xs text-[#A8A8B3] hover:text-white transition-colors no-underline">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="hidden md:block px-3 py-1.5 text-xs bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors no-underline">
                  Registrarse
                </Link>
              </>
            )}

            {/* Hamburger — solo mobile */}
            <button
              onClick={() => setAbierto(v => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg
                         border border-[#3A3A48] text-[#A8A8B3] hover:text-white
                         hover:border-[#7C3AED]/60 transition-colors cursor-pointer bg-transparent"
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={abierto}
            >
              {abierto ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menú mobile — panel desplegable */}
      {abierto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={cerrar}
          />

          {/* Panel */}
          <div className="fixed top-16 left-0 right-0 z-40 bg-[#15151D] border-b border-[#3A3A48]
                          shadow-xl md:hidden px-3 py-3 flex flex-col gap-1">

            <Link to="/" onClick={cerrar} className={linkCls}>Eventos</Link>
            <Link to="/marketplace" onClick={cerrar} className={linkCls}>Marketplace</Link>

            {estaAutenticado && usuario?.rol === 'cliente' && (
              <Link to="/mis-tickets" onClick={cerrar} className={linkCls}>Mis Tickets</Link>
            )}
            {estaAutenticado && usuario?.rol === 'cliente' && (
              <Link to="/pagos" onClick={cerrar} className={linkCls}>Mis Pagos</Link>
            )}
            {estaAutenticado && (usuario?.rol === 'seguridad' || usuario?.rol === 'admin') && (
              <Link to="/validar" onClick={cerrar} className={linkCls}>Validar Entrada</Link>
            )}
            {estaAutenticado && usuario?.rol === 'admin' && (
              <Link to="/admin" onClick={cerrar} className={linkCls}>Administrar</Link>
            )}

            <div className="border-t border-[#3A3A48] mt-1 pt-2">
              {estaAutenticado ? (
                <>
                  <Link to="/perfil" onClick={cerrar} className={linkCls}>
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {usuario?.nombre?.[0]?.toUpperCase()}
                      </span>
                      <span>
                        <span className="block text-white text-sm font-medium">{usuario?.nombre}</span>
                        <span className="block text-[#96969F] text-[10px] capitalize">{usuario?.rol}</span>
                      </span>
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-[#EF4444] hover:bg-[#2A2A35]
                               rounded-lg transition-colors cursor-pointer bg-transparent border-0"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-1 py-1">
                  <Link to="/login" onClick={cerrar}
                        className="flex-1 text-center py-2.5 text-sm text-[#A8A8B3] border border-[#3A3A48]
                                   rounded-xl hover:text-white hover:border-[#7C3AED]/50 transition-colors no-underline">
                    Iniciar sesión
                  </Link>
                  <Link to="/registro" onClick={cerrar}
                        className="flex-1 text-center py-2.5 text-sm bg-[#7C3AED] text-white
                                   rounded-xl hover:bg-[#6D28D9] transition-colors no-underline">
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;
