import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Image } from 'react-bootstrap';
import { Save, Upload } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const CreateProductModal = ({ show, onHide, onSuccess, initialData = null }) => {
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

  // Cargar catálogos al mostrar el modal
  useEffect(() => {
    if (show) {
      loadCatalogs();
      // Si hay initialData, pre-llenar los campos
      if (initialData) {
        setNombre(initialData.Nombre || '');
        setDescripcion(initialData.Descripcion || '');
        setSelectedCat(initialData.CategoriaID || '');
        setSelectedSub(initialData.SubcategoriaID || '');
        setSelectedTipoMueble(initialData.TipoMuebleID || '');
        setSelectedEstado(initialData.EstadoProductoID || '');
        // Si el producto tiene imagen, mostrar la vista previa
        if (initialData.ProductoID) {
          setPreview(`http://localhost:5000/api/products/image/${initialData.ProductoID}`);
        }
      }
    }
  }, [show, initialData]);

  const loadCatalogs = async () => {
    try {
      const [resCats, resTipos, resEstados] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products/tipos-mueble'),
        api.get('/products/estados-producto')
      ]);
      setCategorias(resCats.data);
      setTiposMueble(resTipos.data);
      setEstadosProducto(resEstados.data);

      // Si hay initialData con categoría, cargar subcategorías
      if (initialData?.CategoriaID) {
        const resSubs = await api.get(`/products/subcategories/${initialData.CategoriaID}`);
        setSubcategorias(resSubs.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCatChange = async (e) => {
    const catId = e.target.value;
    setSelectedCat(catId);
    setSelectedSub('');
    setSubcategorias([]);

    if (catId) {
      try {
        const res = await api.get(`/products/subcategories/${catId}`);
        setSubcategorias(res.data);
      } catch (err) {
        console.error(err);
      }
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
      onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNombre('');
    setDescripcion('');
    setSelectedCat('');
    setSelectedSub('');
    setSelectedTipoMueble('');
    setSelectedEstado('');
    setFile(null);
    setPreview(null);
    setSubcategorias([]);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="bg-inst-blue text-white">
        <Modal.Title>Nuevo Producto</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light">
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-secondary small">Categoría <span className="text-danger">*</span></Form.Label>
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
                <Form.Label className="fw-bold text-secondary small">Subcategoría <span className="text-danger">*</span></Form.Label>
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
            <Form.Label className="fw-bold text-secondary">Nombre del Producto <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              required 
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-secondary">Descripción</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-secondary">Imagen</Form.Label>
            <div className="d-flex gap-3 align-items-start">
              <div className="flex-grow-1">
                <Form.Control 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>
              <div 
                className="border rounded d-flex align-items-center justify-content-center bg-white" 
                style={{ width: '100px', height: '100px', overflow: 'hidden' }}
              >
                {preview ? (
                  <Image 
                    src={preview} 
                    fluid 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <Upload size={24} className="text-muted" />
                )}
              </div>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
        <Button 
          className="btn-institutional" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? 'Guardando...' : <><Save size={18} className="me-2" /> CREAR PRODUCTO</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateProductModal;
