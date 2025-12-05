import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // <--- Importamos
import Layout from './componets/Layout'; // <--- Importamos
import CreateQuotation from './pages/CreateQuotation';
import CreateProduct from './pages/CreateProduct';
import RegisterUser from './pages/RegisterUser';
import Clients from './pages/Clients';
import CreateClient from './pages/CreateClient';
import Quotations from './pages/Quotations';
import EditClient from './pages/EditClient';
import Orders from './pages/Orders';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas dentro del Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cotizaciones" element={<Quotations />} />
            <Route path="/cotizaciones/nueva" element={<CreateQuotation />} />
            <Route path="/cotizaciones/editar/:id" element={<CreateQuotation />} />
            <Route path="/productos/nuevo" element={<CreateProduct />} />
            <Route path="/usuarios/registro" element={<RegisterUser />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/clientes/nuevo" element={<CreateClient />} />
            <Route path="/clientes/editar/:id" element={<EditClient />} />
            <Route path="/ordenes" element={<Orders />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;