import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { Shield, User, Mail, Briefcase, Lock } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const CreateUserModal = ({ show, onHide, onSave }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rolId, setRolId] = useState('2'); // Operador por defecto
    const [tipoVendedorId, setTipoVendedorId] = useState('');
    
    const [allSellerTypes, setAllSellerTypes] = useState([]);
    const [filteredTypes, setFilteredTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show) {
            loadSellerTypes();
            // Resetear formulario cuando se abre el modal
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRolId('2');
            setTipoVendedorId('');
            setError(null);
        }
    }, [show]);

    useEffect(() => {
        let filtrados = [];
        if (String(rolId) === '1') { 
            // Administrador -> Solo "Oficina"
            filtrados = allSellerTypes.filter(t => t.Nombre === 'Oficina');
        } else {
            // Operador -> Todo menos "Oficina"
            filtrados = allSellerTypes.filter(t => t.Nombre !== 'Oficina');
        }
        setFilteredTypes(filtrados);
        setTipoVendedorId('');
    }, [rolId, allSellerTypes]);

    const loadSellerTypes = async () => {
        try {
            const res = await api.get('/auth/seller-types');
            setAllSellerTypes(res.data);
        } catch (error) {
            console.error('Error al cargar tipos:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
            Swal.fire('Éxito', `Usuario "${username}" creado correctamente`, 'success');
            onSave();
            onHide();
        } catch (error) {
            setError(error.response?.data?.message || 'No se pudo crear el usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton className="bg-inst-blue text-white">
                <Modal.Title>Registrar Nuevo Usuario</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    {/* ROL / PERMISOS */}
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

                    {/* NOMBRE DE USUARIO */}
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

                    {/* CORREO ELECTRÓNICO */}
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
                    </Form.Group>

                    {/* TIPO DE VENDEDOR */}
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

                    {/* CONTRASEÑAS */}
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold text-secondary">Contraseña</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <Lock size={18} className="text-muted" />
                                    </span>
                                    <Form.Control 
                                        type="password" 
                                        placeholder="******"
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="border-start-0" 
                                        required 
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold text-secondary">Confirmar</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <Lock size={18} className="text-muted" />
                                    </span>
                                    <Form.Control 
                                        type="password" 
                                        placeholder="******"
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="border-start-0" 
                                        required 
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Registrar Usuario'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CreateUserModal;
