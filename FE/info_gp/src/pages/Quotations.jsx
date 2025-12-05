import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, Alert } from 'react-bootstrap';
import { Plus, FileText, Eye, Calendar, Edit, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuoteDetailModal from '../componets/QuoteDetailModal'; // Importamos el Modal

const Quotations = () => {
  const navigate = useNavigate();
  
  // Estados de datos
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  // Función para cargar datos (se reutiliza al actualizar estado)
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      setQuotes(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial de cotizaciones.");
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchQuotes();
  }, []);

  // Abrir Modal de Decisión
  const handleOpenModal = (id) => {
    setSelectedQuoteId(id);
    setShowModal(true);
  };

  // Callback cuando se Acepta/Rechaza en el modal -> Recargar lista
  const handleStatusUpdated = () => {
    fetchQuotes();
  };

  // Helper para colores de estado
  const getStatusBadge = (status) => {
    switch(status) {
        case 'Aceptada': return 'success';
        case 'Rechazada': return 'danger';
        default: return 'secondary'; // Pendiente
    }
  };

  return (
    <Container className="py-4">
      
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-inst-blue fw-bold mb-0">Historial de Cotizaciones</h2>
          <p className="text-muted small mb-0">Gestiona tus propuestas comerciales</p>
        </div>
        <Button 
            className="btn-institutional d-flex align-items-center gap-2"
            onClick={() => navigate('/cotizaciones/nueva')}
        >
            <Plus size={18} /> Nueva Cotización
        </Button>
      </div>

      {/* Tabla de Contenido */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          
          {loading && <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>}
          
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}
          
          {!loading && !error && quotes.length === 0 && (
            <div className="text-center p-5 text-muted">
                <FileText size={48} className="mb-3 opacity-50" />
                <p>No se han generado cotizaciones aún.</p>
                <Button variant="link" onClick={() => navigate('/cotizaciones/nueva')}>Crear la primera</Button>
            </div>
          )}

          {!loading && quotes.length > 0 && (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4">Referencia</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.CotizacionID}>
                    <td className="ps-4 fw-bold text-inst-blue">
                        {q.NumeroCotizacion}
                    </td>
                    <td>
                        <div className="fw-bold text-dark">{q.NombreCliente}</div>
                        <div className="small text-muted" style={{fontSize: '0.8rem'}}>
                            {q.NombreEmpresa || 'Sin Empresa Asignada'}
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
                        <Badge bg={getStatusBadge(q.Estado)} className="px-3 fw-normal">
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
                                title="Ver PDF y Decidir"
                            >
                                <Eye size={18} />
                            </Button>

                            {/* Botón Editar (Solo si está pendiente, opcionalmente) */}
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                className="d-flex align-items-center gap-1 border-0 bg-light text-secondary"
                                onClick={() => navigate(`/cotizaciones/editar/${q.CotizacionID}`)}
                                title="Editar Cotización"
                                disabled={q.Estado !== 'Pendiente'} // Opcional: Bloquear si ya fue aceptada
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

      {/* --- MODAL DE DETALLE --- */}
      <QuoteDetailModal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        quoteId={selectedQuoteId}
        onStatusChange={handleStatusUpdated}
      />

    </Container>
  );
};

export default Quotations;