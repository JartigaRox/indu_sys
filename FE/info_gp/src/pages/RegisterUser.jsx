import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { UserPlus, Save, ArrowLeft, Shield, Lock, User, Mail, Briefcase } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const RegisterUser = () => {
  const navigate = useNavigate();
  
  // Estados del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estado del Rol (2 = Vendedor por defecto)
  const [rolId, setRolId] = useState('2'); 
  const [tipoVendedorId, setTipoVendedorId] = useState(''); 

  // Listas de datos
  const [allSellerTypes, setAllSellerTypes] = useState([]); // Todos los tipos traídos de la BD
  const [filteredTypes, setFilteredTypes] = useState([]);   // Tipos filtrados según el rol

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Cargar tipos de vendedor al iniciar
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await api.get('/auth/seller-types');
        setAllSellerTypes(res.data);
      } catch (err) {
        console.error("Error cargando tipos:", err);
      }
    };
    fetchTypes();
  }, []);

  // 2. Filtrar Tipos cuando cambia el Rol o la Lista
  useEffect(() => {
    let filtrados = [];

    // LÓGICA DE FILTRADO
    if (String(rolId) === '1') { 
        // Si es ADMINISTRADOR (1) -> Solo mostrar "Oficina"
        filtrados = allSellerTypes.filter(t => t.Nombre === 'Oficina');
    } else {
        // Si es VENDEDOR (2) -> Mostrar todo MENOS "Oficina" (o los que tú decidas)
        filtrados = allSellerTypes.filter(t => t.Nombre !== 'Oficina');
    }

    setFilteredTypes(filtrados);
    setTipoVendedorId(''); // Resetear selección al cambiar de rol para evitar inconsistencias
  }, [rolId, allSellerTypes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
    }
    if (!tipoVendedorId) {
        setError("Seleccione un Tipo de Vendedor");
        setLoading(false);
        return;
    }

    try {
      const payload = {
          username,
          email,
          password,
          rolId: parseInt(rolId),
          tipoVendedorId: parseInt(tipoVendedorId)
      };

      await api.post('/auth/register', payload);
      
      setSuccess(`Usuario "${username}" creado exitosamente.`);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRolId('2'); // Volver a default
      setTipoVendedorId('');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" onClick={() => navigate('/')} className="text-secondary p-0 me-3">
          <ArrowLeft size={24} />
        </Button>
        <h2 className="text-inst-blue fw-bold mb-0">Registrar Nuevo Usuario</h2>
      </div>

      <Row className="justify-content-center">
        <Col md={8} lg={5}>
          <Card className="shadow border-0">
            <Card.Header className="bg-inst-blue text-white py-3">
              <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <UserPlus size={18} /> Credenciales de Acceso
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                
                {/* ROL / PERMISOS (Lo moví arriba porque define lo de abajo) */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Rol / Permisos</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <Shield size={18} className="text-muted" />
                    </span>
                    <Form.Select 
                        value={rolId} 
                        onChange={(e) => setRolId(e.target.value)}
                        className="border-start-0 fw-bold text-dark"
                    >
                        <option value="2">Operador (Vendedor)</option>
                        <option value="1">Administrador (Sudo)</option>
                    </Form.Select>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Nombre de Usuario</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <User size={18} className="text-muted" />
                    </span>
                    <Form.Control 
                        type="text" placeholder="Ej. vendedor01"
                        value={username} onChange={(e) => setUsername(e.target.value)}
                        className="border-start-0" required 
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Correo Electrónico</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <Mail size={18} className="text-muted" />
                    </span>
                    <Form.Control 
                        type="email" placeholder="usuario@empresa.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="border-start-0" required 
                    />
                  </div>
                </Form.Group>

                {/* TIPO DE VENDEDOR (Filtrado Dinámicamente) */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">
                    {String(rolId) === '1' ? 'Área Administrativa' : 'Tipo de Vendedor'}
                  </Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <Briefcase size={18} className="text-muted" />
                    </span>
                    <Form.Select 
                        value={tipoVendedorId} 
                        onChange={(e) => setTipoVendedorId(e.target.value)}
                        className="border-start-0"
                        disabled={filteredTypes.length === 0}
                    >
                        <option value="">
                            {filteredTypes.length === 0 ? '-- No hay opciones --' : '-- Seleccionar --'}
                        </option>
                        {filteredTypes.map(type => (
                            <option key={type.TipoVendedorID} value={type.TipoVendedorID}>
                                {type.Nombre}
                            </option>
                        ))}
                    </Form.Select>
                  </div>
                </Form.Group>

                <hr className="my-4" />

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold text-secondary">Contraseña</Form.Label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <Lock size={18} className="text-muted" />
                                </span>
                                <Form.Control 
                                    type="password" placeholder="******"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="border-start-0" required 
                                />
                            </div>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold text-secondary">Confirmar</Form.Label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <Lock size={18} className="text-muted" />
                                </span>
                                <Form.Control 
                                    type="password" placeholder="******"
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="border-start-0" required 
                                />
                            </div>
                        </Form.Group>
                    </Col>
                </Row>

                <div className="d-grid pt-2">
                  <Button type="submit" className="btn-institutional py-2" disabled={loading}>
                    {loading ? 'Creando...' : <span className="d-flex align-items-center justify-content-center gap-2"><Save size={18} /> REGISTRAR USUARIO</span>}
                  </Button>
                </div>

              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterUser;