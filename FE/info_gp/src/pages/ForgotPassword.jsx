import { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { User, ArrowLeft } from 'lucide-react'; // <--- Usamos icono de User ahora

const ForgotPassword = () => {
    const [username, setUsername] = useState(''); // <--- Cambio de email a username
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Enviamos { username } en lugar de { email }
            const res = await api.post('/auth/forgot-password', { username });
            setMessage(res.data.message);
        } catch (err) {
            console.error(err);
            // Mostrar mensaje detallado si viene del backend
            setError(err.response?.data?.message || 'Error al intentar enviar la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card className="shadow-sm border-0" style={{ width: '100%', maxWidth: '400px' }}>
                <Card.Body className="p-4">
                    <div className="text-center mb-4">
                        <h4 className="fw-bold text-inst-blue">Recuperar Contraseña</h4>
                        <p className="text-muted small">
                            Ingresa tu <strong>nombre de usuario</strong>. El sistema buscará tu correo registrado y te enviará un enlace.
                        </p>
                    </div>

                    {message && <Alert variant="success" className="text-center small">{message}</Alert>}
                    {error && <Alert variant="danger" className="text-center small">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold text-secondary small">USUARIO</Form.Label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <User size={18} className="text-muted" />
                                </span>
                                <Form.Control 
                                    type="text" 
                                    required 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    placeholder="Ej: jortiz"
                                    className="border-start-0 shadow-none"
                                />
                            </div>
                        </Form.Group>

                        <Button className="btn-institutional w-100 py-2 mb-3" type="submit" disabled={loading}>
                            {loading ? 'Procesando...' : 'Buscar y Enviar'}
                        </Button>
                    </Form>

                    <div className="text-center">
                        <Link to="/login" className="text-decoration-none text-secondary d-flex align-items-center justify-content-center gap-2 small">
                            <ArrowLeft size={16} /> Volver al Login
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ForgotPassword;