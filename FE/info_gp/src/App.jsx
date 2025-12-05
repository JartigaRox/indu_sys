import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout y Páginas
import Layout from './componets/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import CreateClient from './pages/CreateClient';
import EditClient from './pages/EditClient';
import Quotations from './pages/Quotations';
import CreateQuotation from './pages/CreateQuotation';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
import Orders from './pages/Orders';
import RegisterUser from './pages/RegisterUser';

// Protección de Rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Privadas (Dentro del Layout) */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            
            <Route path="/" element={<Dashboard />} />
            
            {/* Clientes */}
            <Route path="/clientes" element={<Clients />} />
            <Route path="/clientes/nuevo" element={<CreateClient />} />
            <Route path="/clientes/editar/:id" element={<EditClient />} />

            {/* Cotizaciones */}
            <Route path="/cotizaciones" element={<Quotations />} />
            <Route path="/cotizaciones/nueva" element={<CreateQuotation />} />
            <Route path="/cotizaciones/editar/:id" element={<CreateQuotation />} />

            {/* Productos */}
            <Route path="/productos" element={<Products />} />
            <Route path="/productos/nuevo" element={<CreateProduct />} />
            <Route path="/productos/editar/:id" element={<EditProduct />} />

            {/* Ordenes y Usuarios */}
            <Route path="/ordenes" element={<Orders />} />
            <Route path="/usuarios/registro" element={<RegisterUser />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;