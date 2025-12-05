import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner, Alert, ButtonGroup } from 'react-bootstrap';
import { Printer, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import QuotationPDF from './QuotationPDF';

const QuoteDetailModal = ({ show, onHide, quoteId, onStatusChange }) => {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const componentRef = useRef();

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (show && quoteId) {
      setLoading(true);
      api.get(`/quotations/${quoteId}`)
        .then(res => {
            // Adaptamos la respuesta para que encaje con lo que espera QuotationPDF
            const data = res.data;
            const formattedData = {
                cliente: {
                    NombreCliente: data.NombreCliente,
                    DireccionCalle: data.DireccionCalle || '',
                    Municipio: data.Municipio || '',
                    Departamento: data.Departamento || '',
                    Telefono: data.TelefonoSnapshot, // Usamos el del snapshot por seguridad histórica
                    AtencionA: data.AtencionASnapshot
                },
                items: data.items.map(i => ({
                    cantidad: i.Cantidad,
                    nombre: i.NombreProducto,
                    codigo: i.CodigoProducto,
                    precio: i.PrecioUnitario,
                    productoId: i.ProductoID // Importante para la imagen
                })),
                user: { username: data.NombreQuienCotiza },
                numeroCotizacion: data.NumeroCotizacion,
                fecha: data.FechaRealizacion
            };
            setQuoteData(formattedData);
            setError(null);
        })
        .catch(err => setError("Error cargando el detalle"))
        .finally(() => setLoading(false));
    }
  }, [show, quoteId]);

  // Función Imprimir
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: quoteData ? `Cotizacion_${quoteData.numeroCotizacion}` : 'Documento'
  });

  // Función Cambiar Estado
  const handleStatus = async (newStatus) => {
    if (!window.confirm(`¿Estás seguro de marcar esta cotización como ${newStatus}?`)) return;
    
    try {
        await api.patch(`/quotations/${quoteId}/status`, { status: newStatus });
        onStatusChange(); // Avisar al padre para recargar la lista
        onHide(); // Cerrar modal
    } catch (err) {
        alert("Error al actualizar estado");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            <FileText size={20} className="text-inst-gold" /> 
            Visor de Cotización
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light p-0">
        {loading && <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>}
        
        {error && <div className="p-4"><Alert variant="danger">{error}</Alert></div>}

        {!loading && !error && quoteData && (
            <div className="d-flex flex-column flex-lg-row h-100">
                
                {/* LADO IZQUIERDO: VISTA PREVIA PDF */}
                <div className="flex-grow-1 p-4 overflow-auto bg-secondary bg-opacity-25 text-center" style={{ maxHeight: '70vh' }}>
                    <div className="d-inline-block shadow bg-white text-start" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                        <QuotationPDF ref={componentRef} data={quoteData} />
                    </div>
                </div>

                {/* LADO DERECHO: ACCIONES */}
                <div className="bg-white p-4 border-start d-flex flex-column gap-3 shadow-sm" style={{ minWidth: '280px' }}>
                    <h6 className="text-inst-blue fw-bold border-bottom pb-2">Acciones</h6>
                    
                    <Button variant="outline-secondary" onClick={handlePrint} className="d-flex align-items-center justify-content-center gap-2">
                        <Printer size={18} /> Imprimir PDF
                    </Button>

                    <div className="my-2 border-top"></div>
                    <p className="small text-muted mb-2">Decisión del Cliente:</p>
                    
                    <Button 
                        variant="success" 
                        onClick={() => handleStatus('Aceptada')}
                        className="d-flex align-items-center justify-content-center gap-2 fw-bold text-white"
                    >
                        <CheckCircle size={18} /> ACEPTAR
                    </Button>

                    <Button 
                        variant="outline-danger" 
                        onClick={() => handleStatus('Rechazada')}
                        className="d-flex align-items-center justify-content-center gap-2"
                    >
                        <XCircle size={18} /> RECHAZAR
                    </Button>
                </div>
            </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default QuoteDetailModal;