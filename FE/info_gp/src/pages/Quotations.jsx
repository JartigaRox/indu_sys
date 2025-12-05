import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, Alert } from 'react-bootstrap';
import { Plus, FileText, Eye, Calendar, Check, X } from 'lucide-react'; // Íconos actualizados
import { useNavigate } from 'react-router-dom';
import QuoteDetailModal from '../componets/QuoteDetailModal'; // <--- IMPORTAR EL MODAL

const Quotations = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para el Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  // Función para cargar datos (la extraemos para poder reusarla al actualizar estado)
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      setQuotes(res.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Función al hacer clic en "Ver / Acciones"
  const handleOpenModal = (id) => {
    setSelectedQuoteId(id);
    setShowModal(true);
  };

  // Función callback para cuando se acepta/rechaza en el modal
  const handleStatusUpdated = () => {
    fetchQuotes(); // Recargamos la lista para ver el nuevo estado (Verde/Rojo)
  };

  // Helper para color del Badge
  const getStatusBadge = (status) => {
    switch(status) {
        case 'Aceptada': return 'success';
        case 'Rechazada': return 'danger';
        default: return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-inst-blue fw-bold mb-0">Cotizaciones</h2>
          <p className="text-muted small mb-0">Gestión y aprobación de propuestas</p>
        </div>
        <Button 
            className="btn-institutional d-flex align-items-center gap-2"
            onClick={() => navigate('/cotizaciones/nueva')}
        >
            <Plus size={18} /> Nueva Cotización
        </Button>
      </div>

      {/* Tabla */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading && <div className="text-center p-5"><Spinner animation="border" /></div>}
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}
          
          {!loading && quotes.length > 0 && (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4">Referencia</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.CotizacionID}>
                    <td className="ps-4 fw-bold text-inst-blue">{q.NumeroCotizacion}</td>
                    <td><div className="fw-bold text-dark">{q.NombreCliente}</div></td>
                    <td>
                        <div className="small text-muted d-flex align-items-center gap-1">
                            <Calendar size={14} /> {new Date(q.FechaRealizacion).toLocaleDateString()}
                        </div>
                    </td>
                    <td className="text-end fw-bold">${q.TotalCotizacion ? q.TotalCotizacion.toFixed(2) : '0.00'}</td>
                    <td className="text-center">
                        <Badge bg={getStatusBadge(q.Estado)} className="px-3 fw-normal">
                            {q.Estado || 'Pendiente'}
                        </Badge>
                    </td>
                    <td className="text-center">
                        {/* Botón Principal de Acciones */}
                        <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="d-flex align-items-center gap-1 mx-auto"
                            onClick={() => handleOpenModal(q.CotizacionID)}
                        >
                            <Eye size={16} /> Ver / Decidir
                        </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- MODAL DE DETALLE Y ACCIONES --- */}
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