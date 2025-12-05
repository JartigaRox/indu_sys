import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { Printer, CheckCircle, XCircle, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import api from '../api/axios';
import QuotationPDF from './QuotationPDF';

const QuoteDetailModal = ({ show, onHide, quoteId, onStatusChange }) => {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const componentRef = useRef(null);

  const handlePrint = () => {
    const element = componentRef.current;
    const opt = {
      margin:       [0.3, 0.3, 0.3, 0.3],
      filename:     `Cotizacion-${quoteData?.numeroCotizacion}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
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
                fechaEntrega: data.FechaEntregaEstimada,
                usuarioDecision: data.UsuarioDecision, // <--- QUIÉN DECIDIÓ
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
        }).catch(() => { setError("Error al cargar detalle"); setLoading(false); });
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
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title className="fs-5 d-flex align-items-center gap-2"><FileText size={20} className="text-inst-gold"/> Visor de Decisión</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light p-0">
        {loading && <div className="p-5 text-center"><Spinner animation="border"/></div>}
        {!loading && quoteData && (
            <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '70vh' }}>
                <div className="flex-grow-1 p-4 bg-secondary bg-opacity-25 text-center overflow-auto">
                    <div className="d-inline-block shadow bg-white text-start" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                        <div ref={componentRef}>
                            <QuotationPDF data={quoteData} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 border-start d-flex flex-column gap-3 shadow-sm" style={{ minWidth: '300px' }}>
                    <h6 className="fw-bold border-bottom pb-2">Gestión</h6>
                    <Button variant="outline-secondary" onClick={handlePrint} className="py-2"><Printer size={18} className="me-2"/> Descargar PDF</Button>
                    
                    {quoteData.usuarioDecision && (
                        <div className="alert alert-info small mt-2 mb-0">
                            <strong>Estado cambiado por:</strong><br/>{quoteData.usuarioDecision}
                        </div>
                    )}

                    <hr className="my-2"/>
                    <p className="small text-muted mb-2 text-center text-uppercase fw-bold">Decisión del Cliente</p>
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