import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Form, Badge } from 'react-bootstrap';
import { Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import EditUserModal from '../componets/EditUserModal';
import CreateUserModal from '../componets/CreateUserModal';

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(user =>
            user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.CorreoElectronico && user.CorreoElectronico.toLowerCase().includes(searchTerm.toLowerCase())) ||
            user.NombreRol.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const loadUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
            setFilteredUsers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleDelete = async (userId, username) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Se eliminará el usuario: ${username}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/auth/users/${userId}`);
                Swal.fire('Eliminado', 'Usuario eliminado exitosamente', 'success');
                loadUsers();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el usuario', 'error');
            }
        }
    };

    const getRoleBadge = (roleName) => {
        return roleName === 'sudo' 
            ? <Badge bg="danger">Administrador</Badge> 
            : <Badge bg="primary">Operador</Badge>;
    };

    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <h2 className="text-inst-blue fw-bold mb-0">Gestión de Usuarios</h2>
                        <Button 
                            variant="outline-primary" 
                            onClick={() => setShowCreateModal(true)}
                        >
                            <UserPlus size={20} className="me-2" />
                            Nuevo Usuario
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group className="position-relative">
                        <Search className="position-absolute" size={20} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                        <Form.Control
                            type="text"
                            placeholder="Buscar por usuario, correo o rol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Usuario</th>
                                                <th>Correo</th>
                                                <th>Rol</th>
                                                <th>Tipo Vendedor</th>
                                                <th className="text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center text-muted py-4">
                                                        No se encontraron usuarios
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map(user => (
                                                    <tr key={user.UsuarioID}>
                                                        <td>{user.UsuarioID}</td>
                                                        <td className="fw-bold">{user.Username}</td>
                                                        <td>{user.CorreoElectronico || 'N/A'}</td>
                                                        <td>{getRoleBadge(user.NombreRol)}</td>
                                                        <td>{user.TipoVendedor || 'N/A'}</td>
                                                        <td className="text-center">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={() => handleEdit(user)}
                                                            >
                                                                <Pencil size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDelete(user.UsuarioID, user.Username)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <EditUserModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                user={selectedUser}
                onSave={loadUsers}
            />

            <CreateUserModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                onSave={loadUsers}
            />
        </Container>
    );
};

export default Users;
