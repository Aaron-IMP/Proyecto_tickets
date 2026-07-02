import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Navbar from './components/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Registro from './pages/Registro/Registro';
import EventoDetalle from './pages/EventoDetalle/EventoDetalle';
import MisTickets from './pages/MisTickets/MisTickets';
import TicketQR from './pages/TicketQR/TicketQR';
import Validar from './pages/Validar/Validar';
import Admin from './pages/admin/Admin';
import Perfil from './pages/Perfil/Perfil';
import Marketplace from './pages/Marketplace/Marketplace';
import Pagos from './pages/Pagos/Pagos';

function App() {
  const { estaAutenticado } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-inter">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#15151D',
            color: '#FFFFFF',
            border: '1px solid #2A2A35',
          },
        }}
      />
      <Navbar />
      <main className="pt-16">
        <Routes>
          {/* Públicas */}
          <Route path="/"             element={<Home />} />
          <Route path="/eventos/:id"  element={<EventoDetalle />} />
          <Route path="/marketplace"  element={<Marketplace />} />

          {/* Públicas — redirigen si ya hay sesión */}
          <Route path="/login"    element={estaAutenticado ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/registro" element={estaAutenticado ? <Navigate to="/" replace /> : <Registro />} />

          {/* Protegidas — solo cliente */}
          <Route
            path="/mis-tickets"
            element={
              <RutaProtegida rolesPermitidos={['cliente']}>
                <MisTickets />
              </RutaProtegida>
            }
          />
          <Route
            path="/ticket/:uuid"
            element={
              <RutaProtegida rolesPermitidos={['cliente']}>
                <TicketQR />
              </RutaProtegida>
            }
          />
          <Route
            path="/pagos"
            element={
              <RutaProtegida rolesPermitidos={['cliente']}>
                <Pagos />
              </RutaProtegida>
            }
          />

          {/* Protegidas — seguridad y admin */}
          <Route
            path="/validar"
            element={
              <RutaProtegida rolesPermitidos={['seguridad', 'admin']}>
                <Validar />
              </RutaProtegida>
            }
          />

          {/* Protegidas — solo admin */}
          <Route
            path="/admin"
            element={
              <RutaProtegida rolesPermitidos={['admin']}>
                <Admin />
              </RutaProtegida>
            }
          />

          {/* Protegidas — todos los roles autenticados */}
          <Route
            path="/perfil"
            element={
              <RutaProtegida rolesPermitidos={['cliente', 'admin', 'seguridad']}>
                <Perfil />
              </RutaProtegida>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
