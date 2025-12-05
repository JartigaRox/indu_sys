import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { Plus, Trash2, Printer, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Select from 'react-select'; // <--- Librería nueva
import QuotationPDF from '../componets/QuotationPDF';

const CreateQuotation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const componentRef = useRef();

  // Estados de Datos
  const [clients, setClients] = useState([]);
  const [productOptions, setProductOptions] = useState([]); // Opciones para el select
  const [nextId, setNextId] = useState(0);
  
  // Estados del Formulario
  const [selectedClient, setSelectedClient] = useState('');
  const [empresaId, setEmpresaId] = useState(1); // 1 = Empresa A, 2 = Empresa B
  
  // Estados para item actual
  const [currentProduct, setCurrentProduct] = useState(null); // Objeto completo del select
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  
  // Lista
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resClients = await api.get('/clients');
        const resProducts = await api.get('/products');
        const resNext = await api.get('/quotations/next-number');

        setClients(resClients.data);
        setNextId(resNext.data.nextId);

        // Transformar productos para react-select: { value, label, data }
        const options = resProducts.data.map(p => ({
            value: p.ProductoID,
            label: `${p.CodigoProducto} - ${p.Nombre}`, // Lo que se busca y ve
            data: p // Guardamos todo el objeto producto aquí
        }));
        setProductOptions(options);

      } catch (error) {
        console.error("Error cargando datos", error);
      }
    };
    loadData();
  }, []);

  const addItem = () => {
    if (!currentProduct || quantity <= 0 || price < 0) return;

    const newItem = {
      productoId: currentProduct.value,
      codigo: currentProduct.data.CodigoProducto,
      nombre: currentProduct.data.Nombre,
      cantidad: parseInt(quantity),
      precio: parseFloat(price)
    };

    setItems([...items, newItem]);
    // Reset inputs
    setQuantity(1);
    setPrice(0);
    setCurrentProduct(null); // Limpiar el select
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const clientData = clients.find(c => c.ClienteID === parseInt(selectedClient));
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'XX';
  const quoteNumber = `${initials}-${nextId.toString().padStart(6, '0')}`;

  const pdfData = {
    cliente: clientData,
    items: items,
    user: user,
    numeroCotizacion: quoteNumber,
    fecha: new Date(),
    // Pasamos info extra para que el PDF sepa qué logo o nombre de empresa poner
    empresaId: empresaId 
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Cotizacion_${quoteNumber}`,
  });

  const handleSave = async () => {
    if (!selectedClient || items.length === 0) {
      alert("Faltan datos");
      return;
    }

    try {
      const payload = {
        clienteId: parseInt(selectedClient),
        empresaId: parseInt(empresaId), // <--- Enviamos la empresa seleccionada
        nombreQuienCotiza: user.username,
        telefonoSnapshot: clientData.Telefono,
        atencionASnapshot: clientData.AtencionA,
        direccionSnapshot: `${clientData.DireccionCalle}, ${clientData.Municipio}`,
        items: items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precio: i.precio
        }))
      };

      await api.post('/quotations', payload);
      alert("Cotización guardada exitosamente");
      navigate('/cotizaciones');
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" onClick={() => navigate('/cotizaciones')} className="text-secondary p-0 me-3">
          <ArrowLeft size={24} />
        </Button>
        <h2 className="text-inst-blue fw-bold mb-0">Nueva Cotización</h2>
      </div>

      <Row>
        <Col lg={5}>
          {/* TARJETA DE CONFIGURACIÓN GENERAL */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h6 className="text-inst-blue fw-bold mb-3">Configuración</h6>
              
              {/* SELECTOR DE EMPRESA */}
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">Empresa Emisora:</Form.Label>
                <div className="d-flex gap-3">
                    <Form.Check 
                        type="radio" 
                        label="Empresa A S.A. de C.V." 
                        name="empresa" 
                        checked={empresaId === 1} 
                        onChange={() => setEmpresaId(1)} 
                    />
                    <Form.Check 
                        type="radio" 
                        label="Empresa B Solutions" 
                        name="empresa" 
                        checked={empresaId === 2} 
                        onChange={() => setEmpresaId(2)} 
                    />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cliente</Form.Label>
                <Form.Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {clients.map(c => (
                    <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* TARJETA DE AGREGAR PRODUCTOS */}
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h5 className="text-inst-blue fw-bold mb-3">Agregar Productos</h5>
              <Row className="g-2">
                <Col md={12}>
                  <Form.Group className="mb-2">
                    <Form.Label>Buscar Producto</Form.Label>
                    {/* COMPONENTE REACT-SELECT */}
                    <Select
                        options={productOptions}
                        value={currentProduct}
                        onChange={(selected) => setCurrentProduct(selected)}
                        placeholder="Escribe código o nombre..."
                        isSearchable={true}
                        noOptionsMessage={() => "No se encontraron productos"}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Cantidad</Form.Label>
                    <Form.Control type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Precio Unitario ($)</Form.Label>
                    <Form.Control type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={12} className="mt-3">
                  <Button variant="outline-primary" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={addItem}>
                    <Plus size={18} /> Agregar a la lista
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* LADO DERECHO: VISTA PREVIA */}
        <Col lg={7}>
          <Card className="shadow border-0 h-100">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-secondary">Vista Previa</h6>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={handlePrint} disabled={items.length === 0}>
                  <Printer size={16} className="me-1" /> PDF
                </Button>
                <Button className="btn-institutional" size="sm" onClick={handleSave} disabled={items.length === 0}>
                  <Save size={16} className="me-1" /> Guardar
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="bg-light d-flex justify-content-center overflow-auto p-4">
              <div className="shadow bg-white" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                <QuotationPDF ref={componentRef} data={pdfData} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateQuotation;