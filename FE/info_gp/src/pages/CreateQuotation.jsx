import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { Plus, Printer, Save, ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select'; 
import { useReactToPrint } from 'react-to-print'; // <--- CAMBIO 1: Importamos la librería correcta
import Swal from 'sweetalert2';
import QuotationPDF from '../componets/QuotationPDF';

const CreateQuotation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  // Referencia para la impresión (apunta al componente oculto)
  const printRef = useRef(null);

  // Estados de Datos
  const [clients, setClients] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]); 
  const [companies, setCompanies] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [nextId, setNextId] = useState(0);
  
  // Formulario Encabezado
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState('');
  
  // Formulario Items
  const [currentProduct, setCurrentProduct] = useState(null); 
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(true);

  // Datos calculados para el PDF (se usan tanto en vista previa como en impresión)
  const clientData = clients.find(c => c.ClienteID === selectedClient?.value);
  const companyData = companies.find(c => c.EmpresaID === parseInt(selectedCompanyId));
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'XX';
  const displayId = nextId ? nextId.toString().padStart(6, '0') : '000000';
  const quoteNumber = `${initials}-${displayId}`; 

  const pdfData = { 
      cliente: clientData, 
      items, 
      user, 
      numeroCotizacion: quoteNumber, 
      fecha: new Date(), 
      fechaEntrega,
      empresa: companyData,
      vendedor: selectedSeller?.data || null
  };

  // --- CONFIGURACIÓN DE IMPRESIÓN (CAMBIO 2) ---
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Apuntamos a la referencia del div oculto
    documentTitle: `Cotizacion-${quoteNumber}`,
  });

  // Carga Inicial
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resClients, resProducts, resNext, resCompanies, resSellers] = await Promise.all([
            api.get('/clients'),
            api.get('/products'),
            api.get('/quotations/next-number'),
            api.get('/companies'),
            api.get('/auth/sellers')
        ]);

        setClients(resClients.data);
        setCompanies(resCompanies.data);
        setSellers(resSellers.data);
        
        // Establecer el usuario actual como vendedor por defecto
        const currentUserSeller = resSellers.data.find(s => 
          s.Username === user?.username || s.UsuarioID === user?.id
        );
        
        if (currentUserSeller) {
          setSelectedSeller({
            value: currentUserSeller.UsuarioID,
            label: `${currentUserSeller.Username} (${currentUserSeller.NombreRol === 'sudo' ? 'Administrador' : 'Operador'})`,
            data: currentUserSeller
          });
        }
        
        const clientOpts = resClients.data.map(c => ({
            value: c.ClienteID,
            label: c.NombreCliente,
            data: c
        }));
        setClientOptions(clientOpts);
        
        const options = resProducts.data.map(p => ({
            value: p.ProductoID,
            label: `${p.CodigoProducto} - ${p.Nombre}`,
            data: p 
        }));
        setProductOptions(options);

        // SIEMPRE usar el siguiente ID disponible
        setNextId(resNext.data.nextId);
        if (resCompanies.data.length > 0) setSelectedCompanyId(resCompanies.data[0].EmpresaID);

        if (isEditMode) {
            const resQuote = await api.get(`/quotations/${id}`);
            const q = resQuote.data;
            
            const clientOpt = clientOpts.find(opt => opt.value === q.ClienteID);
            setSelectedClient(clientOpt || null);
            setSelectedCompanyId(q.EmpresaID);
            setFechaEntrega(q.FechaEntregaEstimada ? q.FechaEntregaEstimada.split('T')[0] : '');
            
            // Cargar vendedor si existe
            if (q.VendedorID) {
              const vendorData = resSellers.data.find(s => s.UsuarioID === q.VendedorID);
              if (vendorData) {
                setSelectedSeller({
                  value: vendorData.UsuarioID,
                  label: `${vendorData.Username} (${vendorData.NombreRol === 'sudo' ? 'Administrador' : 'Operador'})`,
                  data: vendorData
                });
              }
            }
            
            setItems(q.items.map(i => ({
                productoId: i.ProductoID,
                codigo: i.CodigoProducto,
                nombre: i.NombreProducto,
                descripcion: i.Descripcion,
                imagenURL: i.ImagenURL,
                cantidad: i.Cantidad,
                precio: i.PrecioUnitario
            })));
        }
        
        setLoading(false);
      } catch (error) { console.error(error); }
    };
    loadData();
  }, [isEditMode, id]);

  // --- MANEJO DE ITEMS ---
  const handleAddItem = () => {
    if (!currentProduct || quantity <= 0 || price < 0) return;
    
    const newItem = {
      productoId: currentProduct.value,
      codigo: currentProduct.data.CodigoProducto,
      nombre: currentProduct.data.Nombre,
      descripcion: currentProduct.data.Descripcion,
      imagenURL: `http://localhost:5000/api/products/image/${currentProduct.value}`,
      cantidad: parseInt(quantity),
      precio: parseFloat(price)
    };

    if (editingIndex >= 0) {
        const updated = [...items];
        updated[editingIndex] = newItem;
        setItems(updated);
        setEditingIndex(-1);
    } else {
        setItems([...items, newItem]);
    }
    // Reset
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

  // Guardar
  const handleSave = async () => {
    if (!selectedClient || items.length === 0) { 
        Swal.fire('Faltan datos', 'Seleccione cliente y agregue productos', 'warning');
        return; 
    }
    
    const payload = {
        clienteId: selectedClient.value,
        empresaId: parseInt(selectedCompanyId),
        nombreQuienCotiza: user.username,
        telefonoSnapshot: clientData?.Telefono,
        atencionASnapshot: clientData?.AtencionA,
        direccionSnapshot: clientData?.DireccionCalle,
        items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precio: i.precio })),
        fechaEntrega: fechaEntrega || null,
        vendedorId: selectedSeller?.value || null
    };

    try {
      await api.post('/quotations', payload);
      
      if (isEditMode) {
        Swal.fire({
          title: 'Nueva versión creada',
          text: 'Se ha guardado como una NUEVA cotización. La cotización original se mantiene sin cambios.',
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
      } else {
        Swal.fire('Éxito', 'Cotización creada correctamente', 'success');
      }
      
      navigate('/cotizaciones');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar', 'error');
    }
  };

  if (loading) return <div className="p-5 text-center">Cargando formulario...</div>;

  return (
    <div>
      <div className="d-flex align-items-center mb-4 no-print">
        <Button variant="link" onClick={() => navigate('/cotizaciones')} className="text-secondary p-0 me-3"><ArrowLeft size={24} /></Button>
        <div>
          <h2 className="text-inst-blue fw-bold mb-0">{isEditMode ? 'Nueva versión de Cotización' : 'Nueva Cotización'}</h2>
          {isEditMode && <small className="text-muted">Se creará una nueva cotización basada en la original</small>}
        </div>
      </div>

      <Row>
        {/* COLUMNA IZQUIERDA: FORMULARIOS */}
        <Col lg={5} className="no-print">
          
          {/* Configuración General */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h6 className="text-inst-blue fw-bold mb-3">Datos Generales</h6>
              
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted fw-bold">EMPRESA EMISORA</Form.Label>
                <div className="d-flex flex-column gap-2">
                    {companies.map(c => (
                        <div key={c.EmpresaID} onClick={() => setSelectedCompanyId(c.EmpresaID)}
                            className={`p-3 rounded border cursor-pointer d-flex justify-content-between align-items-center transition-all ${selectedCompanyId === c.EmpresaID ? 'border-inst-blue bg-light shadow-sm' : 'border-light'}`}
                            style={{cursor: 'pointer'}}>
                            <span className={`fw-bold ${selectedCompanyId === c.EmpresaID ? 'text-inst-blue' : 'text-secondary'}`}>{c.Nombre}</span>
                            {selectedCompanyId === c.EmpresaID && <span className="text-inst-blue">●</span>}
                        </div>
                    ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small text-muted fw-bold">CLIENTE</Form.Label>
                <Select 
                  options={clientOptions} 
                  value={selectedClient} 
                  onChange={setSelectedClient} 
                  placeholder="Buscar cliente..." 
                  isClearable
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small text-muted fw-bold">VENDEDOR / QUIEN COTIZA</Form.Label>
                <Select 
                  options={sellers.map(s => ({
                    value: s.UsuarioID,
                    label: `${s.Username} (${s.NombreRol === 'sudo' ? 'Administrador' : 'Operador'})`,
                    data: s
                  }))}
                  value={selectedSeller} 
                  onChange={setSelectedSeller} 
                  placeholder="Seleccionar vendedor..." 
                  isClearable
                />
                {selectedSeller && (
                  <Form.Text className="text-muted">
                    Tipo: {selectedSeller.data.TipoVendedor || 'No especificado'}
                  </Form.Text>
                )}
              </Form.Group>

            </Card.Body>
          </Card>

          {/* Agregar Productos */}
          <Card className={`shadow-sm border-0 mb-4 ${editingIndex >= 0 ? 'border-warning border-2' : ''}`}>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                  <h6 className="fw-bold mb-0">{editingIndex >= 0 ? 'EDITAR ITEM' : 'AGREGAR ITEM'}</h6>
                  {editingIndex >= 0 && <Button size="sm" variant="link" onClick={() => {setEditingIndex(-1); setCurrentProduct(null);}}>Cancelar</Button>}
              </div>
              <Row className="g-2">
                <Col md={12}>
                    <Select options={productOptions} value={currentProduct} onChange={setCurrentProduct} placeholder="Buscar producto..." />
                </Col>
                <Col md={6}><Form.Control type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Cant" /></Col>
                <Col md={6}><Form.Control type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="$$" /></Col>
                <Col md={12} className="mt-2">
                    <Button variant={editingIndex >= 0 ? "warning" : "outline-primary"} className="w-100 fw-bold" onClick={handleAddItem}>
                        {editingIndex >= 0 ? <><Edit2 size={18}/> Actualizar</> : <><Plus size={18}/> Agregar</>}
                    </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lista Items */}
          <Card className="shadow-sm border-0 mb-4">
             <Card.Body>
                <h6 className="text-muted small fw-bold mb-3">ITEMS ({items.length})</h6>
                {items.map((item, idx) => (
                    <div key={idx} className={`d-flex justify-content-between align-items-center border-bottom pb-2 mb-2 ${editingIndex === idx ? 'bg-light p-2 rounded' : ''}`}>
                        <div className="small">
                            <div className="fw-bold">{item.nombre}</div>
                            <div className="text-muted">{item.cantidad} x ${parseFloat(item.precio).toFixed(2)}</div>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="link" className="text-primary p-0" onClick={() => handleEditItem(idx)}><Edit2 size={16}/></Button>
                            <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveItem(idx)}><Trash2 size={16}/></Button>
                        </div>
                    </div>
                ))}
             </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        <Col lg={7}>
          <Card className="shadow border-0 h-100">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center no-print">
              <h6 className="mb-0 fw-bold text-secondary">Vista Previa Documento</h6>
              <div className="d-flex gap-2">
                {/* CAMBIO 3: El botón ahora llama al handlePrint de react-to-print */}
                <Button variant="outline-secondary" size="sm" onClick={handlePrint} disabled={items.length === 0}>
                    <Printer size={16} className="me-2" /> Imprimir / Descargar
                </Button>
                <Button className="btn-institutional" size="sm" onClick={handleSave} disabled={items.length === 0}>
                    <Save size={16} className="me-2" /> Guardar
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="bg-secondary bg-opacity-10 d-flex justify-content-center overflow-auto p-4">
              
              {/* VISTA EN PANTALLA (ESCALADA) */}
              {/* Nota: NO le ponemos ref={printRef} a esto para evitar que se imprima pequeño */}
              <div className="shadow bg-white" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                  <QuotationPDF key={`preview-${selectedSeller?.value || 'none'}`} data={pdfData} />
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CAMBIO 4: COMPONENTE OCULTO PARA IMPRESIÓN */}
      {/* Este div está oculto en la pantalla, pero react-to-print tomará su contenido para generar el PDF a tamaño real */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <QuotationPDF key={`print-${selectedSeller?.value || 'none'}`} data={pdfData} />
        </div>
      </div>

    </div>
  );
};

export default CreateQuotation;