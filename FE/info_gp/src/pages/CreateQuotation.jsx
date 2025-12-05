import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { Plus, Printer, Save, ArrowLeft, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select'; 
import QuotationPDF from '../componets/QuotationPDF';

const CreateQuotation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Estados...
  const [clients, setClients] = useState([]);
  const [productOptions, setProductOptions] = useState([]); 
  const [companies, setCompanies] = useState([]);
  const [nextId, setNextId] = useState(0);
  
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  
  const [currentProduct, setCurrentProduct] = useState(null); 
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(true);

  // Carga de datos...
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resClients, resProducts, resNext, resCompanies] = await Promise.all([
            api.get('/clients'),
            api.get('/products'),
            api.get('/quotations/next-number'),
            api.get('/companies')
        ]);

        setClients(resClients.data);
        setCompanies(resCompanies.data);
        
        const options = resProducts.data.map(p => ({
            value: p.ProductoID,
            label: `${p.CodigoProducto} - ${p.Nombre}`,
            data: p 
        }));
        setProductOptions(options);

        if (!isEditMode) {
            setNextId(resNext.data.nextId);
            if (resCompanies.data.length > 0) setSelectedCompanyId(resCompanies.data[0].EmpresaID);
            setLoading(false);
        } else {
            const resQuote = await api.get(`/quotations/${id}`);
            const q = resQuote.data;
            setSelectedClient(q.ClienteID);
            setSelectedCompanyId(q.EmpresaID);
            setItems(q.items.map(i => ({
                productoId: i.ProductoID,
                codigo: i.CodigoProducto,
                nombre: i.NombreProducto,
                cantidad: i.Cantidad,
                precio: i.PrecioUnitario
            })));
            const numParts = q.NumeroCotizacion.split('-');
            if (numParts.length > 1) setNextId(parseInt(numParts[numParts.length - 1]));
            setLoading(false);
        }
      } catch (error) { console.error(error); }
    };
    loadData();
  }, [isEditMode, id]);

  // Manejo Items...
  const handleAddItem = () => {
    if (!currentProduct || quantity <= 0 || price < 0) return;
    const newItem = {
      productoId: currentProduct.value,
      codigo: currentProduct.data.CodigoProducto,
      nombre: currentProduct.data.Nombre,
      cantidad: parseInt(quantity),
      precio: parseFloat(price)
    };
    if (editingIndex >= 0) {
        const updated = [...items];
        updated[editingIndex] = newItem;
        setItems(updated);
        setEditingIndex(-1);
    } else { setItems([...items, newItem]); }
    setQuantity(1); setPrice(0); setCurrentProduct(null); 
  };

  const handleEditItem = (index) => {
    const item = items[index];
    const prodOption = productOptions.find(p => p.value === item.productoId);
    setCurrentProduct(prodOption);
    setQuantity(item.cantidad);
    setPrice(item.precio);
    setEditingIndex(index);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) { setEditingIndex(-1); setQuantity(1); setPrice(0); setCurrentProduct(null); }
  };

  // Datos PDF
  const clientData = clients.find(c => c.ClienteID === parseInt(selectedClient));
  const companyData = companies.find(c => c.EmpresaID === parseInt(selectedCompanyId));
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'XX';
  const displayId = nextId ? nextId.toString().padStart(6, '0') : '000000';
  const quoteNumber = `${initials}-${displayId}`;

  const pdfData = { cliente: clientData, items, user, numeroCotizacion: quoteNumber, fecha: new Date(), empresa: companyData };

  const handleSave = async () => {
    if (!selectedClient || items.length === 0) { alert("Faltan datos"); return; }
    const payload = {
        clienteId: parseInt(selectedClient),
        empresaId: parseInt(selectedCompanyId),
        nombreQuienCotiza: user.username,
        items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precio: i.precio }))
    };
    try {
      if (isEditMode) await api.put(`/quotations/${id}`, payload);
      else await api.post('/quotations', payload);
      alert("Guardado exitosamente");
      navigate('/cotizaciones');
    } catch (error) { alert("Error al guardar"); }
  };

  if (loading) return <div className="p-5 text-center">Cargando...</div>;

  // ... (imports y lógica igual que antes) ...

  return (
    <div>
      {/* ENCABEZADO */}
      <div className="d-flex align-items-center mb-4 no-print"> {/* Clase no-print para que no salga en papel */}
        <Button variant="link" onClick={() => navigate('/cotizaciones')} className="text-secondary p-0 me-3">
            <ArrowLeft size={24} />
        </Button>
        <h2 className="text-inst-blue fw-bold mb-0">
            {isEditMode ? 'Editar Cotización' : 'Nueva Cotización'}
        </h2>
      </div>

      <Row>
        {/* COLUMNA IZQUIERDA: FORMULARIOS (Inputs) */}
        <Col lg={5} className="no-print"> {/* Ocultamos todo esto al imprimir */}
          
          {/* Tarjeta de Configuración (Empresa / Cliente) */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h6 className="text-inst-blue fw-bold mb-3">Configuración</h6>
              {/* ... Tus inputs de Empresa y Cliente ... */}
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted fw-bold">EMPRESA</Form.Label>
                <div className="d-flex flex-column gap-2">
                    {companies.map(c => (
                        <div key={c.EmpresaID} onClick={() => setSelectedCompanyId(c.EmpresaID)}
                            className={`p-3 rounded border cursor-pointer d-flex justify-content-between ${selectedCompanyId === c.EmpresaID ? 'border-inst-blue bg-light' : ''}`}>
                            <span className="fw-bold text-dark">{c.Nombre}</span>
                            {selectedCompanyId === c.EmpresaID && <span className="text-inst-blue">●</span>}
                        </div>
                    ))}
                </div>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold">CLIENTE</Form.Label>
                <Form.Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {clients.map(c => <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>)}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Tarjeta de Agregar Items */}
          <Card className={`shadow-sm border-0 mb-4 ${editingIndex >= 0 ? 'border-warning border-2' : ''}`}>
            <Card.Body>
              {/* ... Tus inputs de Producto, Cantidad, Precio ... */}
              <div className="d-flex justify-content-between mb-2">
                  <h6 className="fw-bold">{editingIndex >= 0 ? 'EDITAR ITEM' : 'AGREGAR ITEM'}</h6>
                  {editingIndex >= 0 && <Button size="sm" variant="link" onClick={() => {setEditingIndex(-1); setCurrentProduct(null);}}>Cancelar</Button>}
              </div>
              <Row className="g-2">
                <Col md={12}><Select options={productOptions} value={currentProduct} onChange={setCurrentProduct} placeholder="Buscar..." /></Col>
                <Col md={6}><Form.Control type="number" value={quantity} onChange={e => setQuantity(e.target.value)} /></Col>
                <Col md={6}><Form.Control type="number" value={price} onChange={e => setPrice(e.target.value)} /></Col>
                <Col md={12} className="mt-2"><Button variant={editingIndex >= 0 ? "warning" : "outline-primary"} className="w-100 fw-bold" onClick={handleAddItem}>{editingIndex >= 0 ? 'Actualizar' : 'Agregar'}</Button></Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lista de Items Agregados */}
          <Card className="shadow-sm border-0 mb-4">
             <Card.Body>
                <h6 className="text-muted small fw-bold mb-3">ITEMS ({items.length})</h6>
                {items.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                        <div className="small"><div className="fw-bold">{item.nombre}</div><div className="text-muted">{item.cantidad} x ${parseFloat(item.precio).toFixed(2)}</div></div>
                        <div className="d-flex gap-2"><Button variant="link" className="text-primary p-0" onClick={() => handleEditItem(idx)}><Edit2 size={16}/></Button><Button variant="link" className="text-danger p-0" onClick={() => handleRemoveItem(idx)}><Trash2 size={16}/></Button></div>
                    </div>
                ))}
             </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        <Col lg={7}>
          <Card className="shadow border-0 h-100">
            {/* Header con Botones (Oculto al imprimir) */}
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center no-print">
              <h6 className="mb-0 fw-bold text-secondary">Vista Previa</h6>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => window.print()} disabled={items.length === 0}>
                    <Printer size={16} className="me-2" /> Imprimir
                </Button>
                <Button className="btn-institutional" size="sm" onClick={handleSave} disabled={items.length === 0}>
                    <Save size={16} /> Guardar
                </Button>
              </div>
            </Card.Header>
            
            <Card.Body className="bg-secondary bg-opacity-10 d-flex justify-content-center overflow-auto p-4">
              <div className="shadow bg-white" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                
                {/* DIV ESPECIAL: Este es el único que se verá al imprimir */}
                <div className="printable-content">
                    <QuotationPDF data={pdfData} />
                </div>

              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateQuotation;