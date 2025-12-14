import { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Lock, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams(); // Obtenemos el token de la URL
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Las contraseñas no coinciden");
        if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
        
        setLoading(true);
        setError('');

        try {
            await api.post(`/auth/reset-password/${token}`, { newPassword: password });
            setMessage("¡Contraseña restablecida con éxito! Redirigiendo al login...");
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'El enlace es inválido o ha expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card className="shadow-sm border-0" style={{ width: '100%', maxWidth: '400px' }}>
                <Card.Body className="p-4">
                    <div className="text-center mb-4">
                        <h4 className="fw-bold text-inst-blue">Nueva Contraseña</h4>
                        <p className="text-muted small">Ingresa tu nueva contraseña a continuación.</p>
                    </div>

                    {message && <Alert variant="success" className="text-center small"><CheckCircle size={16}/> {message}</Alert>}
                    {error && <Alert variant="danger" className="text-center small">{error}</Alert>}
                    
                    {!message && (
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold text-secondary small">NUEVA CONTRASEÑA</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <Lock size={18} className="text-muted" />
                                    </span>
                                    <Form.Control type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="border-start-0 shadow-none"/>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold text-secondary small">CONFIRMAR CONTRASEÑA</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <Lock size={18} className="text-muted" />
                                    </span>
                                    <Form.Control type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border-start-0 shadow-none"/>
                                </div>
                            </Form.Group>

                            <Button className="btn-institutional w-100 py-2" type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                            </Button>
                        </Form>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ResetPassword;