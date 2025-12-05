import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { UserPlus, Save, ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateClient = () => {
  const navigate = useNavigate();
  
  // Estados del formulario (Ya no inicializamos 'codigo')
  const [formData, setFormData] = useState({
    nombre: '',
    atencionA: '',
    telefono: '',
    email: '',
    direccion: '',
    distritoId: '' // Ahora puede ir vacío
  });

  // Estados para los catálogos geográficos
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [distritos, setDistritos] = useState([]);

  // Estados de selección temporal
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMun, setSelectedMun] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Cargar Departamentos al iniciar
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await api.get('/locations/departamentos');
        setDepartamentos(res.data);
      } catch (err) {
        console.error("Error cargando departamentos", err);
      }
    };
    loadDepts();
  }, []);

  // 2. Cuando cambia Departamento
  const handleDeptChange = async (e) => {
    const deptId = e.target.value;
    setSelectedDept(deptId);
    setSelectedMun(''); 
    setFormData({ ...formData, distritoId: '' }); 
    setMunicipios([]);
    setDistritos([]);

    if (deptId) {
      try {
        const res = await api.get(`/locations/municipios/${deptId}`);
        setMunicipios(res.data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // 3. Cuando cambia Municipio
  const handleMunChange = async (e) => {
    const munId = e.target.value;
    setSelectedMun(munId);
    setFormData({ ...formData, distritoId: '' }); 
    setDistritos([]);

    if (munId) {
      try {
        const res = await api.get(`/locations/distritos/${munId}`);
        setDistritos(res.data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // VALIDACIÓN: Solo el nombre es obligatorio
    if (!formData.nombre.trim()) {
        setError("El nombre del cliente es obligatorio.");
        setLoading(false);
        return;
    }

    try {
      // Preparamos los datos. Si distritoId está vacío, enviamos null
      const payload = {
          ...formData,
          distritoId: formData.distritoId || null
      };

      const res = await api.post('/clients', payload);
      
      // Mostramos el código que generó el backend
      alert(`Cliente registrado exitosamente.\nCódigo Asignado: ${res.data.codigo}`);
      navigate('/clientes'); 
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al guardar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" onClick={() => navigate('/clientes')} className="text-secondary p-0 me-3">
          <ArrowLeft size={24} />
        </Button>
        <h2 className="text-inst-blue fw-bold mb-0">Nuevo Cliente</h2>
      </div>

      <Card className="shadow border-0">
        <Card.Header className="bg-inst-blue text-white py-3">
          <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <UserPlus size={18} /> Información Comercial
          </h6>
        </Card.Header>
        <Card.Body className="p-4">
          
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              
              {/* --- CAMPO CÓDIGO ELIMINADO --- */}
              {/* El backend lo generará automáticamente */}

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">NOMBRE O RAZÓN SOCIAL <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    required 
                    placeholder="Ej. Empresa Importadora S.A." 
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">ATENCIÓN A </Form.Label>
                  <Form.Control name="atencionA" value={formData.atencionA} onChange={handleChange} placeholder="Persona de contacto" />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">TELÉFONO</Form.Label>
                  <Form.Control name="telefono" value={formData.telefono} onChange={handleChange} placeholder="0000-0000" />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">EMAIL</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="cliente@correo.com" />
                </Form.Group>
              </Col>

              <Col md={12}><hr className="my-2" /></Col>
              
              {/* --- UBICACIÓN GEOGRÁFICA (Ahora Opcional) --- */}
              <Col md={12}>
                <h6 className="text-inst-gold fw-bold mb-3 d-flex align-items-center gap-2">
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
                    // 'required' ELIMINADO
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
                  <Form.Label className="fw-bold text-secondary small">DIRECCIÓN EXACTA (Opcional)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2} 
                    name="direccion" 
                    value={formData.direccion} 
                    onChange={handleChange} 
                    placeholder="Calle, Número de casa..." 
                  />
                </Form.Group>
              </Col>

              <Col md={12} className="mt-4">
                <Button type="submit" className="btn-institutional w-100 py-2" disabled={loading}>
                  {loading ? 'Guardando...' : <><Save size={18} className="me-2" /> GUARDAR CLIENTE</>}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateClient;