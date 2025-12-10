import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner, Badge, Row, Col, Card } from 'react-bootstrap';
import { Printer, Eye } from 'lucide-react';
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
          
          // Luego obtenemos los detalles de la cotización asociada
          const resCotizacion = await api.get(`/orders/${order.CotizacionID}`);
          const cotizacion = resCotizacion.data;
          
          // Obtener datos completos de la cotización para ElaboradoPor y EjecutivoVenta
          const resQuotationFull = await api.get(`/quotations/${order.CotizacionID}`);
          const quotationFull = resQuotationFull.data;
          
          // Combinar datos
          const formattedData = {
            numeroOrden: order.NumeroOrden,
            fechaOrden: order.FechaCreacion,
            NumeroCotizacion: cotizacion.NumeroCotizacion,
            NombreCliente: cotizacion.NombreCliente,
            FechaAprobacion: order.FechaCreacion,
            FechaEntrega: order.FechaEntrega || quotationFull.FechaEntregaEstimada,
            ElaboradoPor: order.UsuarioModificacion || quotationFull.NombreQuienCotiza || 'N/A',
            EjecutivoVenta: quotationFull.VendedorUsername || quotationFull.NombreQuienCotiza || 'N/A',
            ubicacionEntrega: order.UbicacionEntrega,
            observaciones: order.Observaciones,
            montoVenta: order.MontoVenta,
            totalPagado: order.TotalPagado,
            pagoPendiente: order.PagoPendiente,
            estadoOrden: order.EstadoNombre,
            estadoFactura: order.EstadoFacturaNombre || 'N/A',
            usuarioModificacion: order.UsuarioModificacion || 'No disponible',
            items: cotizacion.items || [],
            empresa: {
              EmpresaID: cotizacion.EmpresaID,
              Nombre: cotizacion.EmpresaNombre,
              Direccion: cotizacion.EmpresaDireccion,
              Telefono: cotizacion.EmpresaTelefono,
              CorreoElectronico: cotizacion.EmpresaEmail,
              PaginaWeb: cotizacion.EmpresaWeb,
              NIT: cotizacion.NIT,
              NRC: cotizacion.NRC
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
                    <div className="d-flex justify-content-between pt-2 border-top">
                      <span className="small fw-bold">Pendiente:</span>
                      <strong className="text-danger">${parseFloat(orderData?.pagoPendiente || 0).toFixed(2)}</strong>
                    </div>
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
