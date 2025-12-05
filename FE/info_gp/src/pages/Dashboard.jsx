import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, Row, Col, Button, Badge, Table, Spinner, Alert } from 'react-bootstrap';
import { TrendingUp, Users, FileText, AlertCircle, Plus, Eye, Edit, Calendar, Table2Icon,ClipboardList } from 'lucide-react'; // Agregamos Eye, Edit, Calendar
import { useNavigate } from 'react-router-dom';
import QuoteDetailModal from '../componets/QuoteDetailModal'; // <--- IMPORTANTE: Importar el Modal

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rolId === 1;

  // Estados de datos
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el Modal (Igual que en Quotations.jsx)
  const [showModal, setShowModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  // Función de carga (ahora recargable)
  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/quotations');
      // Solo mostramos las últimas 5 en el Dashboard para no saturar
      setQuotes(res.data.slice(0, 5)); 
      setError(null);
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      setError("No se pudieron cargar las cotizaciones recientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- FUNCIONES DE ACCIÓN (Copiadas de Quotations.jsx) ---
  
  const handleOpenModal = (id) => {
    setSelectedQuoteId(id);
    setShowModal(true);
  };

  const handleStatusUpdated = () => {
    fetchDashboardData(); // Recargar datos si se acepta/rechaza
  };

  const getStatusBadge = (status) => {
    switch(status) {
        case 'Aceptada': return 'success';
        case 'Rechazada': return 'danger';
        default: return 'secondary';
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-inst-blue fw-bold">Panel de Control</h2>
          <p className="text-muted mb-0">Bienvenido, {user?.username}</p>
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
              <div className="text-muted small mt-2">Recientes en pantalla</div>
            </Card.Body>
          </Card>
        </Col>

        {/* Acceso Rápido: Nueva Cotización */}
        <Col md={isAdmin ? 3 : 4}>
            <Card 
                className="bg-inst-blue text-white border-0 shadow h-100 cursor-pointer" 
                onClick={() => navigate('/cotizaciones/nueva')}
                style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
            >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
                <Plus size={32} className="text-inst-gold mb-2" />
                <h5 className="fw-bold mb-0">Nueva Cotización</h5>
                <small className="text-white-50">Crear documento</small>
            </Card.Body>
            </Card>
        </Col>

        {/* Acceso Rápido: Ordenes de pedido */}
        <Col md={isAdmin ? 3 : 4}>
            <Card 
                className="bg-inst-blue text-white border-0 shadow h-100 cursor-pointer" 
                onClick={() => navigate('/ordenes')}
                style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
            >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
                <ClipboardList size={32} className="text-inst-gold mb-2" />
                <h5 className="fw-bold mb-0">Ordenes de pedido</h5>
                <small className="text-white-50">Ver ordenes de pedido</small>
            </Card.Body>
            </Card>
        </Col>


        {/* Acceso Rápido: Nuevo Usuario (Solo Admin) */}
        {isAdmin && (
            <Col md={isAdmin ? 3 : 4}>
            <Card 
                className="bg-white border-0 shadow-sm h-100 cursor-pointer border-start border-4 border-inst-gold" 
                onClick={() => navigate('/usuarios/registro')}
                style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
            >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
                <Users size={32} className="text-inst-blue mb-2" />
                <h5 className="fw-bold mb-0 text-inst-blue">Nuevo Usuario</h5>
                <small className="text-muted">Gestión de equipo</small>
            </Card.Body>
            </Card>
        </Col>
        )}
      </Row>

      {/* --- TABLA DE ÚLTIMAS COTIZACIONES (Ahora idéntica al módulo) --- */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="text-inst-blue fw-bold mb-0 d-flex align-items-center gap-2">
            <FileText size={20} /> Últimas Cotizaciones
        </h5>
        <Button variant="link" onClick={() => navigate('/cotizaciones')} className="text-decoration-none small fw-bold">
            Ver todas &rarr;
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Card.Body className="p-0">
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Cargando...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">{error}</Alert>
          ) : quotes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FileText size={40} className="mb-2 opacity-50" />
              <p>No hay actividad reciente.</p>
              <Button size="sm" className="btn-institutional" onClick={() => navigate('/cotizaciones/nueva')}>
                Crear Cotización
              </Button>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4">Ref.</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.CotizacionID} className="border-bottom">
                    <td className="ps-4 fw-bold text-inst-blue">
                      {q.NumeroCotizacion}
                    </td>
                    <td>
                        <div className="fw-bold text-dark">{q.NombreCliente}</div>
                        <div className="small text-muted" style={{fontSize: '0.75rem'}}>
                            {q.NombreEmpresa || 'Sin Empresa'}
                        </div>
                    </td>
                    <td>
                        <div className="small text-muted d-flex align-items-center gap-1">
                            <Calendar size={14} />
                            {new Date(q.FechaRealizacion).toLocaleDateString()}
                        </div>
                    </td>
                    <td className="text-end fw-bold">
                      ${q.TotalCotizacion ? q.TotalCotizacion.toFixed(2) : '0.00'}
                    </td>
                    <td className="text-center">
                      <Badge bg={getStatusBadge(q.Estado)} className="fw-normal px-3">
                        {q.Estado || 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="text-center pe-4">
                        <div className="d-flex justify-content-center gap-2">
                            {/* Botón Ver / Decidir */}
                            <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="d-flex align-items-center gap-1 border-0 bg-light text-primary"
                                onClick={() => handleOpenModal(q.CotizacionID)}
                                title="Ver y Decidir"
                            >
                                <Eye size={18} />
                            </Button>

                            {/* Botón Editar (Solo si está pendiente) */}
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                className="d-flex align-items-center gap-1 border-0 bg-light text-secondary"
                                onClick={() => navigate(`/cotizaciones/editar/${q.CotizacionID}`)}
                                title="Editar"
                                enabled={q.Estado !== 'Pendiente'}
                            >
                                <Edit size={18} />
                            </Button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- MODAL INTEGRADO --- */}
      <QuoteDetailModal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        quoteId={selectedQuoteId}
        onStatusChange={handleStatusUpdated}
      />

    </div>
  );
};

export default Dashboard;