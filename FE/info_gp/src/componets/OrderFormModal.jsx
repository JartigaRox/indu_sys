import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup, Card, Badge } from 'react-bootstrap';
import { Calendar, DollarSign, FileText, User, MapPin, Upload } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const OrderFormModal = ({ show, onHide, quotation, onSuccess }) => {
  // Estados para listas desplegables
  const [opciones, setOpciones] = useState({
    paymentMethods: [],
    invoiceStatuses: [],
    orderStatuses: []
  });

  // Datos del formulario
  const [form, setForm] = useState({
    fechaEntrega: '',
    ubicacionEntrega: '',
    observaciones: '',
    pagoAnticipo: 0,
    metodoAnticipoId: '',
    pagoComplemento: 0,
    metodoComplementoId: '',
    estadoFacturaId: '',
    estadoOrdenId: ''
  });

  // Archivos
  const [docAnticipo, setDocAnticipo] = useState(null);
  const [docComplemento, setDocComplemento] = useState(null);

  // Cálculos
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [resumen, setResumen] = useState({ total: 0, pagado: 0, pendiente: 0 });

  // 1. Cargar opciones del backend (Métodos de pago, Estados)
  useEffect(() => {
    if (show) {
      api.get('/orders/options')
        .then(res => {
          setOpciones(res.data);
        })
        .catch(err => {
          Swal.fire('Error', 'No se pudieron cargar las opciones del formulario', 'error');
        });
    }
  }, [show]);

  // 2. Calcular montos y días
  useEffect(() => {
    if (quotation) {
        // Calcular Total de la Cotización
        const total = quotation.items.reduce((sum, i) => sum + (Number(i.cantidad) * Number(i.precio)), 0);
        
        const anticipo = parseFloat(form.pagoAnticipo) || 0;
        const complemento = parseFloat(form.pagoComplemento) || 0;
        const pagado = anticipo + complemento;

        setResumen({ total, pagado, pendiente: total - pagado });

        // Calcular Días Restantes
        if (form.fechaEntrega) {
            const entrega = new Date(form.fechaEntrega);
            const hoy = new Date();
            const diff = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
            setDiasRestantes(diff);
        } else {
            setDiasRestantes(null);
        }
    }
  }, [form, quotation]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.fechaEntrega || !form.estadoOrdenId) {
        return Swal.fire('Faltan datos', 'La fecha de entrega y el estado son obligatorios', 'warning');
    }

    const formData = new FormData();
    formData.append('cotizacionId', quotation.CotizacionID); // ID de la cotización
    formData.append('montoVenta', resumen.total.toFixed(2));
    
    // Agregar campos del form
    Object.keys(form).forEach(key => formData.append(key, form[key]));

    // Agregar archivos
    if (docAnticipo) formData.append('docAnticipo', docAnticipo);
    if (docComplemento) formData.append('docComplemento', docComplemento);

    try {
        await api.post('/orders', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        Swal.fire('¡Listo!', 'La orden ha sido creada y la cotización aceptada.', 'success');
        onSuccess(); // Cerrar todo y recargar tabla
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo guardar la orden', 'error');
    }
  };

  // Helper para mostrar resumen de productos
  const productosTexto = quotation?.items?.map(i => i.nombre).join(', ') || '';

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static">
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title className="fw-bold">Generar Orden de Pedido</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light">
        <Form>
            
            {/* 1. INFORMACIÓN DE VENTA (Solo Lectura) */}
            <Card className="mb-3 shadow-sm border-0">
                <Card.Body>
                    <h6 className="fw-bold text-secondary border-bottom pb-2">Resumen</h6>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Label className="small fw-bold">MONTO VENTA</Form.Label>
                            <Form.Control value={`$${resumen.total.toFixed(2)}`} disabled className="fw-bold text-success bg-white" />
                        </Col>
                        <Col md={9}>
                            <Form.Label className="small fw-bold">PRODUCTOS</Form.Label>
                            <Form.Control value={productosTexto} disabled className="bg-white" />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* 2. LOGÍSTICA */}
            <Card className="mb-3 shadow-sm border-0">
                <Card.Body>
                    <h6 className="fw-bold text-secondary border-bottom pb-2">Logística</h6>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Label className="small fw-bold">FECHA ENTREGA</Form.Label>
                            <Form.Control type="date" name="fechaEntrega" onChange={handleChange} />
                        </Col>
                        <Col md={2} className="pt-4">
                            {diasRestantes !== null && (
                                <Badge bg={diasRestantes < 0 ? 'danger' : 'success'} className="w-100 p-2">
                                    {diasRestantes < 0 ? `Atrasado` : `${diasRestantes} días restantes`}
                                </Badge>
                            )}
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">UBICACIÓN ENTREGA</Form.Label>
                            <Form.Control name="ubicacionEntrega" placeholder="Dirección..." onChange={handleChange} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* 3. PAGOS */}
            <Card className="mb-3 shadow-sm border-0">
                <Card.Body>
                    <h6 className="fw-bold text-secondary border-bottom pb-2">Pagos</h6>
                    
                    {/* Anticipo */}
                    <Row className="mb-2">
                        <Col md={3}>
                            <Form.Label className="small">Anticipo ($)</Form.Label>
                            <Form.Control type="number" name="pagoAnticipo" onChange={handleChange} />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small">Método</Form.Label>
                            <Form.Select name="metodoAnticipoId" onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {opciones.paymentMethods.map(m => <option key={m.MetodoID} value={m.MetodoID}>{m.Nombre}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small">Comprobante (PDF)</Form.Label>
                            <Form.Control type="file" accept="application/pdf" onChange={e => setDocAnticipo(e.target.files[0])} />
                        </Col>
                    </Row>

                    {/* Complemento */}
                    <Row>
                        <Col md={3}>
                            <Form.Label className="small">Complemento ($)</Form.Label>
                            <Form.Control type="number" name="pagoComplemento" onChange={handleChange} />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small">Método</Form.Label>
                            <Form.Select name="metodoComplementoId" onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {opciones.paymentMethods.map(m => <option key={m.MetodoID} value={m.MetodoID}>{m.Nombre}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small">Comprobante (PDF)</Form.Label>
                            <Form.Control type="file" accept="application/pdf" onChange={e => setDocComplemento(e.target.files[0])} />
                        </Col>
                    </Row>

                    <div className="mt-3 text-center p-2 bg-light rounded">
                        <span className="me-4 text-success fw-bold">Pagado: ${resumen.pagado.toFixed(2)}</span>
                        <span className="text-danger fw-bold">Pendiente: ${resumen.pendiente.toFixed(2)}</span>
                    </div>
                </Card.Body>
            </Card>

            {/* 4. ESTADOS */}
            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">ESTADO ORDEN (Color)</Form.Label>
                            <Form.Select 
                                name="estadoOrdenId" 
                                onChange={handleChange}
                                style={{ backgroundColor: opciones.orderStatuses.find(s => String(s.EstadoOrdenID) === String(form.estadoOrdenId))?.ColorHex || 'white' }}
                            >
                                <option value="" style={{background: 'white'}}>Seleccione Estado</option>
                                {opciones.orderStatuses.map(s => (
                                    <option key={s.EstadoOrdenID} value={s.EstadoOrdenID} style={{backgroundColor: s.ColorHex}}>
                                        {s.Nombre}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">ESTADO FACTURA</Form.Label>
                            <Form.Select name="estadoFacturaId" onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {opciones.invoiceStatuses.map(s => <option key={s.EstadoFacturaID} value={s.EstadoFacturaID}>{s.Nombre}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={12} className="mt-3">
                            <Form.Label className="small fw-bold">Observaciones</Form.Label>
                            <Form.Control as="textarea" rows={2} name="observaciones" onChange={handleChange} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        <Button variant="primary" onClick={handleSubmit}>Guardar y Finalizar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderFormModal;