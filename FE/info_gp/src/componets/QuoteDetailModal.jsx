import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { Printer, CheckCircle, XCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import QuotationPDF from './QuotationPDF';
import OrderFormModal from './OrderFormModal';

const QuoteDetailModal = ({ show, onHide, quoteId, onStatusChange }) => {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const componentRef = useRef(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: quoteData ? `Cotizacion-${quoteData.numeroCotizacion}` : 'Documento',
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
                    DireccionCalle: data.DireccionCalle || '',
                    Municipio: data.Municipio || '',
                    AtencionA: data.AtencionA || '',
                    Telefono: data.TelefonoCliente || ''
                },
                items: data.items.map(i => ({
                    cantidad: i.Cantidad,
                    nombre: i.NombreProducto,
                    codigo: i.CodigoProducto,
                    precio: i.PrecioUnitario,
                    productoId: i.ProductoID
                })),
                user: { username: data.NombreQuienCotiza || 'Vendedor' },
                numeroCotizacion: data.NumeroCotizacion,
                fecha: data.FechaRealizacion,
                fechaEntrega: data.FechaEntregaEstimada,
                CotizacionID: data.CotizacionID,
                estado: data.Estado,
                usuarioDecision: data.UsuarioDecision,
                empresa: {
                    EmpresaID: data.EmpresaID,
                    Nombre: data.EmpresaNombre,
                    Direccion: data.EmpresaDireccion,
                    Telefono: data.EmpresaTelefono,
                    CorreoElectronico: data.EmpresaEmail,
                    PaginaWeb: data.EmpresaWeb
                }
            };
            setQuoteData(formattedData);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }
  }, [show, quoteId]);

  const handleDecision = async (decision) => {
    if (decision === 'Aceptada') {
        onHide();
        setShowOrderForm(true);
    } else {
        if (window.confirm('¿Confirmar rechazo de la cotización?')) {
            try {
                await api.patch(`/quotations/${quoteId}/status`, { status: 'Rechazada' });
                onStatusChange();
                onHide();
            } catch (error) {
                console.error(error);
            }
        }
    }
  };

  return (
    <>
        <Modal show={show} onHide={onHide} size="xl" centered contentClassName="border-0">
            <Modal.Header closeButton className="bg-inst-blue text-white">
                <Modal.Title className="fw-bold">Detalle de Cotización</Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="bg-light p-0">
                {loading ? (
                    <div className="p-5 text-center"><Spinner animation="border"/></div>
                ) : (
                    <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '80vh' }}>
                        
                        {/* ZONA IZQUIERDA: VISTA PREVIA */}
                        <div className="flex-grow-1 p-4 bg-secondary bg-opacity-25 text-center overflow-auto d-flex justify-content-center">
                            <div 
                                className="shadow bg-white text-start" 
                                style={{ 
                                    width: '210mm', 
                                    minHeight: '297mm', 
                                    transform: 'scale(0.85)', 
                                    transformOrigin: 'top center' 
                                }}
                            >
                                <div ref={componentRef}>
                                    <QuotationPDF data={quoteData} />
                                </div>
                            </div>
                        </div>

                        {/* ZONA DERECHA: ACCIONES */}
                        {/* CAMBIO AQUÍ: Eliminé 'justify-content-between' y reorganicé los divs */}
                        <div className="bg-white p-4 border-start shadow-sm d-flex flex-column gap-4" style={{ minWidth: '320px' }}>
                            
                            {/* Grupo 1: Imprimir */}
                            <div>
                                <h5 className="fw-bold mb-3 text-secondary">Documento</h5>
                                <Button variant="outline-dark" onClick={handlePrint} className="w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                                    <Printer size={18}/> Imprimir / Descargar
                                </Button>
                            </div>

                            {/* Información de Estado (si está rechazada) */}
                            {quoteData?.estado === 'Rechazada' && quoteData?.usuarioDecision && (
                                <div className="alert alert-danger border-0 shadow-sm">
                                    <h6 className="fw-bold mb-2">❌ Cotización Rechazada</h6>
                                    <small className="text-muted d-block">
                                        Rechazada por: <strong>{quoteData.usuarioDecision}</strong>
                                    </small>
                                </div>
                            )}

                            {quoteData?.estado === 'Aceptada' && quoteData?.usuarioDecision && (
                                <div className="alert alert-success border-0 shadow-sm">
                                    <h6 className="fw-bold mb-2">✅ Cotización Aceptada</h6>
                                    <small className="text-muted d-block">
                                        Aceptada por: <strong>{quoteData.usuarioDecision}</strong>
                                    </small>
                                </div>
                            )}
                            
                            {/* Grupo 2: Decisión (Ahora aparece justo abajo, no al final) */}
                            <div className="pt-3 border-top">
                                <h6 className="fw-bold mb-3 text-secondary">Decisión del Cliente</h6>
                                
                                <Button 
                                    variant="success" 
                                    onClick={() => handleDecision('Aceptada')} 
                                    className="w-100 mb-3 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                >
                                    <CheckCircle size={20}/> ACEPTAR Y ORDENAR
                                </Button>
                                
                                <Button 
                                    variant="outline-danger" 
                                    onClick={() => handleDecision('Rechazada')} 
                                    className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                                >
                                    <XCircle size={18}/> RECHAZAR
                                </Button>
                            </div>

                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>

        {quoteData && (
            <OrderFormModal 
                show={showOrderForm} 
                onHide={() => setShowOrderForm(false)}
                quotation={quoteData}
                onSuccess={() => {
                    api.patch(`/quotations/${quoteId}/status`, { status: 'Aceptada' });
                    onStatusChange();
                    setShowOrderForm(false);
                }}
            />
        )}
    </>
  );
};

export default QuoteDetailModal;