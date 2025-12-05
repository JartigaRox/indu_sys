import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Badge, Spinner, Alert } from 'react-bootstrap';
import { Plus, Users, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Clients = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await api.get('/clients');
                setClients(res.data);
            } catch (err) {
                console.error(err);
                setError("Error al cargar la lista de clientes");
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    return (
        <Container className="py-4">

            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="text-inst-blue fw-bold mb-0">Cartera de Clientes</h2>
                    <p className="text-muted small mb-0">Gestiona tus contactos comerciales</p>
                </div>
                <Button
                    className="btn-institutional d-flex align-items-center gap-2"
                    onClick={() => navigate('/clientes/nuevo')}
                >
                    <Plus size={18} /> Nuevo Cliente
                </Button>
            </div>

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

                    {!loading && clients.length > 0 && (
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
                                {clients.map(c => (
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
                                            <Button
                                                variant="link"
                                                className="text-inst-blue p-0 fw-bold"
                                                size="sm"
                                                // ACTUALIZAR ESTO:
                                                onClick={() => navigate(`/clientes/editar/${c.ClienteID}`)}
                                            >
                                                Editar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Clients;