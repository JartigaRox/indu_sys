import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { User, Lock } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  const { signin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const result = await signin({ username, password });
    if (result === true) navigate('/');
    else setError(result);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="login-card p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body>
          
          {/* Encabezado */}
          <div className="text-center mb-4">
            <h2 className="fw-bold text-inst-blue mb-0">INFO GP</h2>
            <div style={{ height: '4px', width: '60px', backgroundColor: '#D4AF37', margin: '10px auto' }}></div>
            <small className="text-muted">Acceso Administrativo</small>
          </div>

          {/* Mensaje de Error */}
          {error && <Alert variant="danger" className="text-center">{error}</Alert>}

          {/* Formulario */}
          <Form onSubmit={handleSubmit}>
            
            <Form.Group className="mb-3 position-relative">
              <Form.Label className="fw-bold text-secondary">Usuario</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <User size={18} className="text-inst-gold" />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-start-0 shadow-none"
                  required
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-4 position-relative">
              <Form.Label className="fw-bold text-secondary">Contraseña</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Lock size={18} className="text-inst-gold" />
                </span>
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-start-0 shadow-none"
                  required
                />
              </div>
            </Form.Group>

            <Button type="submit" className="btn-institutional w-100 py-2">
              INICIAR SESIÓN
            </Button>

          </Form>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-top">
            <small className="text-muted text-opacity-50">&copy; 2025 Sistema de Gestión</small>
          </div>

        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;