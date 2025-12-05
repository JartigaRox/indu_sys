import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Card, Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Edit, Save, ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const EditClient = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Obtenemos el ID de la URL

  // Estados del formulario
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    atencionA: '',
    telefono: '',
    email: '',
    direccion: '',
    distritoId: ''
  });

  // Estados catálogos
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [distritos, setDistritos] = useState([]);

  // Selecciones temporales
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMun, setSelectedMun] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState(null);

  // 1. CARGA INICIAL (Datos Cliente + Departamentos)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // A. Cargar Departamentos base
        const resDepts = await api.get('/locations/departamentos');
        setDepartamentos(resDepts.data);

        // B. Cargar Datos del Cliente
        const resClient = await api.get(`/clients/${id}`);
        const client = resClient.data;

        // C. Llenar formulario base
        setFormData({
            codigo: client.codigo,
            nombre: client.nombre,
            atencionA: client.atencionA,
            telefono: client.telefono,
            email: client.email,
            direccion: client.direccion,
            distritoId: client.distritoId
        });

        // D. Magia de Cascada: Cargar los combos dependientes
        // 1. Seleccionar Dept y cargar sus municipios
        setSelectedDept(client.DepartamentoID);
        const resMun = await api.get(`/locations/municipios/${client.DepartamentoID}`);
        setMunicipios(resMun.data);

        // 2. Seleccionar Mun y cargar sus distritos
        setSelectedMun(client.MunicipioID);
        const resDist = await api.get(`/locations/distritos/${client.MunicipioID}`);
        setDistritos(resDist.data);

      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la información del cliente o hace falta agregar datos.");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [id]);

  // Manejadores de cambios (Igual que en CreateClient)
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

  // Guardar Cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSave(true);
    try {
      await api.put(`/clients/${id}`, formData);
      alert("Cliente actualizado correctamente");
      navigate('/clientes');
    } catch (err) {
      console.error(err);
      setError("Error al actualizar cliente");
    } finally {
      setLoadingSave(false);
    }
  };

  if (loadingData) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" onClick={() => navigate('/clientes')} className="text-secondary p-0 me-3">
          <ArrowLeft size={24} />
        </Button>
        <h2 className="text-inst-blue fw-bold mb-0">Editar Cliente</h2>
      </div>

      <Card className="shadow border-0">
        <Card.Header className="bg-inst-gold text-white py-3">
          <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <Edit size={18} /> Modificar Información
          </h6>
        </Card.Header>
        <Card.Body className="p-4">
          
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">CÓDIGO</Form.Label>
                  <Form.Control name="codigo" value={formData.codigo} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">NOMBRE O RAZÓN SOCIAL</Form.Label>
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
                    <MapPin size={18} /> Ubicación Actual
                </h6>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small text-muted">Departamento</Form.Label>
                  <Form.Select value={selectedDept} onChange={handleDeptChange}>
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
                    required
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

              <Col md={12} className="mt-4">
                <Button type="submit" className="btn-institutional w-100 py-2" disabled={loadingSave}>
                  {loadingSave ? 'Guardando...' : <><Save size={18} className="me-2" /> ACTUALIZAR CLIENTE</>}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditClient;