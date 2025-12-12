import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner, Badge, Row, Col, Card } from 'react-bootstrap';
import { Printer, Eye, FileCheck, FileText, ExternalLink } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import OrderPDF from './OrderPDF';

const OrderDetailModal = ({ show, onHide, orderId, onRefresh }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const componentRef = useRef(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: orderData ? `Orden-${orderData.numeroOrden}` : 'Documento',
  });

  useEffect(() => {
    if (show && orderId) {
      setLoading(true);
      
      const fetchData = async () => {
        try {
          // Primero obtenemos los datos básicos de la orden
          const resOrder = await api.get(`/orders/full/${orderId}`);
          const order = resOrder.data;
          
          // Obtenemos los detalles completos de la cotización (con productos)
          const resQuotation = await api.get(`/quotations/${order.CotizacionID}`);
          const quotationFull = resQuotation.data;
          
          // Combinar datos
          const items = (quotationFull.productos || quotationFull.items || []).map(prod => {
            let imagenURL = prod.imagenURL || prod.ImagenURL;
            if (!imagenURL) {
              const id = prod.ProductoID || prod.productoId;
              imagenURL = id ? `http://localhost:5000/api/products/image/${id}` : '/src/assets/no-image.png';
            }
            return {
              ...prod,
              imagenURL,
              ProductoID: prod.ProductoID || prod.productoId
            };
          });
          const formattedData = {
            numeroOrden: order.NumeroOrden,
            fechaOrden: order.FechaCreacion,
            NumeroCotizacion: quotationFull.NumeroCotizacion,
            NombreCliente: quotationFull.NombreCliente,
            FechaAprobacion: order.FechaCreacion,
            FechaEntrega: order.FechaEntrega,
            ElaboradoPor: order.UsuarioModificacion || quotationFull.NombreQuienCotiza || 'N/A',
            EjecutivoVenta: quotationFull.VendedorUsername || quotationFull.NombreQuienCotiza || 'N/A',
            ubicacionEntrega: order.UbicacionEntrega,
            observaciones: order.Observaciones,
            montoVenta: order.MontoVenta,
            totalPagado: order.TotalPagado,
            pagoPendiente: order.PagoPendiente,
            pagoAnticipo: order.PagoAnticipo,
            pagoComplemento: order.PagoComplemento,
            docAnticipoPDF: order.DocAnticipoPDF,
            docComplementoPDF: order.DocComplementoPDF,
            estadoOrden: order.EstadoNombre,
            estadoFactura: order.EstadoFacturaNombre || 'N/A',
            usuarioModificacion: order.UsuarioModificacion || 'No disponible',
            MetodoAnticipoNombre: order.MetodoAnticipoNombre,
            MetodoComplementoNombre: order.MetodoComplementoNombre,
            items,
            empresa: {
              EmpresaID: quotationFull.EmpresaID,
              Nombre: quotationFull.EmpresaNombre || quotationFull.Nombre,
              Direccion: quotationFull.EmpresaDireccion || quotationFull.Direccion,
              Telefono: quotationFull.EmpresaTelefono || quotationFull.Telefono,
              CorreoElectronico: quotationFull.EmpresaEmail || quotationFull.CorreoElectronico,
              PaginaWeb: quotationFull.EmpresaWeb || quotationFull.PaginaWeb,
              NIT: quotationFull.NIT,
              NRC: quotationFull.NRC
            }
          };
          
          setOrderData(formattedData);
          setLoading(false);
        } catch (err) {
          console.error('ERROR en fetchData:', err);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [show, orderId]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered contentClassName="border-0">
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title className="fw-bold">
          <Eye size={24} className="me-2" />
          Detalle de Orden de Pedido
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light p-0">
        {loading ? (
          <div className="p-5 text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Cargando información de la orden...</p>
          </div>
        ) : (
          <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '80vh' }}>
            
            {/* ZONA IZQUIERDA: VISTA PREVIA DEL PDF */}
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
                  <OrderPDF data={orderData} />
                </div>
              </div>
            </div>

            {/* ZONA DERECHA: INFORMACIÓN Y ACCIONES */}
            <div className="bg-white p-4 border-start shadow-sm d-flex flex-column gap-4" style={{ minWidth: '340px' }}>
              

              {/* Información de la Orden */}
              <div>
                <h5 className="fw-bold mb-3 text-secondary">
                  <span className="badge bg-inst-blue me-2">{orderData?.numeroOrden}</span>
                  Información
                </h5>
                
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="p-3">
                    <Row className="g-2 small">
                      <Col xs={12}>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="text-muted">Cliente:</span>
                          <strong className="text-end">{orderData?.cliente?.NombreCliente}</strong>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="text-muted">Fecha Orden:</span>
                          <strong>{orderData?.fechaOrden ? new Date(orderData.fechaOrden).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="text-muted">Fecha Entrega:</span>
                          <strong>{orderData?.FechaEntrega ? new Date(orderData.FechaEntrega).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="d-flex justify-content-between pb-2">
                          <span className="text-muted">Estado:</span>
                          <Badge bg="primary">{orderData?.estadoOrden || 'N/A'}</Badge>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Resumen Financiero */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-3">
                    <h6 className="fw-bold mb-3 small text-secondary">RESUMEN FINANCIERO</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small">Monto Total:</span>
                      <strong className="text-inst-blue">${parseFloat(orderData?.montoVenta || 0).toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small text-success">Total Pagado:</span>
                      <strong className="text-success">${parseFloat(orderData?.totalPagado || 0).toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top mb-3">
                      <span className="small fw-bold">Pendiente:</span>
                      <strong className="text-danger">${parseFloat(orderData?.pagoPendiente || 0).toFixed(2)}</strong>
                    </div>

                    {/* Comprobantes de Pago */}
                    {(orderData?.docAnticipoPDF || orderData?.docComplementoPDF) && (
                      <div className="mt-3 pt-3 border-top">
                        <h6 className="fw-bold mb-2 small text-secondary">
                          <FileCheck size={14} className="me-1" />
                          COMPROBANTES
                        </h6>
                        
                        {orderData?.docAnticipoPDF && (
                          <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                            <div className="d-flex align-items-center gap-2">
                              <FileText size={16} className="text-primary" />
                              <div>
                                <div className="small fw-bold">Anticipo</div>
                                <div className="small text-muted">
                                  ${parseFloat(orderData?.pagoAnticipo || 0).toFixed(2)}
                                  {orderData?.MetodoAnticipoNombre && (
                                    <span className="ms-2">| <span className="fw-semibold">{orderData.MetodoAnticipoNombre}</span></span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              onClick={() => window.open(`http://localhost:5000/uploads/orders/${orderData.docAnticipoPDF}`, '_blank')}
                              className="d-flex align-items-center gap-1"
                            >
                              <ExternalLink size={14} /> Ver
                            </Button>
                          </div>
                        )}
                        {orderData?.docComplementoPDF && (
                          <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                            <div className="d-flex align-items-center gap-2">
                              <FileText size={16} className="text-success" />
                              <div>
                                <div className="small fw-bold">Complemento</div>
                                <div className="small text-muted">
                                  ${parseFloat(orderData?.pagoComplemento || 0).toFixed(2)}
                                  {orderData?.MetodoComplementoNombre && (
                                    <span className="ms-2">| <span className="fw-semibold">{orderData.MetodoComplementoNombre}</span></span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline-success" 
                              onClick={() => window.open(`http://localhost:5000/uploads/orders/${orderData.docComplementoPDF}`, '_blank')}
                              className="d-flex align-items-center gap-1"
                            >
                              <ExternalLink size={14} /> Ver
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>

              {/* Botón de Impresión */}
              <div>
                <h5 className="fw-bold mb-3 text-secondary">Documento</h5>
                <Button 
                  variant="outline-dark" 
                  onClick={handlePrint} 
                  className="w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                >
                  <Printer size={20}/> 
                  <span className="fw-bold">Imprimir / Descargar PDF</span>
                </Button>
              </div>

              {/* Última Modificación */}
              {orderData?.usuarioModificacion && (
                <div className="alert alert-info border-0 shadow-sm">
                  <h6 className="fw-bold mb-2 small">📝 Última Modificación</h6>
                  <small className="text-muted d-block">
                    Editado por: <strong>{orderData.usuarioModificacion}</strong>
                  </small>
                </div>
              )}

            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default OrderDetailModal;
