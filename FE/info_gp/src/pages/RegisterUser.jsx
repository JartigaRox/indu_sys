import { useState } from 'react';
import api from '../api/axios';
import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { UserPlus, Save, ArrowLeft, Shield, Lock, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RegisterUser = () => {
  const navigate = useNavigate();
  
  // Estados del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // <--- Nuevo Estado
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rolId, setRolId] = useState(2);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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

    try {
      const payload = {
          username,
          email, // <--- Enviamos el email
          password,
          rolId: parseInt(rolId)
      };

      await api.post('/auth/register', payload);
      
      setSuccess(`Usuario "${username}" creado exitosamente.`);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRolId(2);

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
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Nombre de Usuario</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <User size={18} className="text-muted" />
                    </span>
                    <Form.Control 
                        type="text" 
                        placeholder="Ej. vendedor01"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="border-start-0"
                        required 
                    />
                  </div>
                </Form.Group>

                {/* CAMPO DE CORREO NUEVO */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Correo Electrónico</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <Mail size={18} className="text-muted" />
                    </span>
                    <Form.Control 
                        type="email" 
                        placeholder="usuario@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-start-0"
                        required 
                    />
                  </div>
                  <Form.Text className="text-muted small">
                    * Necesario para recuperación de contraseña.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Rol / Permisos</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <Shield size={18} className="text-muted" />
                    </span>
                    <Form.Select 
                        value={rolId}
                        onChange={(e) => setRolId(e.target.value)}
                        className="border-start-0"
                    >
                        <option value="2">Operador (Vendedor)</option>
                        <option value="1">Administrador (Sudo)</option>
                    </Form.Select>
                  </div>
                </Form.Group>

                <hr className="my-4" />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Contraseña</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <Lock size={18} className="text-muted" />
                    </span>
                    <Form.Control 
                        type="password" 
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-start-0"
                        required 
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-secondary">Confirmar Contraseña</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <Lock size={18} className="text-muted" />
                    </span>
                    <Form.Control 
                        type="password" 
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-start-0"
                        required 
                    />
                  </div>
                </Form.Group>

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