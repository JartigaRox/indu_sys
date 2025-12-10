import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { Plus, Users, MapPin, Phone, Search, FileSpreadsheet, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import EditClientModal from '../componets/EditClientModal';
import CreateClientModal from '../componets/CreateClientModal';
import ImportClientsModal from '../componets/ImportClientsModal';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/clients');
            setClients(res.data);
            setFilteredClients(res.data);
        } catch (err) {
            console.error(err);
            setError("Error al cargar la lista de clientes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // Eliminar cliente
    const handleDeleteClient = async (clienteId, nombreCliente) => {
        const result = await Swal.fire({
            title: '¿Eliminar Cliente?',
            html: `¿Estás seguro de eliminar el cliente:<br><strong>${nombreCliente}</strong>?<br><br>Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/clients/${clienteId}`);
                await Swal.fire('¡Eliminado!', 'El cliente ha sido eliminado correctamente', 'success');
                fetchClients();
            } catch (error) {
                Swal.fire(
                    'Error', 
                    error.response?.data?.message || 'No se pudo eliminar el cliente', 
                    'error'
                );
            }
        }
    };

    // Filtrar clientes según el término de búsqueda
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredClients(clients);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = clients.filter(c => 
            c.CodigoCliente?.toLowerCase().includes(term) ||
            c.NombreCliente?.toLowerCase().includes(term) ||
            c.AtencionA?.toLowerCase().includes(term) ||
            c.Telefono?.toLowerCase().includes(term) ||
            c.Municipio?.toLowerCase().includes(term) ||
            c.Departamento?.toLowerCase().includes(term)
        );
        setFilteredClients(filtered);
    }, [searchTerm, clients]);

    return (
        <Container className="py-4">

            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="text-inst-blue fw-bold mb-0">Cartera de Clientes</h2>
                    <p className="text-muted small mb-0">Gestiona tus contactos comerciales</p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-success"
                        className="d-flex align-items-center gap-2"
                        onClick={() => setShowImportModal(true)}
                    >
                        <FileSpreadsheet size={18} /> Importar desde Excel
                    </Button>
                    <Button
                        className="btn-institutional d-flex align-items-center gap-2"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Buscador */}
            <Card className="shadow-sm border-0 mb-3">
                <Card.Body className="py-3">
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Buscar por código, nombre, contacto, teléfono o ubicación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-start-0 ps-0"
                        />
                        {searchTerm && (
                            <Button 
                                variant="link" 
                                className="text-secondary text-decoration-none"
                                onClick={() => setSearchTerm('')}
                            >
                                Limpiar
                            </Button>
                        )}
                    </InputGroup>
                    {searchTerm && (
                        <small className="text-muted d-block mt-2">
                            Mostrando {filteredClients.length} de {clients.length} clientes
                        </small>
                    )}
                </Card.Body>
            </Card>

            {/* Contenido */}
            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">

                    {loading && <div className="text-center p-5"><Spinner animation="border" /></div>}
                    {error && <Alert variant="danger" className="m-3">{error}</Alert>}

                    {!loading && !error && clients.length === 0 && (
                        <div className="text-center p-5 text-muted">
                            <Users size={48} className="mb-3 opacity-50" />
                            <p>No hay clientes registrados.</p>
                        </div>
                    )}

                    {!loading && !error && searchTerm && filteredClients.length === 0 && (
                        <div className="text-center p-5 text-muted">
                            No se encontraron clientes que coincidan con la búsqueda
                        </div>
                    )}

                    {!loading && filteredClients.length > 0 && (
                        <Table hover responsive className="mb-0 align-middle">
                            <thead className="bg-light text-secondary small text-uppercase">
                                <tr>
                                    <th className="ps-4">Código</th>
                                    <th>Cliente / Razón Social</th>
                                    <th>Contacto</th>
                                    <th>Ubicación</th>
                                    <th className="text-end pe-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map(c => (
                                    <tr key={c.ClienteID}>
                                        <td className="ps-4 fw-bold text-inst-blue">{c.CodigoCliente}</td>
                                        <td>
                                            <div className="fw-bold">{c.NombreCliente}</div>
                                            <div className="small text-muted"><Phone size={12} className="me-1" />{c.Telefono}</div>
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="border">
                                                {c.AtencionA || 'N/A'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-1 small text-muted">
                                                <MapPin size={14} className="text-inst-gold" />
                                                {c.Municipio}, {c.Departamento}
                                            </div>
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex justify-content-end gap-2">
                                                <Button
                                                    variant="link"
                                                    className="text-inst-blue p-0 fw-bold"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedClient(c);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    className="text-danger p-0"
                                                    size="sm"
                                                    onClick={() => handleDeleteClient(c.ClienteID, c.NombreCliente)}
                                                    title="Eliminar Cliente"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <EditClientModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                client={selectedClient}
                onSuccess={() => {
                    fetchClients();
                }}
            />

            <CreateClientModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchClients();
                }}
            />

            <ImportClientsModal
                show={showImportModal}
                onHide={() => setShowImportModal(false)}
                onSuccess={() => {
                    fetchClients();
                }}
            />
        </Container>
    );
};

export default Clients;