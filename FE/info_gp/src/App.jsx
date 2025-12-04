import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // <--- Importamos
import Layout from './componets/Layout'; // <--- Importamos

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
            {/* Aquí irán las otras rutas:
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            */}
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;