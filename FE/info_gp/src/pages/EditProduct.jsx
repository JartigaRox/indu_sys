import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Card, Form, Button, Container, Row, Col, Image } from 'react-bootstrap';
import { Package, Save, ArrowLeft, Upload, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Estados
  const [codigo, setCodigo] = useState(''); // Solo para mostrar
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carga Inicial de Datos
  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Cargar Categorías
            const resCats = await api.get('/products/categories');
            setCategorias(resCats.data);

            // 2. Cargar Producto
            const resProd = await api.get(`/products/${id}`);
            const p = resProd.data;

            setCodigo(p.CodigoProducto);
            setNombre(p.Nombre);
            setDescripcion(p.Descripcion || '');
            setPreview(`http://localhost:5000/api/products/image/${id}`); // Imagen actual

            // 3. Cargar Subcategorías y seleccionar
            if (p.CategoriaID) {
                setSelectedCat(p.CategoriaID);
                const resSubs = await api.get(`/products/subcategories/${p.CategoriaID}`);
                setSubcategorias(resSubs.data);
                setSelectedSub(p.SubcategoriaID);
            }

        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo cargar la información del producto', 'error');
            navigate('/productos');
        }
    };
    loadData();
  }, [id, navigate]);

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
    if (file) formData.append('imagen', file);

    try {
      await api.put(`/products/${id}`, formData);
      await Swal.fire('Actualizado', 'Producto modificado correctamente', 'success');
      navigate('/productos'); 
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Error al actualizar', 'error');
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
        <h2 className="text-inst-blue fw-bold mb-0">Editar Producto</h2>
      </div>

      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Header className="bg-warning text-dark py-3">
              <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <Edit size={18} /> Modificar Inventario
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              
              <Form onSubmit={handleSubmit}>
                
                {/* Código (Solo lectura) */}
                <div className="mb-3 p-2 bg-light border rounded text-center">
                    <span className="text-muted small fw-bold text-uppercase d-block">CÓDIGO DE PRODUCTO</span>
                    <span className="fs-5 fw-bold text-inst-blue">{codigo}</span>
                </div>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-bold text-secondary small">Categoría</Form.Label>
                            <Form.Select value={selectedCat} onChange={handleCatChange} required>
                                <option value="">Seleccionar...</option>
                                {categorias.map(c => (
                                    <option key={c.CategoriaID} value={c.CategoriaID}>
                                        {c.CodigoCategoria || c.Nombre || `Categoría ${c.CategoriaID}`}
                                    </option>
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
                                    <option key={s.SubcategoriaID} value={s.SubcategoriaID}>
                                        {s.CodigoSubcategoria || s.Nombre || `Subcategoría ${s.SubcategoriaID}`}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={12}>
                        <Form.Text className="text-muted small">
                            * Nota: Cambiar la categoría modificará la clasificación interna pero NO el código visual.
                        </Form.Text>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Nombre</Form.Label>
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
                        <Form.Text className="text-muted">Sube una nueva solo si deseas cambiarla.</Form.Text>
                    </div>
                    <div className="border rounded d-flex align-items-center justify-content-center bg-light" style={{ width: '80px', height: '80px', overflow: 'hidden' }}>
                        {preview ? (
                            <Image 
                                src={preview} 
                                fluid 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                onError={(e) => e.target.src='https://via.placeholder.com/80?text=Error'}
                            />
                        ) : <Upload size={24} className="text-muted" />}
                    </div>
                  </div>
                </Form.Group>

                <div className="d-grid pt-2">
                  <Button type="submit" className="btn-institutional py-2" disabled={loading}>
                    {loading ? 'Guardando...' : <span className="d-flex align-items-center justify-content-center gap-2"><Save size={18} /> ACTUALIZAR PRODUCTO</span>}
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

export default EditProduct;