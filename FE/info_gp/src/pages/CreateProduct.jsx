import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Card, Form, Button, Container, Row, Col, Alert, Image } from 'react-bootstrap';
import { Package, Save, ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CreateProduct = () => {
  const navigate = useNavigate();
  
  // Estados
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  const [tiposMueble, setTiposMueble] = useState([]);
  const [estadosProducto, setEstadosProducto] = useState([]);
  const [selectedTipoMueble, setSelectedTipoMueble] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar Categorías, Tipos de Mueble y Estados
  useEffect(() => {
    api.get('/products/categories')
        .then(res => setCategorias(res.data))
        .catch(err => console.error(err));
    
    api.get('/products/tipos-mueble')
        .then(res => setTiposMueble(res.data))
        .catch(err => console.error(err));
    
    api.get('/products/estados-producto')
        .then(res => setEstadosProducto(res.data))
        .catch(err => console.error(err));
  }, []);

  const handleCatChange = async (e) => {
    const catId = e.target.value;
    setSelectedCat(catId);
    setSelectedSub('');
    setSubcategorias([]);

    if (catId) {
        try {
            const res = await api.get(`/products/subcategories/${catId}`);
            setSubcategorias(res.data);
        } catch (err) { console.error(err); }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSub) {
        Swal.fire('Atención', 'Debes seleccionar una subcategoría', 'warning');
        return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('subcategoriaId', selectedSub);
    if (selectedTipoMueble) formData.append('tipoMuebleId', selectedTipoMueble);
    if (selectedEstado) formData.append('estadoProductoId', selectedEstado);
    if (file) formData.append('imagen', file);

    try {
      const res = await api.post('/products', formData);
      await Swal.fire({
        title: '¡Producto Creado!',
        text: `Código generado: ${res.data.codigo}`,
        icon: 'success',
        confirmButtonColor: '#003366'
      });
      navigate('/productos'); 
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" onClick={() => navigate('/productos')} className="text-secondary p-0 me-3">
          <ArrowLeft size={24} />
        </Button>
        <h2 className="text-inst-blue fw-bold mb-0">Nuevo Producto</h2>
      </div>

      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Header className="bg-inst-blue text-white py-3">
              <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <Package size={18} /> Información del Inventario
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-bold text-secondary small">Categoría</Form.Label>
                            <Form.Select value={selectedCat} onChange={handleCatChange} required>
                                <option value="">Seleccionar...</option>
                                {categorias.map(c => (
                                    <option key={c.CategoriaID} value={c.CategoriaID}>{c.Nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-bold text-secondary small">Subcategoría</Form.Label>
                            <Form.Select 
                                value={selectedSub} 
                                onChange={(e) => setSelectedSub(e.target.value)}
                                disabled={!selectedCat}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {subcategorias.map(s => (
                                    <option key={s.SubcategoriaID} value={s.SubcategoriaID}>{s.Nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={12}>
                        <Form.Text className="text-muted small">
                            * El código se generará automáticamente (CAT-SUB-0001).
                        </Form.Text>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-bold text-secondary small">Tipo de Mueble</Form.Label>
                            <Form.Select value={selectedTipoMueble} onChange={(e) => setSelectedTipoMueble(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {tiposMueble.map(t => (
                                    <option key={t.TipoMuebleID} value={t.TipoMuebleID}>{t.Tipo}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-bold text-secondary small">Estado</Form.Label>
                            <Form.Select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {estadosProducto.map(e => (
                                    <option key={e.EstadoProductoID} value={e.EstadoProductoID}>{e.Estado}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Nombre del Producto</Form.Label>
                  <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Descripción</Form.Label>
                  <Form.Control as="textarea" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-secondary">Imagen</Form.Label>
                  <div className="d-flex gap-3 align-items-start">
                    <div className="flex-grow-1">
                        <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <div className="border rounded d-flex align-items-center justify-content-center bg-light" style={{ width: '80px', height: '80px', overflow: 'hidden' }}>
                        {preview ? <Image src={preview} fluid style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={24} className="text-muted" />}
                    </div>
                  </div>
                </Form.Group>

                <div className="d-grid pt-2">
                  <Button type="submit" className="btn-institutional py-2" disabled={loading}>
                    {loading ? 'Guardando...' : <span className="d-flex align-items-center justify-content-center gap-2"><Save size={18} /> CREAR PRODUCTO</span>}
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

export default CreateProduct;