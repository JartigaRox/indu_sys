import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, Alert, Modal, Form, InputGroup } from 'react-bootstrap';
import { FileText, Eye, Printer, X, Search } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import OrderPDF from '../componets/OrderPDF'; // Asegúrate de tener este componente

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const componentRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = orders.filter(o => 
      o.NumeroCotizacion?.toLowerCase().includes(term) ||
      o.NombreCliente?.toLowerCase().includes(term) ||
      o.NombreEmpresa?.toLowerCase().includes(term)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleOpenOrder = async (id) => {
    setShowModal(true);
    setLoadingDetail(true);
    try {
        const res = await api.get(`/orders/${id}`);
        const data = res.data;
        
        const formattedData = {
            cliente: {
                NombreCliente: data.NombreCliente,
                DireccionCalle: data.DireccionCalle,
                Municipio: data.Municipio,
                Departamento: data.Departamento,
                TelefonoCliente: data.TelefonoCliente,
                AtencionA: data.AtencionA
            },
            items: data.items.map(i => ({
                cantidad: i.Cantidad,
                nombre: i.NombreProducto,
                codigo: i.CodigoProducto,
                productoId: i.ProductoID,
                descripcion: i.Descripcion
            })),
            numeroCotizacion: data.NumeroCotizacion,
            fecha: data.FechaRealizacion,
            empresa: {
                EmpresaID: data.EmpresaID, // Necesario para el logo
                Nombre: data.EmpresaNombre,
                Direccion: data.EmpresaDireccion,
                NRC: data.NRC,
                Telefono: data.EmpresaTelefono,
                CorreoElectronico: data.EmpresaEmail,
                PaginaWeb: data.EmpresaWeb
            }
        };
        setSelectedOrder(formattedData);
    } catch (error) {
        console.error(error);
        alert("Error al cargar el detalle de la orden");
        setShowModal(false);
    } finally {
        setLoadingDetail(false);
    }
  };

  const handlePrint = () => {
    const element = componentRef.current;
    const opt = {
      margin: 0,
      filename: `Orden-${selectedOrder?.numeroCotizacion || 'Doc'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <Container className="py-4">
      <h2 className="text-inst-blue fw-bold mb-4">Órdenes de Pedido</h2>

      {/* Buscador */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-3">
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por referencia, cliente o empresa..."
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
              Mostrando {filteredOrders.length} de {orders.length} órdenes
            </small>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? <div className="p-5 text-center"><Spinner animation="border"/></div> : (
            <>
              {searchTerm && filteredOrders.length === 0 && (
                <div className="text-center p-5 text-muted">
                  No se encontraron órdenes que coincidan con la búsqueda
                </div>
              )}
              {filteredOrders.length > 0 && (
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="bg-dark text-white small">
                    <tr>
                      <th className="ps-4">Referencia</th>
                      <th>Cliente</th>
                      <th>Fecha Aprobación</th>
                      <th>Empresa</th>
                      <th className="text-end pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                  <tr key={o.CotizacionID}>
                    <td className="ps-4 fw-bold">{o.NumeroCotizacion}</td>
                    <td>{o.NombreCliente}</td>
                    <td>{new Date(o.FechaRealizacion).toLocaleDateString()}</td>
                    <td><Badge bg="light" text="dark" className="border">{o.NombreEmpresa}</Badge></td>
                    <td className="text-end pe-4">
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenOrder(o.CotizacionID)}>
                            <Eye size={18} /> Ver Orden
                        </Button>
                    </td>
                  </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="5" className="text-center py-4">No hay órdenes pendientes.</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* MODAL DE VISTA PREVIA Y DESCARGA */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
            <Modal.Title>Detalle de Orden</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-0">
            {loadingDetail ? <div className="p-5 text-center"><Spinner animation="border"/></div> : (
                <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '70vh' }}>
                    
                    {/* VISOR PDF */}
                    <div className="flex-grow-1 p-4 bg-secondary bg-opacity-25 text-center overflow-auto">
                        <div className="d-inline-block shadow bg-white text-start" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                            <div ref={componentRef}>
                                <OrderPDF data={selectedOrder} />
                            </div>
                        </div>
                    </div>

                    {/* BOTONES */}
                    <div className="bg-white p-4 border-start" style={{ minWidth: '250px' }}>
                        <Button variant="dark" className="w-100 mb-3 py-2" onClick={handlePrint}>
                            <Printer className="me-2"/> Descargar PDF
                        </Button>
                        <Button variant="outline-secondary" className="w-100" onClick={() => setShowModal(false)}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Orders;