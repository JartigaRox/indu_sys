import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { Printer, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import QuotationPDF from './QuotationPDF';

const QuoteDetailModal = ({ show, onHide, quoteId, onStatusChange }) => {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Referencia para la impresión (Debe apuntar al componente PDF visual)
  const componentRef = useRef();

  // Hook de impresión vinculado a la referencia
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: quoteData ? `Cotizacion_${quoteData.numeroCotizacion}` : 'Documento',
    onAfterPrint: () => console.log("Impresión terminada")
  });

  useEffect(() => {
    if (show && quoteId) {
      setLoading(true);
      api.get(`/quotations/${quoteId}`)
        .then(res => {
            const data = res.data;
            const formattedData = {
                cliente: {
                    NombreCliente: data.NombreCliente,
                    DireccionCalle: data.DireccionCalle,
                    Municipio: data.Municipio,
                    Departamento: data.Departamento,
                    Telefono: data.TelefonoSnapshot,
                    AtencionA: data.AtencionASnapshot
                },
                items: data.items.map(i => ({
                    cantidad: i.Cantidad,
                    nombre: i.NombreProducto,
                    codigo: i.CodigoProducto,
                    precio: i.PrecioUnitario,
                    productoId: i.ProductoID 
                })),
                user: { username: data.NombreQuienCotiza },
                numeroCotizacion: data.NumeroCotizacion,
                fecha: data.FechaRealizacion,
                empresa: {
                    EmpresaID: data.EmpresaID,
                    Nombre: data.EmpresaNombre,
                    Direccion: data.EmpresaDireccion,
                    NCR: data.NCR,
                    Telefono: data.TelefonoEmpresa, 
                    CorreoElectronico: data.EmailEmpresa,
                    PaginaWeb: data.WebEmpresa
                }
            };
            setQuoteData(formattedData);
            setError(null);
        })
        .catch(err => {
            console.error(err);
            setError("Error cargando el detalle");
        })
        .finally(() => setLoading(false));
    }
  }, [show, quoteId]);

  const handleStatus = async (newStatus) => {
    if (!window.confirm(`¿Estás seguro de marcar esta cotización como ${newStatus}?`)) return;
    try {
        await api.patch(`/quotations/${quoteId}/status`, { status: newStatus });
        onStatusChange(); 
        onHide(); 
    } catch (err) {
        alert("Error al actualizar estado");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            <FileText size={20} className="text-inst-gold" /> 
            Visor de Decisión
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light p-0">
        {loading && <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>}
        {error && <div className="p-4"><Alert variant="danger">{error}</Alert></div>}

        {!loading && !error && quoteData && (
            <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '70vh' }}>
                
                {/* IZQUIERDA: PDF VISIBLE (Aquí está la referencia ref={componentRef}) */}
                <div className="flex-grow-1 p-4 bg-secondary bg-opacity-25 text-center overflow-auto">
                    <div className="d-inline-block shadow bg-white text-start" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                        <QuotationPDF ref={componentRef} data={quoteData} />
                    </div>
                </div>

                {/* DERECHA: BOTONES DE ACCIÓN */}
                <div className="bg-white p-4 border-start d-flex flex-column gap-3 shadow-sm" style={{ minWidth: '300px' }}>
                    <h6 className="text-inst-blue fw-bold border-bottom pb-2">Gestión</h6>
                    
                    {/* Botón Imprimir */}
                    <Button variant="outline-secondary" onClick={handlePrint} className="d-flex align-items-center justify-content-center gap-2 py-2">
                        <Printer size={18} /> Imprimir / Guardar PDF
                    </Button>

                    <div className="my-3 border-top"></div>
                    <p className="small text-muted mb-2 text-center text-uppercase fw-bold">Decisión del Cliente</p>
                    
                    {/* Botones de Decisión (Sin Pendiente) */}
                    <Button 
                        variant="success" 
                        onClick={() => handleStatus('Aceptada')}
                        className="d-flex align-items-center justify-content-center gap-2 fw-bold text-white py-3"
                    >
                        <CheckCircle size={20} /> ACEPTAR
                    </Button>

                    <Button 
                        variant="outline-danger" 
                        onClick={() => handleStatus('Rechazada')}
                        className="d-flex align-items-center justify-content-center gap-2 py-3"
                    >
                        <XCircle size={20} /> RECHAZAR
                    </Button>
                </div>
            </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default QuoteDetailModal;    