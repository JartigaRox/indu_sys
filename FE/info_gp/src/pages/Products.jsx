import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Table, Button, Container, Spinner, Badge } from 'react-bootstrap';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // <--- SWEET ALERT

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

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

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-inst-blue fw-bold mb-0">Inventario de Productos</h2>
        <Button className="btn-institutional d-flex align-items-center gap-2" onClick={() => navigate('/productos/nuevo')}>
            <Plus size={18} /> Nuevo Producto
        </Button>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? <div className="p-5 text-center"><Spinner animation="border"/></div> : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4">Código</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th className="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
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
                    <td className="text-end pe-4">
                        <Button variant="link" className="text-inst-blue p-0 me-3" onClick={() => navigate(`/productos/editar/${p.ProductoID}`)}>
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
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Products;