import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { FileImage } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const EditUserModal = ({ show, onHide, user, onSave }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        rolId: '',
        tipoVendedorId: '',
        password: '',
        confirmPassword: ''
    });
    const [firmaFile, setFirmaFile] = useState(null);
    const [firmaPreview, setFirmaPreview] = useState(null);
    const [roles, setRoles] = useState([]);
    const [sellerTypes, setSellerTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            loadCatalogs();
            if (user) {
                setFormData({
                    username: user.Username || '',
                    email: user.CorreoElectronico || '',
                    rolId: user.RolID || '',
                    tipoVendedorId: user.TipoVendedorID || '',
                    password: '',
                    confirmPassword: ''
                });
            }
        }
    }, [show, user]);

    const loadCatalogs = async () => {
        try {
            const [rolesRes, sellerTypesRes] = await Promise.all([
                api.get('/auth/roles'),
                api.get('/auth/seller-types')
            ]);
            setRoles(rolesRes.data);
            setSellerTypes(sellerTypesRes.data);
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFirmaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFirmaFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFirmaPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.rolId) {
            Swal.fire('Error', 'Usuario y rol son obligatorios', 'error');
            return;
        }

        // Validar que las contraseñas coincidan si se está cambiando
        if (formData.password && formData.password !== formData.confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }

        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('username', formData.username);
            submitData.append('email', formData.email);
            submitData.append('rolId', formData.rolId);
            submitData.append('tipoVendedorId', formData.tipoVendedorId);
            if (formData.password) {
                submitData.append('password', formData.password);
            }
            if (firmaFile) {
                submitData.append('firma', firmaFile);
            }

            await api.put(`/auth/users/${user.UsuarioID}`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
            onSave();
            onHide();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el usuario', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Editar Usuario</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Usuario <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Correo Electrónico</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Rol <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    name="rolId"
                                    value={formData.rolId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione un rol</option>
                                    {roles.map(role => (
                                        <option key={role.RolID} value={role.RolID}>
                                            {role.NombreRol === 'sudo' ? 'Administrador' : 'Operador'}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tipo de Vendedor</Form.Label>
                                <Form.Select
                                    name="tipoVendedorId"
                                    value={formData.tipoVendedorId}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {sellerTypes.map(type => (
                                        <option key={type.TipoVendedorID} value={type.TipoVendedorID}>
                                            {type.Nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* FIRMA Y SELLO */}
                    <Form.Group className="mb-3">
                        <Form.Label>Firma y Sello (Imagen)</Form.Label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <FileImage size={18} className="text-muted" />
                            </span>
                            <Form.Control 
                                type="file" 
                                accept="image/*"
                                onChange={handleFirmaChange}
                                className="border-start-0" 
                            />
                        </div>
                        <Form.Text className="text-muted">
                            Sube una nueva imagen para reemplazar la firma actual
                        </Form.Text>
                        <div className="mt-3">
                            {firmaPreview ? (
                                <div className="text-center">
                                    <p className="text-muted small mb-2">Nueva firma:</p>
                                    <img 
                                        src={firmaPreview} 
                                        alt="Nueva firma" 
                                        style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #ddd', padding: '5px' }}
                                    />
                                </div>
                            ) : user?.UsuarioID ? (
                                <div className="text-center">
                                    <p className="text-muted small mb-2">Firma actual:</p>
                                    <img 
                                        src={`http://localhost:5000/api/auth/users/${user.UsuarioID}/signature?t=${Date.now()}`}
                                        alt="Firma actual" 
                                        style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #ddd', padding: '5px' }}
                                        onError={(e) => { 
                                            e.target.style.display = 'none'; 
                                            const errorMsg = e.target.nextElementSibling;
                                            if (errorMsg) errorMsg.style.display = 'block';
                                        }}
                                    />
                                    <p className="text-muted small" style={{ display: 'none' }}>Sin firma registrada</p>
                                </div>
                            ) : null}
                        </div>
                    </Form.Group>

                    <hr className="my-3" />

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nueva Contraseña</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Dejar en blanco para no cambiar"
                                />
                                <Form.Text className="text-muted">
                                    Solo completa si deseas cambiar la contraseña
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repetir la nueva contraseña"
                                />
                                <Form.Text className="text-muted">
                                    Debe coincidir con la contraseña anterior
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EditUserModal;
