import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Alert } from 'react-bootstrap';
import { Upload, FileText } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const EditOrderModal = ({ show, onHide, order, onSuccess }) => {
  const [opciones, setOpciones] = useState({
    paymentMethods: [],
    invoiceStatuses: [],
    orderStatuses: []
  });

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

  const [fileAnticipo, setFileAnticipo] = useState(null);
  const [fileComplemento, setFileComplemento] = useState(null);

  // --- FUNCIÓN HELPER PARA FORMATEAR MONEDA ---
  const formatMoney = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Cargar opciones
  useEffect(() => {
    if (show) {
      api.get('/orders/options')
        .then(res => setOpciones(res.data))
        .catch(() => Swal.fire('Error', 'No se pudieron cargar las opciones', 'error'));
    }
  }, [show]);

  const [ordenCompleta, setOrdenCompleta] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Cargar datos completos de la orden desde el backend
  useEffect(() => {
    if (show && order?.OrdenID) {
      setLoadingOrder(true);
      api.get(`/orders/full/${order.OrdenID}`)
        .then(res => {
          const data = res.data;
          setOrdenCompleta(data);
          setForm({
            fechaEntrega: data.FechaEntrega ? data.FechaEntrega.split('T')[0] : '',
            ubicacionEntrega: data.UbicacionEntrega || '',
            observaciones: data.Observaciones || '',
            pagoAnticipo: data.PagoAnticipo || 0,
            metodoAnticipoId: data.MetodoAnticipoID || '',
            pagoComplemento: data.PagoComplemento || 0,
            metodoComplementoId: data.MetodoComplementoID || '',
            estadoFacturaId: data.EstadoFacturaID || '',
            estadoOrdenId: data.EstadoOrdenID || ''
          });
          setLoadingOrder(false);
        })
        .catch(() => {
          Swal.fire('Error', 'No se pudieron cargar los datos de la orden', 'error');
          setLoadingOrder(false);
        });
    }
  }, [show, order]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.estadoOrdenId) {
      return Swal.fire('Atención', 'Debes seleccionar un estado de orden', 'warning');
    }

    try {
      const formData = new FormData();
      
      // Agregar datos del formulario (solo si tienen valor)
      Object.keys(form).forEach(key => {
        const value = form[key];
        // Si el valor está vacío ('') o es undefined, enviar null para campos opcionales
        if (key === 'metodoAnticipoId' || key === 'metodoComplementoId' || key === 'estadoFacturaId') {
          formData.append(key, value || '');
        } else if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        } else if (key === 'fechaEntrega' || key === 'ubicacionEntrega' || key === 'observaciones') {
          formData.append(key, value || '');
        }
      });
      
      // Agregar archivos si existen
      if (fileAnticipo) {
        formData.append('docAnticipo', fileAnticipo);
      }
      if (fileComplemento) {
        formData.append('docComplemento', fileComplemento);
      }

      await api.put(`/orders/${order.OrdenID}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      Swal.fire('¡Actualizado!', 'La orden se actualizó correctamente', 'success');
      onSuccess();
      onHide();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar la orden', 'error');
    }
  };

  const totalPagado = parseFloat(form.pagoAnticipo || 0) + parseFloat(form.pagoComplemento || 0);
  const montoVenta = ordenCompleta?.MontoVenta || order?.MontoVenta || 0;
  const pendiente = montoVenta - totalPagado;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title>Editar Orden - {order?.NumeroOrden}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light">
        {loadingOrder ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2">Cargando datos de la orden...</p>
          </div>
        ) : (
        <Form>
          
          {/* Logística */}
          <Card className="mb-3 shadow-sm border-0">
            <Card.Body>
              <h6 className="fw-bold text-secondary border-bottom pb-2">Logística</h6>
              <Row>
                <Col md={6}>
                  <Form.Label className="small fw-bold">FECHA ENTREGA</Form.Label>
                  <Form.Control type="date" name="fechaEntrega" value={form.fechaEntrega} onChange={handleChange} />
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-bold">UBICACIÓN ENTREGA</Form.Label>
                  <Form.Control name="ubicacionEntrega" value={form.ubicacionEntrega} placeholder="Dirección..." onChange={handleChange} />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Pagos */}
          <Card className="mb-3 shadow-sm border-0">
            <Card.Body>
              <h6 className="fw-bold text-secondary border-bottom pb-2">Pagos</h6>
              
              <Row className="mb-2">
                <Col md={6}>
                  <Form.Label className="small">Anticipo ($)</Form.Label>
                  <Form.Control type="number" name="pagoAnticipo" value={form.pagoAnticipo} onChange={handleChange} />
                </Col>
                <Col md={6}>
                  <Form.Label className="small">Método Anticipo</Form.Label>
                  <Form.Select name="metodoAnticipoId" value={form.metodoAnticipoId} onChange={handleChange}>
                    <option value="">Seleccione</option>
                    {opciones.paymentMethods.map(m => <option key={m.MetodoID} value={m.MetodoID}>{m.Nombre}</option>)}
                  </Form.Select>
                </Col>
              </Row>

              {/* Comprobante Anticipo */}
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Label className="small fw-bold text-primary">
                    <Upload size={14} className="me-1" />
                    Comprobante de Anticipo (PDF)
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setFileAnticipo(e.target.files[0])}
                    size="sm"
                  />
                  {fileAnticipo && (
                    <Alert variant="success" className="mt-2 py-1 px-2 small d-flex align-items-center gap-2">
                      <FileText size={14} />
                      <span>{fileAnticipo.name}</span>
                    </Alert>
                  )}
                  {ordenCompleta?.DocAnticipoPDF && !fileAnticipo && (
                    <Alert variant="info" className="mt-2 py-1 px-2 small">
                      Ya existe: {ordenCompleta.DocAnticipoPDF}
                    </Alert>
                  )}
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Label className="small">Complemento ($)</Form.Label>
                  <Form.Control type="number" name="pagoComplemento" value={form.pagoComplemento} onChange={handleChange} />
                </Col>
                <Col md={6}>
                  <Form.Label className="small">Método Complemento</Form.Label>
                  <Form.Select name="metodoComplementoId" value={form.metodoComplementoId} onChange={handleChange}>
                    <option value="">Seleccione</option>
                    {opciones.paymentMethods.map(m => <option key={m.MetodoID} value={m.MetodoID}>{m.Nombre}</option>)}
                  </Form.Select>
                </Col>
              </Row>

              {/* Comprobante Complemento */}
              <Row className="mb-3 mt-2">
                <Col md={12}>
                  <Form.Label className="small fw-bold text-success">
                    <Upload size={14} className="me-1" />
                    Comprobante de Complemento (PDF)
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setFileComplemento(e.target.files[0])}
                    size="sm"
                  />
                  {fileComplemento && (
                    <Alert variant="success" className="mt-2 py-1 px-2 small d-flex align-items-center gap-2">
                      <FileText size={14} />
                      <span>{fileComplemento.name}</span>
                    </Alert>
                  )}
                  {ordenCompleta?.DocComplementoPDF && !fileComplemento && (
                    <Alert variant="info" className="mt-2 py-1 px-2 small">
                      Ya existe: {ordenCompleta.DocComplementoPDF}
                    </Alert>
                  )}
                </Col>
              </Row>

              <div className="mt-3 text-center p-2 bg-light rounded">
                {/* AQUI APLICAMOS EL FORMATO */}
                <span className="me-4 text-success fw-bold">Pagado: ${formatMoney(totalPagado)}</span>
                <span className="text-danger fw-bold">Pendiente: ${formatMoney(pendiente)}</span>
              </div>
            </Card.Body>
          </Card>

          {/* Estados */}
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Label className="small fw-bold">ESTADO ORDEN</Form.Label>
                  <Form.Select 
                    name="estadoOrdenId" 
                    value={form.estadoOrdenId}
                    onChange={handleChange}
                    style={{ 
                      backgroundColor: opciones.orderStatuses.find(s => String(s.EstadoOrdenID) === String(form.estadoOrdenId))?.ColorHex || 'white'
                    }}
                  >
                    <option value="">Seleccione Estado</option>
                    {opciones.orderStatuses.map(s => (
                      <option key={s.EstadoOrdenID} value={s.EstadoOrdenID} style={{backgroundColor: s.ColorHex}}>
                        {s.Nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-bold">ESTADO FACTURA</Form.Label>
                  <Form.Select name="estadoFacturaId" value={form.estadoFacturaId} onChange={handleChange}>
                    <option value="">Seleccione</option>
                    {opciones.invoiceStatuses.map(s => <option key={s.EstadoFacturaID} value={s.EstadoFacturaID}>{s.Nombre}</option>)}
                  </Form.Select>
                </Col>
                <Col md={12} className="mt-3">
                  <Form.Label className="small fw-bold">Observaciones</Form.Label>
                  <Form.Control as="textarea" rows={2} name="observaciones" value={form.observaciones} onChange={handleChange} />
                </Col>
              </Row>
            </Card.Body>
          </Card>

        </Form>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        <Button variant="primary" onClick={handleSubmit}>Guardar Cambios</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditOrderModal;