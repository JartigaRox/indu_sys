import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { Printer, CheckCircle, XCircle, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js'; // <--- LIBRERÍA DE IMPRESIÓN
import api from '../api/axios';
import QuotationPDF from './QuotationPDF';

const QuoteDetailModal = ({ show, onHide, quoteId, onStatusChange }) => {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const componentRef = useRef(null);

  // FUNCIÓN IMPRESIÓN (html2pdf)
const handlePrint = () => {
    const element = componentRef.current;
    
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5], // Márgenes [Arriba, Izq, Abajo, Der] en pulgadas (aprox 1.27cm)
      filename:     `Cotizacion-${pdfData.numeroCotizacion}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true }, 
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      // ESTA ES LA CLAVE PARA QUE NO SE DESBORDE:
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } 
    };

    // Generar y Guardar
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (show && quoteId) {
      setLoading(true);
      api.get(`/quotations/${quoteId}`).then(res => {
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
            setLoading(false);
        }).catch(() => { setError("Error al cargar"); setLoading(false); });
    }
  }, [show, quoteId]);

  const handleStatus = async (newStatus) => {
    if (window.confirm(`¿Confirmar cotización como ${newStatus}?`)) {
        await api.patch(`/quotations/${quoteId}/status`, { status: newStatus });
        onStatusChange();
        onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 fw-bold text-inst-blue"><FileText className="me-2"/> Detalle Cotización</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light p-0">
        {loading && <div className="p-5 text-center"><Spinner animation="border"/></div>}
        {error && <Alert variant="danger" className="m-3">{error}</Alert>}

        {!loading && !error && quoteData && (
            <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '70vh' }}>
                
                {/* LADO IZQUIERDO: VISTA PREVIA (Referencia para html2pdf) */}
                <div className="flex-grow-1 p-4 bg-secondary bg-opacity-25 text-center overflow-auto">
                    <div className="d-inline-block shadow bg-white text-start" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                        <div ref={componentRef}>
                            <QuotationPDF data={quoteData} />
                        </div>
                    </div>
                </div>

                {/* LADO DERECHO: BOTONES */}
                <div className="bg-white p-4 border-start d-flex flex-column gap-3 shadow-sm" style={{ minWidth: '300px' }}>
                    <h6 className="fw-bold border-bottom pb-2">Acciones</h6>
                    <Button variant="outline-secondary" onClick={handlePrint} className="py-2"><Printer size={18} className="me-2"/> Descargar PDF</Button>
                    <hr className="my-2"/>
                    <Button variant="success" onClick={() => handleStatus('Aceptada')} className="py-3 fw-bold"><CheckCircle size={20} className="me-2"/> ACEPTAR</Button>
                    <Button variant="outline-danger" onClick={() => handleStatus('Rechazada')} className="py-2"><XCircle size={20} className="me-2"/> RECHAZAR</Button>
                </div>
            </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default QuoteDetailModal;