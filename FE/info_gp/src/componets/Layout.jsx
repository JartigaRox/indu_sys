import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Home, FileText, Users, Package, Menu, X } from 'lucide-react';
import { Button, Offcanvas, Container } from 'react-bootstrap';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rolId === 1;
  
  // Estado para controlar si el menú móvil está abierto
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Contenido del Menú (Reutilizable para Desktop y Mobile)
  const SidebarContent = () => (
    <div className="d-flex flex-column h-100 text-white">
        {/* Logo */}
        <div className="mb-4 text-center pt-2">
          <h3 className="fw-bold text-white mb-0">INFO GP</h3>
          <div style={{ height: '3px', width: '40px', backgroundColor: '#D4AF37', margin: '5px auto' }}></div>
        </div>

        {/* Navegación */}
        <nav className="flex-grow-1">
          <ul className="list-unstyled d-flex flex-column gap-2 px-2">
            <li>
              <button onClick={() => { navigate('/'); setShowMobileMenu(false); }} className="btn text-white w-100 text-start d-flex align-items-center gap-2 hover-gold">
                <Home size={20} /> Dashboard
              </button>
            </li>
            
            <li>
              <button onClick={() => setShowMobileMenu(false)} className="btn text-white w-100 text-start d-flex align-items-center gap-2 hover-gold">
                <Users size={20} /> Clientes
              </button>
            </li>
            <li>
              <button onClick={() => setShowMobileMenu(false)} className="btn text-white w-100 text-start d-flex align-items-center gap-2 hover-gold">
                <FileText size={20} /> Cotizaciones
              </button>
            </li>
            <div className="text-white-50 small text-uppercase mt-3 mb-1 px-3">Administración</div>
                <li>
                  <button onClick={() => setShowMobileMenu(false)} className="btn text-white w-100 text-start d-flex align-items-center gap-2 hover-gold">
                    <Package size={20} /> Productos
                  </button>
                </li>

            {isAdmin && (
              <>
                <div className="text-white-50 small text-uppercase mt-3 mb-1 px-3">Registrar Usuarios</div>
                <li>
                  <button onClick={() => setShowMobileMenu(false)} className="btn text-white w-100 text-start d-flex align-items-center gap-2 hover-gold">
                    <Users size={20} /> Registro
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Footer Sidebar */}
        <div className="mt-auto border-top border-secondary pt-3 px-3 pb-3">
          <div className="small text-white-50 mb-2">Usuario: <strong className="text-white">{user?.username}</strong></div>
          <button onClick={handleLogout} className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2">
            <LogOut size={18} /> Salir
          </button>
        </div>
    </div>
  );

  return (
    <div className="d-flex bg-light" style={{ minHeight: '100vh' }}>
      
      {/* 1. SIDEBAR DESKTOP (Oculto en móviles 'd-none d-md-flex') */}
      <div className="bg-inst-blue d-none d-md-flex flex-column p-3" style={{ width: '250px', minHeight: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1000 }}>
        <SidebarContent />
      </div>

      {/* 2. SIDEBAR MOVIL (Offcanvas) */}
      <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} className="bg-inst-blue w-75">
        <Offcanvas.Header closeButton closeVariant="white">
            {/* El botón de cerrar (X) ya viene incluido con closeButton */}
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
            <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      {/* 3. CONTENIDO PRINCIPAL */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '0', width: '100%' }}>
        
        {/* Barra Superior Móvil (Solo visible en móviles 'd-md-none') */}
        <div className="d-md-none bg-inst-blue text-white p-3 d-flex align-items-center justify-content-between shadow-sm">
            <h4 className="m-0 fw-bold">INDU SYS</h4>
            <Button variant="link" className="text-white p-0" onClick={() => setShowMobileMenu(true)}>
                <Menu size={28} />
            </Button>
        </div>

        {/* Área de contenido real */}
        <main className="p-4 flex-grow-1" style={{ 
            // En desktop dejamos margen a la izquierda para no tapar el menú fijo
            // En móvil quitamos el margen
             marginLeft: window.innerWidth >= 768 ? '250px' : '0' 
        }}>
            {/* Truco CSS para manejar el margen responsive sin JS complejo */}
            <style>{`
                @media (min-width: 768px) {
                    main { margin-left: 250px !important; }
                }
                @media (max-width: 767px) {
                    main { margin-left: 0 !important; }
                }
                .hover-gold:hover { background-color: rgba(212, 175, 55, 0.2); color: #D4AF37 !important; }
            `}</style>
            
            <Outlet />
        </main>
      </div>

    </div>
  );
};

export default Layout;