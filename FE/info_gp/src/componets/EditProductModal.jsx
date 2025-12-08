import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Image, Spinner } from 'react-bootstrap';
import { Save, Upload } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const EditProductModal = ({ show, onHide, product, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');
  
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // Cargar datos completos del producto cuando se abre el modal
  useEffect(() => {
    if (show && product?.ProductoID) {
      const loadProductData = async () => {
        setLoadingData(true);
        try {
          // 1. Cargar Categorías
          const resCats = await api.get('/products/categories');
          setCategorias(resCats.data);

          // 2. Cargar Producto completo
          const resProd = await api.get(`/products/${product.ProductoID}`);
          const p = resProd.data;

          setCodigo(p.CodigoProducto);
          setNombre(p.Nombre);
          setDescripcion(p.Descripcion || '');
          setPreview(`http://localhost:5000/api/products/image/${product.ProductoID}`);

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
        } finally {
          setLoadingData(false);
        }
      };
      loadProductData();
    }
  }, [show, product]);

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

  const handleSubmit = async () => {
    if (!selectedSub) {
      return Swal.fire('Atención', 'Debes seleccionar una subcategoría', 'warning');
    }

    setLoadingSave(true);
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('subcategoriaId', selectedSub);
    if (file) formData.append('imagen', file);

    try {
      await api.put(`/products/${product.ProductoID}`, formData);
      await Swal.fire('¡Actualizado!', 'Producto modificado correctamente', 'success');
      onSuccess();
      onHide();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'No se pudo actualizar el producto', 'error');
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title>Editar Producto - {codigo}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light">
        {loadingData ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
            <p className="mt-2 text-muted">Cargando datos del producto...</p>
          </div>
        ) : (
          <Form>
            {/* Código (Solo lectura) */}
            <div className="mb-3 p-2 bg-white border rounded text-center">
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
                  <Form.Text className="text-muted">
                    Sube una nueva solo si deseas cambiarla.
                  </Form.Text>
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
                      onError={(e) => e.target.src='https://via.placeholder.com/100?text=Error'}
                    />
                  ) : (
                    <Upload size={24} className="text-muted" />
                  )}
                </div>
              </div>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        <Button 
          className="btn-institutional" 
          onClick={handleSubmit} 
          disabled={loadingSave || loadingData}
        >
          {loadingSave ? 'Guardando...' : <><Save size={18} className="me-2" /> ACTUALIZAR</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProductModal;
