import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Save, MapPin } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const EditClientModal = ({ show, onHide, client, onSuccess }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    atencionA: '',
    telefono: '',
    email: '',
    direccion: '',
    distritoId: ''
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMun, setSelectedMun] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // Cargar datos completos del cliente cuando se abre el modal
  useEffect(() => {
    if (show && client?.ClienteID) {
      const loadClientData = async () => {
        setLoadingData(true);
        try {
          // A. Cargar Departamentos base
          const resDepts = await api.get('/locations/departamentos');
          setDepartamentos(resDepts.data);

          // B. Cargar Datos del Cliente
          const resClient = await api.get(`/clients/${client.ClienteID}`);
          const clientData = resClient.data;

          // C. Llenar formulario base
          setFormData({
            codigo: clientData.codigo,
            nombre: clientData.nombre,
            atencionA: clientData.atencionA,
            telefono: clientData.telefono,
            email: clientData.email,
            direccion: clientData.direccion,
            distritoId: clientData.distritoId
          });

          // D. Cargar cascada de ubicaciones
          if (clientData.DepartamentoID) {
            setSelectedDept(clientData.DepartamentoID);
            const resMun = await api.get(`/locations/municipios/${clientData.DepartamentoID}`);
            setMunicipios(resMun.data);

            if (clientData.MunicipioID) {
              setSelectedMun(clientData.MunicipioID);
              const resDist = await api.get(`/locations/distritos/${clientData.MunicipioID}`);
              setDistritos(resDist.data);
            }
          }
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'No se pudo cargar la información del cliente', 'error');
        } finally {
          setLoadingData(false);
        }
      };
      loadClientData();
    }
  }, [show, client]);

  const handleDeptChange = async (e) => {
    const deptId = e.target.value;
    setSelectedDept(deptId);
    setSelectedMun('');
    setFormData({ ...formData, distritoId: '' });
    setMunicipios([]);
    setDistritos([]);

    if (deptId) {
      const res = await api.get(`/locations/municipios/${deptId}`);
      setMunicipios(res.data);
    }
  };

  const handleMunChange = async (e) => {
    const munId = e.target.value;
    setSelectedMun(munId);
    setFormData({ ...formData, distritoId: '' });
    setDistritos([]);

    if (munId) {
      const res = await api.get(`/locations/distritos/${munId}`);
      setDistritos(res.data);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre) {
      return Swal.fire('Atención', 'El nombre del cliente es obligatorio', 'warning');
    }

    setLoadingSave(true);
    try {
      await api.put(`/clients/${client.ClienteID}`, formData);
      await Swal.fire('¡Actualizado!', 'Cliente modificado correctamente', 'success');
      onSuccess();
      onHide();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'No se pudo actualizar el cliente', 'error');
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title>Editar Cliente - {client?.CodigoCliente}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light">
        {loadingData ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Cargando datos del cliente...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">CÓDIGO</Form.Label>
                  <Form.Control name="codigo" value={formData.codigo} onChange={handleChange} disabled />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">NOMBRE O RAZÓN SOCIAL <span className="text-danger">*</span></Form.Label>
                  <Form.Control name="nombre" value={formData.nombre} onChange={handleChange} required />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">ATENCIÓN A</Form.Label>
                  <Form.Control name="atencionA" value={formData.atencionA} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">TELÉFONO</Form.Label>
                  <Form.Control name="telefono" value={formData.telefono} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">EMAIL</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
                </Form.Group>
              </Col>

              <Col md={12}><hr className="my-2" /></Col>
              
              <Col md={12}>
                <h6 className="text-inst-blue fw-bold mb-3 d-flex align-items-center gap-2">
                  <MapPin size={18} /> Ubicación
                </h6>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Departamento</Form.Label>
                  <Form.Select value={selectedDept} onChange={handleDeptChange}>
                    <option value="">-- Seleccionar --</option>
                    {departamentos.map(d => (
                      <option key={d.DepartamentoID} value={d.DepartamentoID}>{d.Nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Municipio</Form.Label>
                  <Form.Select value={selectedMun} onChange={handleMunChange} disabled={!selectedDept}>
                    <option value="">-- Seleccionar --</option>
                    {municipios.map(m => (
                      <option key={m.MunicipioID} value={m.MunicipioID}>{m.Nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Distrito</Form.Label>
                  <Form.Select 
                    name="distritoId" 
                    value={formData.distritoId} 
                    onChange={handleChange}
                    disabled={!selectedMun}
                  >
                    <option value="">-- Seleccionar --</option>
                    {distritos.map(d => (
                      <option key={d.DistritoID} value={d.DistritoID}>{d.Nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">DIRECCIÓN EXACTA</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2} 
                    name="direccion" 
                    value={formData.direccion} 
                    onChange={handleChange} 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        <Button 
          className="btn-institutional" 
          onClick={handleSubmit} 
          disabled={loadingSave || loadingData}
        >
          {loadingSave ? 'Guardando...' : <><Save size={18} className="me-2" /> ACTUALIZAR</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditClientModal;
