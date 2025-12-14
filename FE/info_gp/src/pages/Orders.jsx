import { useEffect, useState, useRef, useMemo } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, InputGroup, Form, Dropdown } from 'react-bootstrap';
import { Printer, Edit, Search, Eye, Calendar, Filter } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import OrderPDF from '../componets/OrderPDF';
import EditOrderModal from '../componets/EditOrderModal';
import OrderDetailModal from '../componets/OrderDetailModal';
import OrderCalendarModal from '../componets/OrderCalendarModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Estado para impresión
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState(null);
  const printRef = useRef();

  // Estado para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Estado para modal de detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Estado para calendario
  const [showCalendar, setShowCalendar] = useState(false);

  // --- NUEVO: Función para formatear moneda con separadores de miles ---
  const formatMoney = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Función para calcular días restantes
  const calcularDiasRestantes = (fechaEntrega) => {
    if (!fechaEntrega) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const entrega = new Date(fechaEntrega);
    entrega.setHours(0, 0, 0, 0);
    const diffTime = entrega - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };


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

  // Buscador y filtro con useMemo para evitar cambios en el array de dependencias
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let filtered = orders.filter(o => 
      o.NumeroOrden?.toLowerCase().includes(term) ||
      o.NombreCliente?.toLowerCase().includes(term) ||
      o.NombreEmpresa?.toLowerCase().includes(term) ||
      o.DireccionCalle?.toLowerCase().includes(term) ||
      o.UbicacionEntrega?.toLowerCase().includes(term)
    );

    // Aplicar filtro de estado
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(o => o.EstadoNombre === filterStatus);
    }

    // --- LÓGICA DE ORDENAMIENTO MEJORADA ---
    filtered.sort((a, b) => {
      const aEsFinalizado = a.EstadoNombre === 'Pagado y finalizado';
      const bEsFinalizado = b.EstadoNombre === 'Pagado y finalizado';
      
      // 1. Primero separamos los finalizados (se van al fondo)
      if (aEsFinalizado && !bEsFinalizado) return 1;
      if (!aEsFinalizado && bEsFinalizado) return -1;
      
      // 2. Si ambos son activos (no finalizados), ordenar por Fecha de Entrega (Ascendente)
      // "Menos días restantes" significa fecha más antigua o próxima.
      if (!aEsFinalizado && !bEsFinalizado) {
        // Manejar casos donde no hay fecha de entrega (ponerlos al final de los activos)
        if (!a.FechaEntrega && b.FechaEntrega) return 1;
        if (a.FechaEntrega && !b.FechaEntrega) return -1;
        if (a.FechaEntrega && b.FechaEntrega) {
            return new Date(a.FechaEntrega) - new Date(b.FechaEntrega);
        }
        // Si ninguno tiene fecha, ordenar por creación
        return new Date(b.FechaCreacion) - new Date(a.FechaCreacion);
      }
      
      // 3. Si ambos son finalizados, ordenar por fecha de creación (más reciente primero) para mantener historial ordenado
      return new Date(b.FechaCreacion) - new Date(a.FechaCreacion);
    });

    setFilteredOrders(filtered);
  }, [searchTerm, filterStatus, orders]);

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
          numeroOrden: orderData.NumeroOrden,
          NumeroCotizacion: cotizacion.NumeroCotizacion,
          NombreCliente: cotizacion.NombreCliente,
          FechaEntrega: orderData.FechaEntrega,
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-inst-blue fw-bold mb-0">Gestión de Órdenes</h2>
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2"
          onClick={() => setShowCalendar(true)}
        >
          <Calendar size={18} />
          Visualizar Calendario
        </Button>
      </div>

      {/* Buscador y Filtro */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2">
          <div className="d-flex gap-2">
            <InputGroup size="sm" style={{flex: 1}}>
              <InputGroup.Text className="bg-white border-end-0"><Search size={16}/></InputGroup.Text>
              <Form.Control 
                placeholder="Buscar por cliente, referencia o dirección..." 
                className="border-start-0"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1">
                <Filter size={16} />
                {filterStatus === 'all' ? 'Todos' : filterStatus}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFilterStatus('all')}>Todos</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => setFilterStatus('Pagado y finalizado')} className="d-flex align-items-center gap-2">
                  <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#ffffff', border: '1px solid #ccc', display: 'inline-block'}}></span>
                  Pagado y finalizado
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('Pago anticipo y pendiente de entrega')} className="d-flex align-items-center gap-2">
                  <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#dc3545', display: 'inline-block'}}></span>
                  Pago anticipo y pendiente de entrega
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('Entregado y pendiente de pago')} className="d-flex align-items-center gap-2">
                  <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#007bff', display: 'inline-block'}}></span>
                  Entregado y pendiente de pago
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('Pendiente de entrega')} className="d-flex align-items-center gap-2">
                  <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#28a745', display: 'inline-block'}}></span>
                  Pendiente de entrega
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('Pagado y pendiente de entrega')} className="d-flex align-items-center gap-2">
                  <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#fefe71ff', display: 'inline-block'}}></span>
                  Pagado y pendiente de entrega
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
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
                  <th>Ejecutivo</th>
                  <th>Dirección</th>
                  <th>Entrega</th>
                  <th>Días Rest.</th>
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
                  const diasRestantes = calcularDiasRestantes(order.FechaEntrega);

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
                      <td className="small" style={{ backgroundColor: bgColor, color: textColor }}>
                        {order.EjecutivoVenta || 'N/A'}
                      </td>
                      <td className="small" style={{ backgroundColor: bgColor, color: textColor }}>
                        {order.UbicacionEntrega || order.DireccionCalle || 'N/A'}
                      </td>
                      <td style={{ backgroundColor: bgColor, color: textColor }}>
                        {order.FechaEntrega ? new Date(order.FechaEntrega).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ backgroundColor: bgColor, color: textColor }}>
                        {diasRestantes !== null ? (
                          <Badge bg={diasRestantes < 0 ? 'danger' : diasRestantes <= 3 ? 'warning' : 'success'}>
                            {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrasado` : diasRestantes === 0 ? 'Hoy' : `${diasRestantes} dias`}
                          </Badge>
                        ) : 'N/A'}
                      </td>
                      <td style={{ backgroundColor: bgColor }}>
                          <Badge 
                            style={{ 
                              backgroundColor: bgColor,
                              color: '#ffffff',
                              border: `1px solid rgba(255,255,255,0.3)`,
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}
                            className="fw-normal"
                          >
                              {order.EstadoNombre || 'Sin Estado'}
                          </Badge>
                      </td>
                      <td className="small" style={{ backgroundColor: bgColor }}>
                          <div className="fw-bold" style={{ color: textColor === '#fff' ? '#90EE90' : '#198754' }}>
                            Pagado: ${formatMoney(order.TotalPagado)}
                          </div>
                          <div style={{ color: textColor === '#fff' ? '#FFB6C1' : '#dc3545' }}>
                            Pendiente: ${formatMoney(order.PagoPendiente)}
                          </div>
                          <div className="mt-1">
                            <span className="fw-semibold">Forma de pago anticipo: </span>
                            <span>{order.MetodoAnticipoNombre || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="fw-semibold">Forma de pago complemento: </span>
                            <span>{order.MetodoComplementoNombre || 'N/A'}</span>
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

      {/* Modal de Calendario */}
      <OrderCalendarModal
        show={showCalendar}
        onHide={() => setShowCalendar(false)}
        orders={orders}
      />

    </Container>
  );
};

export default Orders;