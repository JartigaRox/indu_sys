import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, InputGroup, Form } from 'react-bootstrap';
import { Printer, Edit, Search, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import OrderPDF from '../componets/OrderPDF';
import EditOrderModal from '../componets/EditOrderModal';
import OrderDetailModal from '../componets/OrderDetailModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para impresión
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState(null);
  const printRef = useRef();

  // Estado para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Estado para modal de detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);


  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedOrderForPdf ? `Orden_${selectedOrderForPdf.NumeroCotizacion}` : 'Orden',
  });

  // 1. CARGAR ÓRDENES
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders'); 
      setOrders(res.data);
      setFilteredOrders(res.data);
    } catch (err) {
      console.error("Error cargando órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Buscador
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = orders.filter(o => 
      o.NumeroOrden?.toLowerCase().includes(term) ||
      o.NombreCliente?.toLowerCase().includes(term) ||
      o.NombreEmpresa?.toLowerCase().includes(term)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  // Preparar datos para imprimir (Carga detalles completos)
  const preparePrint = async (cotizacionId) => {
    try {
        // Primero, necesitamos obtener el OrdenID desde la cotización
        const ordersRes = await api.get('/orders');
        const order = ordersRes.data.find(o => o.CotizacionID === cotizacionId);
        
        if (!order) {
          console.error('No se encontró la orden para la cotización:', cotizacionId);
          return;
        }
        
        // Obtener datos completos de la orden
        const resOrder = await api.get(`/orders/full/${order.OrdenID}`);
        const orderData = resOrder.data;
        
        // Obtener datos de la cotización
        const resCotizacion = await api.get(`/orders/${cotizacionId}`);
        const cotizacion = resCotizacion.data;
        
        // Obtener datos completos de la cotización para vendedor
        const resQuotationFull = await api.get(`/quotations/${cotizacionId}`);
        const quotationFull = resQuotationFull.data;
        
        // Combinar todos los datos
        const fullData = {
          NumeroCotizacion: cotizacion.NumeroCotizacion,
          NombreCliente: cotizacion.NombreCliente,
          FechaEntrega: orderData.FechaEntrega || quotationFull.FechaEntregaEstimada,
          ElaboradoPor: orderData.UsuarioModificacion || quotationFull.NombreQuienCotiza || 'N/A',
          EjecutivoVenta: quotationFull.VendedorUsername || quotationFull.NombreQuienCotiza || 'N/A',
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
        
        setSelectedOrderForPdf(fullData);
        setTimeout(() => handlePrint(), 200);
    } catch (error) {
        console.error('Error en preparePrint:', error);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="text-inst-blue fw-bold mb-4">Gestión de Órdenes</h2>

      {/* Buscador */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2">
          <InputGroup size="sm">
            <InputGroup.Text className="bg-white border-end-0"><Search size={16}/></InputGroup.Text>
            <Form.Control 
              placeholder="Buscar por cliente o referencia..." 
              className="border-start-0"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Tabla de Órdenes */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? <div className="p-5 text-center"><Spinner animation="border"/></div> : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light small text-secondary">
                <tr>
                  <th className="ps-4">Ref</th>
                  <th>Cliente</th>
                  <th>Entrega</th>
                  <th>Estado</th>
                  <th>Pagos</th>
                  <th className="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  // Calcular contraste del texto basado en el color de fondo
                  const getTextColor = (hexColor) => {
                    if (!hexColor) return '#000';
                    const hex = hexColor.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    return brightness > 128 ? '#000' : '#fff';
                  };

                  const textColor = getTextColor(order.ColorHex);
                  const bgColor = order.ColorHex || '#ffffff';

                  return (
                    <tr 
                      key={order.OrdenID} 
                      style={{ 
                        backgroundColor: bgColor,
                        color: textColor
                      }}
                    >
                      <td className="ps-4 fw-bold" style={{ backgroundColor: bgColor, color: textColor }}>
                          {order.NumeroOrden}
                          <div className="small fw-normal" style={{ opacity: 0.8 }}>{order.ElaboradoPor}</div>
                      </td>
                      <td style={{ backgroundColor: bgColor, color: textColor }}>{order.NombreCliente}</td>
                      <td style={{ backgroundColor: bgColor, color: textColor }}>
                        {order.FechaEntrega ? new Date(order.FechaEntrega).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ backgroundColor: bgColor }}>
                          <Badge 
                            style={{ 
                              backgroundColor: bgColor,
                              color: textColor,
                              border: `1px solid ${textColor}`
                            }}
                            className="fw-normal"
                          >
                              {order.EstadoNombre || 'Sin Estado'}
                          </Badge>
                      </td>
                      <td className="small" style={{ backgroundColor: bgColor }}>
                          <div className="fw-bold" style={{ color: textColor === '#fff' ? '#90EE90' : '#198754' }}>
                            Pagado: ${order.TotalPagado?.toFixed(2)}
                          </div>
                          <div style={{ color: textColor === '#fff' ? '#FFB6C1' : '#dc3545' }}>
                            Pendiente: ${order.PagoPendiente?.toFixed(2)}
                          </div>
                      </td>
                      <td className="text-end pe-4" style={{ backgroundColor: bgColor }}>
                          <div className="d-flex justify-content-end gap-2">
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="border shadow-sm" 
                                title="Ver Detalle"
                                onClick={() => {
                                  setSelectedOrderId(order.OrdenID);
                                  setShowDetailModal(true);
                                }}
                              >
                                  <Eye size={16} />
                              </Button>
                              <Button variant="light" size="sm" className="border shadow-sm" title="Imprimir" onClick={() => preparePrint(order.CotizacionID)}>
                                  <Printer size={16} />
                              </Button>
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="border shadow-sm" 
                                title="Editar"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowEditModal(true);
                                }}
                              >
                                  <Edit size={16} />
                              </Button>
                          </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-5 text-muted">No hay órdenes registradas.</td></tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* PDF Oculto */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
            <OrderPDF data={selectedOrderForPdf} />
        </div>
      </div>

      {/* Modal de Edición */}
      <EditOrderModal 
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        order={selectedOrder}
        onSuccess={() => {
          fetchOrders();
          setShowEditModal(false);
        }}
      />

      {/* Modal de Detalle */}
      <OrderDetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        orderId={selectedOrderId}
        onRefresh={() => fetchOrders()}
      />

    </Container>
  );
};

export default Orders;