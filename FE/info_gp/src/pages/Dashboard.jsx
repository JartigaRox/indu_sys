import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // Nuestra conexión al backend
import { Card, Row, Col, Button, Badge, Table, Spinner, Alert } from 'react-bootstrap';
import { TrendingUp, Users, FileText, AlertCircle, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Para navegar a crear cotización

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rolId === 1;

  // Estados para guardar los datos de la BD
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos al iniciar la pantalla
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Obtener Cotizaciones Reales
        const res = await api.get('/quotations');
        setQuotes(res.data);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setError("No se pudieron cargar las cotizaciones recientes.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-inst-blue fw-bold">Panel de Control</h2>
          <p className="text-muted mb-0">Bienvenido de nuevo, {user?.username}</p>
        </div>
        <Badge bg={isAdmin ? "primary" : "warning"} className="fs-6 px-3 py-2 bg-inst-blue border border-inst-gold">
          {isAdmin ? "ADMINISTRADOR" : "OPERADOR"}
        </Badge>
      </div>

      {/* --- TARJETAS DE RESUMEN (KPIs) --- */}
      <Row className="mb-4 g-4">
        <Col md={isAdmin ? 3 : 4}>
          <Card className="border-0 shadow-sm border-start border-4 border-inst-blue h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1">Cotizaciones</h6>
                  <h3 className="fw-bold text-inst-blue">{quotes.length}</h3>
                </div>
                <div className="bg-light p-3 rounded-circle text-inst-blue">
                  <FileText size={24} />
                </div>
              </div>
              <div className="text-muted small mt-2">Registradas en el sistema</div>
            </Card.Body>
          </Card>
        </Col>

        {/* Tarjeta de Acción Rápida */}
        <Col md={isAdmin ? 3 : 4}>
            <Card 
                className="bg-inst-blue text-white border-0 shadow h-100 cursor-pointer hover-scale" 
                onClick={() => navigate("/cotizaciones/nueva")}
                style={{ transition: 'transform 0.2s' }}
            >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
                <Plus size={32} className="text-inst-gold mb-2" />
                <h5 className="fw-bold mb-0">Nueva Cotización</h5>
                <small className="text-white-50">Crear documento</small>
            </Card.Body>
            </Card>
        </Col>

        {isAdmin && (
            <Col md={isAdmin ? 3 : 4}>
            <Card 
                className="bg-inst-blue text-white border-0 shadow h-100 cursor-pointer hover-scale" 
                onClick={() => navigate("/usuarios/registro")} 
                style={{ transition: 'transform 0.2s' }}
            >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
                <Plus size={32} className="text-inst-gold mb-2" />
                <h5 className="fw-bold mb-0">Nuevo Usuario</h5>
                <small className="text-white-50">Crear cuenta</small>
            </Card.Body>
            </Card>
        </Col>
            )}
      </Row>

      {/* --- TABLA DE COTIZACIONES RECIENTES (REAL) --- */}
      <h5 className="text-inst-blue fw-bold mb-3 d-flex align-items-center gap-2">
        <FileText size={20} /> Últimas Cotizaciones
      </h5>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Card.Body className="p-0">
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Cargando datos...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">{error}</Alert>
          ) : quotes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FileText size={40} className="mb-2 opacity-50" />
              <p>No hay cotizaciones registradas aún.</p>
              <Button size="sm" className="btn-institutional">Crear la primera</Button>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4 py-3"># Cotización</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.CotizacionID} className="border-bottom">
                    <td className="ps-4 fw-bold text-inst-blue">
                      {q.NumeroCotizacion}
                    </td>
                    <td>{q.NombreCliente}</td>
                    <td>{new Date(q.FechaRealizacion).toLocaleDateString()}</td>
                    <td className="text-end fw-bold">
                      ${q.TotalCotizacion ? q.TotalCotizacion.toFixed(2) : '0.00'}
                    </td>
                    <td className="text-center">
                      <Badge bg="secondary" className="fw-normal px-3">
                        Pendiente
                      </Badge>
                      {/* Aquí luego pondremos lógica: si es Aceptada (verde), Rechazada (rojo) */}
                    </td>
                    <td className="text-center">
                      <Button variant="link" className="text-secondary p-0" title="Ver detalle">
                        <Search size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;