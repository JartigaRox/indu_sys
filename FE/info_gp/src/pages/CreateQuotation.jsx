import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { Plus, Printer, Save, ArrowLeft, Trash2, Edit2, RotateCcw } from 'lucide-react'; // Nuevos íconos
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Select from 'react-select'; 
import QuotationPDF from '../componets/QuotationPDF';

const CreateQuotation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); 
  const componentRef = useRef(); // Referencia para el PDF

  const isEditMode = !!id;

  // Estados Datos
  const [clients, setClients] = useState([]);
  const [productOptions, setProductOptions] = useState([]); 
  const [companies, setCompanies] = useState([]);
  const [nextId, setNextId] = useState(0);
  
  // Estados Formulario Cabecera
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  
  // Estados Formulario Items
  const [currentProduct, setCurrentProduct] = useState(null); 
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [editingIndex, setEditingIndex] = useState(-1); // <--- NUEVO: Índice del item que se edita (-1 = ninguno)
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hook de impresión (Configuración Reforzada)
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Cotizacion',
    onAfterPrint: () => console.log("Impresión finalizada"),
    removeAfterPrint: true
  });

  // Carga Inicial
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
        }

      } catch (error) {
        console.error("Error cargando catálogos", error);
      }
    };
    loadData();
  }, [isEditMode]);

  // Cargar Cotización para Editar
  useEffect(() => {
    if (isEditMode && clients.length > 0 && productOptions.length > 0) {
        const loadQuote = async () => {
            try {
                const res = await api.get(`/quotations/${id}`);
                const q = res.data;

                setSelectedClient(q.ClienteID);
                setSelectedCompanyId(q.EmpresaID);
                
                // Mapear items
                const mappedItems = q.items.map(i => ({
                    productoId: i.ProductoID,
                    codigo: i.CodigoProducto,
                    nombre: i.NombreProducto,
                    cantidad: i.Cantidad,
                    precio: i.PrecioUnitario
                }));
                setItems(mappedItems);
                
                const numParts = q.NumeroCotizacion.split('-');
                if (numParts.length > 1) {
                    setNextId(parseInt(numParts[numParts.length - 1]));
                }

                setLoading(false);
            } catch (error) {
                console.error("Error cargando cotización", error);
                navigate('/cotizaciones');
            }
        };
        loadQuote();
    }
  }, [isEditMode, id, clients, productOptions]);

  // --- LÓGICA DE CARRITO (AGREGAR / EDITAR) ---

  const addItem = () => {
    if (!currentProduct || quantity <= 0 || price < 0) return;

    const newItem = {
      productoId: currentProduct.value,
      codigo: currentProduct.data.CodigoProducto,
      nombre: currentProduct.data.Nombre,
      cantidad: parseInt(quantity),
      precio: parseFloat(price)
    };

    if (editingIndex >= 0) {
        // MODO ACTUALIZAR: Reemplazamos el item en la posición editingIndex
        const updatedItems = [...items];
        updatedItems[editingIndex] = newItem;
        setItems(updatedItems);
        cancelEdit(); // Salimos del modo edición
    } else {
        // MODO AGREGAR: Lo ponemos al final
        setItems([...items, newItem]);
        resetItemForm();
    }
  };

  const editItem = (index) => {
    const item = items[index];
    // Buscamos el producto en las opciones para llenar el Select correctamente
    const productOption = productOptions.find(p => p.value === item.productoId);
    
    setCurrentProduct(productOption);
    setQuantity(item.cantidad);
    setPrice(item.precio);
    setEditingIndex(index); // Activamos modo edición para este índice
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit(); // Si borras el que estás editando, limpia el form
  };

  const cancelEdit = () => {
    setEditingIndex(-1);
    resetItemForm();
  };

  const resetItemForm = () => {
    setQuantity(1);
    setPrice(0);
    setCurrentProduct(null);
  };

  // --- PREPARAR DATOS PDF ---
  const clientData = clients.find(c => c.ClienteID === parseInt(selectedClient));
  const companyData = companies.find(c => c.EmpresaID === parseInt(selectedCompanyId));
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'XX';
  
  // Lógica segura para mostrar el número
  const displayId = nextId ? nextId.toString().padStart(6, '0') : '000000';
  const quoteNumber = `${initials}-${displayId}`;

  const pdfData = {
    cliente: clientData,
    items: items,
    user: user,
    numeroCotizacion: quoteNumber,
    fecha: new Date(),
    empresa: companyData 
  };

  // --- GUARDAR EN BD ---
  const handleSave = async () => {
    if (!selectedClient || items.length === 0) {
      alert("Faltan datos (Cliente o Productos)");
      return;
    }

    const payload = {
        clienteId: parseInt(selectedClient),
        empresaId: parseInt(selectedCompanyId),
        nombreQuienCotiza: user.username,
        telefonoSnapshot: clientData?.Telefono,
        atencionASnapshot: clientData?.AtencionA,
        direccionSnapshot: clientData?.DireccionCalle,
        items: items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precio: i.precio
        }))
    };

    try {
      if (isEditMode) {
          await api.put(`/quotations/${id}`, payload);
          alert("Cotización actualizada correctamente");
      } else {
          await api.post('/quotations', payload);
          alert("Cotización creada exitosamente");
      }
      navigate('/cotizaciones');
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  if (loading) return <div className="p-5 text-center">Cargando...</div>;

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" onClick={() => navigate('/cotizaciones')} className="text-secondary p-0 me-3">
          <ArrowLeft size={24} />
        </Button>
        <h2 className="text-inst-blue fw-bold mb-0">
            {isEditMode ? 'Editar Cotización' : 'Nueva Cotización'}
        </h2>
      </div>

      <Row>
        <Col lg={5}>
          {/* CONFIGURACIÓN */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h6 className="text-inst-blue fw-bold mb-3">Datos Generales</h6>
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted fw-bold">EMPRESA EMISORA</Form.Label>
                <div className="d-flex flex-column gap-2">
                    {companies.map(comp => (
                        <div 
                            key={comp.EmpresaID} 
                            onClick={() => setSelectedCompanyId(comp.EmpresaID)}
                            className={`p-3 rounded border cursor-pointer d-flex align-items-center justify-content-between transition-all ${selectedCompanyId === comp.EmpresaID ? 'border-inst-blue bg-light shadow-sm' : 'border-light'}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className={`fw-bold ${selectedCompanyId === comp.EmpresaID ? 'text-inst-blue' : 'text-secondary'}`}>
                                {comp.Nombre}
                            </span>
                            {selectedCompanyId === comp.EmpresaID && <div className="text-inst-blue">●</div>}
                        </div>
                    ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small text-muted fw-bold">CLIENTE</Form.Label>
                <Form.Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {clients.map(c => (
                    <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* FORMULARIO ITEMS (Doble propósito: Agregar o Editar) */}
          <Card className={`shadow-sm border-0 mb-4 ${editingIndex >= 0 ? 'border-warning border-2' : ''}`}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className={`fw-bold mb-0 ${editingIndex >= 0 ? 'text-warning' : 'text-inst-blue'}`}>
                      {editingIndex >= 0 ? 'Editar Item' : 'Agregar Items'}
                  </h6>
                  {editingIndex >= 0 && (
                      <Button variant="link" size="sm" className="text-muted p-0" onClick={cancelEdit}>
                          <RotateCcw size={14} /> Cancelar
                      </Button>
                  )}
              </div>
              
              <Row className="g-2">
                <Col md={12}>
                  <Form.Group className="mb-2">
                    <Select
                        options={productOptions}
                        value={currentProduct}
                        onChange={(selected) => setCurrentProduct(selected)}
                        placeholder="Buscar producto..."
                        isSearchable={true}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Control type="number" placeholder="Cant." min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </Col>
                <Col md={6}>
                  <Form.Control type="number" placeholder="Precio" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </Col>
                <Col md={12} className="mt-2">
                  <Button 
                    variant={editingIndex >= 0 ? "warning" : "outline-primary"} 
                    className="w-100 text-white fw-bold" 
                    onClick={addItem}
                  >
                    {editingIndex >= 0 ? <><Edit2 size={18} /> Actualizar Item</> : <><Plus size={18} /> Agregar</>}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* LISTA DE ITEMS */}
          <Card className="shadow-sm border-0 mb-4">
             <Card.Body>
                <h6 className="text-muted small fw-bold mb-3">ITEMS AGREGADOS ({items.length})</h6>
                {items.length === 0 ? (
                    <p className="text-muted small fst-italic">La lista está vacía.</p>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {items.map((item, idx) => (
                            <div key={idx} className={`d-flex justify-content-between align-items-center border-bottom pb-2 ${editingIndex === idx ? 'bg-light p-2 rounded' : ''}`}>
                                <div className="small">
                                    <div className="fw-bold">{item.nombre}</div>
                                    <div className="text-muted">{item.cantidad} x ${item.precio}</div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="link" className="text-inst-blue p-0" onClick={() => editItem(idx)}>
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button variant="link" className="text-danger p-0" onClick={() => removeItem(idx)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </Card.Body>
          </Card>
        </Col>

        {/* VISTA PREVIA */}
        <Col lg={7}>
          <Card className="shadow border-0 h-100">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-secondary">Vista Previa Documento</h6>
              <div className="d-flex gap-2">
                {/* BOTÓN IMPRIMIR CORREGIDO */}
                <Button variant="outline-secondary" size="sm" onClick={handlePrint} disabled={items.length === 0}>
                  <Printer size={16} className="me-1" /> Imprimir / PDF
                </Button>
                <Button className="btn-institutional" size="sm" onClick={handleSave} disabled={items.length === 0}>
                  <Save size={16} className="me-1" /> {isEditMode ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="bg-secondary bg-opacity-10 d-flex justify-content-center overflow-auto p-4">
              <div className="shadow bg-white" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                {/* COMPONENTE CON REFERENCIA CORRECTA */}
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