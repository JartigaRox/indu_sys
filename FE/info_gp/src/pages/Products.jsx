import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Spinner, Badge, Form, InputGroup } from 'react-bootstrap';
import { Plus, Package, Edit, Trash2, Search, FileSpreadsheet, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import EditProductModal from '../componets/EditProductModal';
import ImportProductsModal from '../componets/ImportProductsModal';
import CreateProductModal from '../componets/CreateProductModal';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(p => 
      p.CodigoProducto?.toLowerCase().includes(term) ||
      p.Nombre?.toLowerCase().includes(term) ||
      p.Categoria?.toLowerCase().includes(term) ||
      p.Subcategoria?.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/products/${id}`);
          Swal.fire('Eliminado!', 'El producto ha sido eliminado.', 'success');
          fetchProducts();
        } catch (error) {
          Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  const handleExportToExcel = () => {
    if (products.length === 0) {
      Swal.fire('Sin datos', 'No hay productos para exportar', 'info');
      return;
    }

    // Preparar datos para exportar
    const dataToExport = products.map(p => ({
      Código: p.CodigoProducto,
      Nombre: p.Nombre,
      Descripción: p.Descripcion || '',
      Categoría: p.Categoria || '',
      Subcategoría: p.Subcategoria || '',
      'Tipo de Mueble': p.TipoMueble || '',
      Estado: p.EstadoProducto || ''
    }));

    // Crear hoja de Excel
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 20 }, // Código
      { wch: 40 }, // Nombre
      { wch: 50 }, // Descripción
      { wch: 20 }, // Categoría
      { wch: 30 }, // Subcategoría
      { wch: 20 }, // Tipo de Mueble
      { wch: 20 }  // Estado
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    // Generar archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `productos_${fecha}.xlsx`);
    
    Swal.fire('Exportado', `${products.length} productos exportados correctamente`, 'success');
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-inst-blue fw-bold mb-0">Inventario de Productos</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            className="d-flex align-items-center gap-2" 
            onClick={handleExportToExcel}
          >
            <Download size={18} /> Exportar a Excel
          </Button>
          <Button 
            variant="outline-success" 
            className="d-flex align-items-center gap-2" 
            onClick={() => setShowImportModal(true)}
          >
            <FileSpreadsheet size={18} /> Importar desde Excel
          </Button>
          <Button className="btn-institutional d-flex align-items-center gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Nuevo Producto
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
              placeholder="Buscar por código, nombre, categoría o subcategoría..."
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
              Mostrando {filteredProducts.length} de {products.length} productos
            </small>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? <div className="p-5 text-center"><Spinner animation="border"/></div> : (
            <>
              {searchTerm && filteredProducts.length === 0 && (
                <div className="text-center p-5 text-muted">
                  No se encontraron productos que coincidan con la búsqueda
                </div>
              )}
              {filteredProducts.length > 0 && (
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="bg-light text-secondary small text-uppercase">
                    <tr>
                      <th className="ps-4">Código</th>
                      <th>Imagen</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Tipo Mueble</th>
                      <th>Estado</th>
                      <th className="text-end pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                  <tr key={p.ProductoID}>
                    <td className="ps-4 fw-bold text-inst-blue">{p.CodigoProducto}</td>
                    <td>
                        <img 
                            src={`http://localhost:5000/api/products/image/${p.ProductoID}`} 
                            style={{width:'40px', height:'40px', objectFit:'contain'}} 
                            onError={(e)=>e.target.src='https://via.placeholder.com/40?text=IMG'}
                        />
                    </td>
                    <td>{p.Nombre}</td>
                    <td><Badge bg="light" text="dark" className="border">{p.Categoria} / {p.Subcategoria}</Badge></td>
                    <td><Badge bg="info" text="dark">{p.TipoMueble || 'N/A'}</Badge></td>
                    <td><Badge bg="success">{p.EstadoProducto || 'N/A'}</Badge></td>
                    <td className="text-end pe-4">
                        <Button 
                            variant="link" 
                            className="text-inst-blue p-0 me-3" 
                            onClick={() => {
                                setSelectedProduct(p);
                                setShowEditModal(true);
                            }}
                        >
                            <Edit size={18} />
                        </Button>
                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(p.ProductoID)}>
                            <Trash2 size={18} />
                        </Button>
                    </td>
                  </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <CreateProductModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchProducts();
        }}
      />

      <EditProductModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        product={selectedProduct}
        onSuccess={() => {
          fetchProducts();
        }}
      />

      <ImportProductsModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchProducts();
        }}
      />
    </Container>
  );
};

export default Products;