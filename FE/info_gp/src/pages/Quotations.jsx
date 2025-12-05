import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { Plus, FileText, Eye, Calendar, Edit, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuoteDetailModal from '../componets/QuoteDetailModal';

const Quotations = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      setQuotes(res.data);
      setFilteredQuotes(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, []);

  // Filtrar cotizaciones según el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredQuotes(quotes);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = quotes.filter(q => 
      q.NumeroCotizacion?.toLowerCase().includes(term) ||
      q.NombreCliente?.toLowerCase().includes(term) ||
      q.NombreEmpresa?.toLowerCase().includes(term) ||
      q.Estado?.toLowerCase().includes(term)
    );
    setFilteredQuotes(filtered);
  }, [searchTerm, quotes]);

  const handleOpenModal = (id) => {
    setSelectedQuoteId(id);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    switch(status) {
        case 'Aceptada': return 'success';
        case 'Rechazada': return 'danger';
        default: return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-inst-blue fw-bold mb-0">Historial de Cotizaciones</h2>
          <p className="text-muted small mb-0">Administra tus propuestas</p>
        </div>
        <Button className="btn-institutional d-flex align-items-center gap-2" onClick={() => navigate('/cotizaciones/nueva')}>
            <Plus size={18} /> Nueva Cotización
        </Button>
      </div>

      {/* Buscador */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-3">
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por número de cotización, cliente, empresa o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0 ps-0"
            />
            {searchTerm && (
              <Button 
                variant="link" 
                className="text-secondary text-decoration-none"
                onClick={() => setSearchTerm('')}
              >
                Limpiar
              </Button>
            )}
          </InputGroup>
          {searchTerm && (
            <small className="text-muted d-block mt-2">
              Mostrando {filteredQuotes.length} de {quotes.length} cotizaciones
            </small>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading && <div className="text-center p-5"><Spinner animation="border" /></div>}
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}
          
          {!loading && !error && quotes.length === 0 && (
            <div className="text-center p-5 text-muted">
                <FileText size={48} className="mb-3 opacity-50" />
                <p>No hay cotizaciones.</p>
            </div>
          )}

          {!loading && !error && quotes.length > 0 && filteredQuotes.length === 0 && (
            <div className="text-center p-5 text-muted">
                <Search size={48} className="mb-3 opacity-50" />
                <p>No se encontraron cotizaciones con "{searchTerm}"</p>
                <Button variant="link" onClick={() => setSearchTerm('')}>Limpiar búsqueda</Button>
            </div>
          )}

          {!loading && filteredQuotes.length > 0 && (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4">Ref.</th>
                  <th>Cliente</th>
                  <th>Fecha creacion</th>
                  <th>Fecha Entrega Estimada</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map(q => (
                  <tr key={q.CotizacionID}>
                    <td className="ps-4 fw-bold text-inst-blue">{q.NumeroCotizacion}</td>
                    <td>
                        <div className="fw-bold text-dark">{q.NombreCliente}</div>
                        <div className="small text-muted" style={{fontSize:'0.8em'}}>{q.NombreEmpresa}</div>
                    </td>
                    <td><div className="small text-muted d-flex align-items-center gap-1"><Calendar size={14}/> {q.FechaRealizacion ? q.FechaRealizacion.split('T')[0].split('-').reverse().join('/') : 'N/A'}</div></td>
                    <td><div className="small text-muted d-flex align-items-center gap-1"><Calendar size={14}/> {q.FechaEntregaEstimada ? q.FechaEntregaEstimada.split('T')[0].split('-').reverse().join('/') : 'N/A'}</div></td>
                    <td className="text-end fw-bold">${q.TotalCotizacion ? q.TotalCotizacion.toFixed(2) : '0.00'}</td>
                    <td className="text-center"><Badge bg={getStatusBadge(q.Estado)} className="px-3 fw-normal">{q.Estado || 'Pendiente'}</Badge></td>
                    <td className="text-center pe-4">
                        <div className="d-flex justify-content-center gap-2">
                            <Button variant="outline-primary" size="sm" className="border-0 bg-light text-primary" onClick={() => handleOpenModal(q.CotizacionID)}><Eye size={18}/></Button>
                            <Button variant="outline-secondary" size="sm" className="border-0 bg-light text-secondary" onClick={() => navigate(`/cotizaciones/editar/${q.CotizacionID}`)} enabled={q.Estado !== 'Pendiente'}><Edit size={18}/></Button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <QuoteDetailModal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        quoteId={selectedQuoteId}
        onStatusChange={fetchQuotes}
      />
    </Container>
  );
};

export default Quotations;