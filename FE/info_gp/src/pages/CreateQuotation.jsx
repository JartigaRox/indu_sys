import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { Plus, Printer, Save, ArrowLeft, Trash2, Edit2, Copy } from 'lucide-react'; // Agregué icono Copy
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select'; 
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import QuotationPDF from '../componets/QuotationPDF';

const CreateQuotation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Usamos el ID solo para "cargar datos base", no para editar el registro existente
  const isCloneMode = !!id; 
  
  const printRef = useRef(null);

  const [clients, setClients] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]); 
  const [companies, setCompanies] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [nextId, setNextId] = useState(0);
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  
  const [currentProduct, setCurrentProduct] = useState(null); 
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [customDescription, setCustomDescription] = useState(""); 
  
  // Estado para los términos y condiciones editables
  const [terms, setTerms] = useState(""); 

  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(true);

  const normalizeText = (text) => text ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

  const filterClientOption = (option, inputValue) => {
    const input = normalizeText(inputValue);
    return normalizeText(option.label).includes(input) || normalizeText(option.data?.direccion || '').includes(input);
  };

  const filterProductOption = (option, inputValue) => {
    const input = normalizeText(inputValue);
    return normalizeText(option.label).includes(input) || 
           normalizeText(option.data?.descripcion || '').includes(input) || 
           normalizeText(option.data?.categoria || '').includes(input);
  };

  const clientData = clients.find(c => c.ClienteID === selectedClient?.value);
  const companyData = companies.find(c => c.EmpresaID === parseInt(selectedCompanyId));
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'XX';
  
  // Siempre mostramos el "Siguiente ID" porque SIEMPRE vamos a crear una nueva
  const displayId = nextId ? nextId.toString().padStart(6, '0') : '000000';
  const quoteNumber = `${initials}-${displayId}`; 

  const pdfData = { 
    cliente: clientData, 
    items, 
    user, 
    numeroCotizacion: quoteNumber, 
    fecha: new Date(), 
    empresa: companyData, 
    vendedor: selectedSeller?.data || null,
    terminos: terms 
  };

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Cotizacion-${quoteNumber}` });

  // Efecto para cargar el texto por defecto de los términos cuando cambia la empresa
  useEffect(() => {
    if (selectedCompanyId && companies.length > 0) {
      const comp = companies.find(c => c.EmpresaID === parseInt(selectedCompanyId));
      
      if (comp) {
        const defaultTerms = `NOTA: EN CASO DE DETECTARSE ERRORES ARITMÉTICOS EN LOS CÁLCULOS, LA COTIZACIÓN SERÁ CORREGIDA Y ACTUALIZADA DE INMEDIATO, NOTIFICANDO AL CLIENTE. LOS VALORES CORRECTOS PREVALECERÁN SOBRE CUALQUIER ERROR TIPOGRÁFICO O DE CÁLCULO. LA ACEPTACIÓN DE ESTA COTIZACIÓN IMPLICA EL RECONOCIMIENTO DE ESTA CONDICIÓN. LAS IMÁGENES SON DE FIN ILUSTRATIVO, SUJETAS A CAMBIOS.
GARANTÍA: 1 AÑO POR DESPERFECTO DE FABRICACIÓN VALIDEZ DE LA OFERTA: 7 DÍAS CALENDARIO PRECIO INCLUYE IVA Y TRANSPORTE
CONDICIÓN DE PAGO: CHEQUE O AL CONTADO
CHEQUE A NOMBRE DE: JEREMÍAS DE JESÚS ARTIGA DE PAZ
RAZÓN SOCIAL: JEREMÍAS DE JESÚS ARTIGA DE PAZ
CONTACTO DE LA EMPRESA:
DIRECCIÓN: {{DIRECCION}}
TELÉFONO: {{TELEFONO}}
NIT: {{NIT}}
Registro: {{NRC}}`;
        
        // Solo ponemos el default si está vacío (carga inicial)
        if(terms === "") {
             setTerms(defaultTerms);
        }
      }
    }
  }, [selectedCompanyId, companies]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const fetchSafely = async (request, fallback) => {
        try { const res = await request; return res.data; } catch (e) { console.error(e); return fallback; }
      };

      try {
        const [clientsData, productsData, nextIdData, companiesData, sellersData] = await Promise.all([
            fetchSafely(api.get('/clients'), []),
            fetchSafely(api.get('/products'), []),
            fetchSafely(api.get('/quotations/next-number'), { nextId: 0 }),
            fetchSafely(api.get('/companies'), []),
            fetchSafely(api.get('/auth/sellers'), [])
        ]);

        setClients(clientsData); setCompanies(companiesData); setSellers(sellersData); setNextId(nextIdData.nextId);
        
        setClientOptions(clientsData.map(c => ({ value: c.ClienteID, label: c.NombreCliente, direccion: c.DireccionCalle || '', data: c })));
        setProductOptions(productsData.map(p => ({ value: p.ProductoID, label: `${p.CodigoProducto} - ${p.Nombre}`, descripcion: p.Descripcion || '', categoria: p.Categoria || '', data: p })));

        const currentUserSeller = sellersData.find(s => s.Username === user?.username || s.UsuarioID === user?.id);
        if (currentUserSeller) setSelectedSeller({ value: currentUserSeller.UsuarioID, label: `${currentUserSeller.Username} (${currentUserSeller.NombreRol === 'sudo' ? 'Admin' : 'Op'})`, data: currentUserSeller });

        if (companiesData.length > 0) setSelectedCompanyId(companiesData[0].EmpresaID);

        // Si hay ID en la URL, cargamos los datos para PRE-LLENAR el formulario (Clonar)
        if (isCloneMode) {
            try {
                const resQuote = await api.get(`/quotations/${id}`);
                const q = resQuote.data;
                const clientOpt = clientsData.find(c => c.ClienteID === q.ClienteID);
                if (clientOpt) setSelectedClient({ value: clientOpt.ClienteID, label: clientOpt.NombreCliente, direccion: clientOpt.DireccionCalle || '', data: clientOpt });
                
                setSelectedCompanyId(q.EmpresaID);
                if (q.VendedorID) {
                  const vendor = sellersData.find(s => s.UsuarioID === q.VendedorID);
                  if (vendor) setSelectedSeller({ value: vendor.UsuarioID, label: `${vendor.Username} (${vendor.NombreRol === 'sudo' ? 'Admin' : 'Op'})`, data: vendor });
                }
                
                setItems(q.items.map(i => ({
                    productoId: i.ProductoID, codigo: i.CodigoProducto, nombre: i.NombreProducto,
                    descripcion: i.Descripcion || '', imagenURL: i.ImagenURL, cantidad: i.Cantidad, precio: i.PrecioUnitario
                })));

                if (q.Terminos) {
                    setTerms(q.Terminos);
                }

                // NOTA: NO seteamos nextId con el ID de la cotización vieja, 
                // queremos mantener el ID nuevo que trajimos de 'next-number'.

            } catch (error) { Swal.fire('Error', 'Error cargando datos de la cotización base', 'error'); }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    loadData();
  }, [isCloneMode, id]); // Dependencias del efecto

  const handleAddItem = () => {
    if (!currentProduct) return Swal.fire('Error', 'Seleccione un producto', 'error');
    if (quantity <= 0 || price < 0) return Swal.fire('Error', 'Valores incorrectos', 'warning');
    
    const newItem = {
      productoId: currentProduct.value, codigo: currentProduct.data.CodigoProducto,
      nombre: currentProduct.data.Nombre, descripcion: customDescription, 
      imagenURL: `http://localhost:5000/api/products/image/${currentProduct.value}`,
      cantidad: parseInt(quantity), precio: parseFloat(price)
    };

    const updated = editingIndex >= 0 ? [...items] : [...items];
    if (editingIndex >= 0) { updated[editingIndex] = newItem; setEditingIndex(-1); } 
    else updated.push(newItem);
    
    setItems(updated); setQuantity(1); setPrice(0); setCurrentProduct(null); setCustomDescription(""); 
  };

  const handleEditItem = (index) => {
    const item = items[index];
    let prodOption = productOptions.find(p => String(p.value) === String(item.productoId));
    
    if (!prodOption) {
        prodOption = { value: item.productoId, label: `${item.codigo} - ${item.nombre} (Externo)`, data: { CodigoProducto: item.codigo, Nombre: item.nombre, Descripcion: item.descripcion }};
    }

    setCurrentProduct(prodOption); setQuantity(item.cantidad); setPrice(item.precio);
    setCustomDescription(item.descripcion ? String(item.descripcion) : ""); 
    setEditingIndex(index);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) { 
        setEditingIndex(-1); setQuantity(1); setPrice(0); setCurrentProduct(null); setCustomDescription("");
    }
  };

  const handleSave = async () => {
    if (!selectedClient || items.length === 0) return Swal.fire('Faltan datos', 'Seleccione cliente y productos', 'warning');
    
    const payload = {
      clienteId: selectedClient.value, empresaId: parseInt(selectedCompanyId), nombreQuienCotiza: user.username,
      telefonoSnapshot: clientData?.Telefono, atencionASnapshot: clientData?.AtencionA, direccionSnapshot: clientData?.DireccionCalle,
      items, vendedorId: selectedSeller?.value || null,
      terminos: terms 
    };

    try {
      // --- CAMBIO PRINCIPAL AQUÍ ---
      // Siempre usamos POST (Crear), ignorando si venimos de un ID existente.
      // Esto crea una nueva cotización basada en los datos de la anterior.
      await api.post('/quotations', payload);
      
      Swal.fire('Éxito', 'Nueva cotización guardada exitosamente', 'success');
      navigate('/cotizaciones');
    } catch (error) { Swal.fire('Error', 'No se pudo guardar', 'error'); }
  };

  if (loading) return <div className="p-5 text-center">Cargando...</div>;

  return (
    <div>
      <div className="d-flex align-items-center mb-4 no-print">
        <Button variant="link" onClick={() => navigate('/cotizaciones')} className="text-secondary p-0 me-3"><ArrowLeft size={24} /></Button>
       <div>
        <h2 className="text-inst-blue fw-bold mb-0">
            {isCloneMode ? 'Nueva Cotización' : 'Nueva Cotización'}
        </h2>
        {isCloneMode && (
                <div className="text-muted fst-italic" style={{ fontSize: '1rem', marginTop: '2px' }}>
                    Se creará una nueva cotización basada en la original.
                </div>
            )}
            </div>
      </div>
      <Row>
        <Col lg={5} className="no-print">
          {/* 1. SELECCIÓN DE CLIENTE Y EMPRESA */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>EMPRESA</Form.Label>
                <div className="d-flex gap-2">
                    {companies.map(c => (
                        <div key={c.EmpresaID} onClick={() => setSelectedCompanyId(c.EmpresaID)} className={`p-2 border rounded cursor-pointer ${selectedCompanyId === c.EmpresaID ? 'bg-light border-primary fw-bold' : ''}`}>{c.Nombre}</div>
                    ))}
                </div>
              </Form.Group>
              <Form.Group className="mb-3"><Form.Label>CLIENTE</Form.Label><Select options={clientOptions} value={selectedClient} onChange={setSelectedClient} filterOption={filterClientOption}/></Form.Group>
              <Form.Group className="mb-3"><Form.Label>VENDEDOR</Form.Label><Select options={sellers.map(s => ({ value: s.UsuarioID, label: s.Username, data: s }))} value={selectedSeller} onChange={setSelectedSeller}/></Form.Group>
            </Card.Body>
          </Card>
          
          {/* 2. AGREGAR PRODUCTO */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Row className="g-2">
                <Col md={12}>
                    <Select options={productOptions} value={currentProduct} onChange={(opt) => { setCurrentProduct(opt); setCustomDescription(opt ? opt.descripcion : ""); }} placeholder="Producto..." filterOption={filterProductOption}/>
                </Col>
                <Col md={12}><Form.Control as="textarea" rows={3} value={customDescription} onChange={(e) => setCustomDescription(e.target.value)}/></Col>
                <Col md={6}><Form.Control type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Cant" /></Col>
                <Col md={6}><Form.Control type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="$$" /></Col>
                <Col md={12}><Button className="w-100" onClick={handleAddItem}>{editingIndex >= 0 ? "Actualizar Item" : "Agregar Item"}</Button></Col>
              </Row>
            </Card.Body>
          </Card>

          {/* 3. LISTA DE PRODUCTOS */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
                {items.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between border-bottom pb-2 mb-2">
                        <div className="small w-75"><div className="fw-bold">{item.nombre}</div><div className="text-muted">{String(item.descripcion).substring(0,50)}...</div></div>
                        <div><Button variant="link" onClick={() => handleEditItem(idx)}><Edit2 size={16}/></Button><Button variant="link" className="text-danger" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 size={16}/></Button></div>
                    </div>
                ))}
            </Card.Body>
          </Card>

          {/* 4. EDITOR DE TÉRMINOS */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
                <Form.Label className="fw-bold">Términos y Condiciones (Para impresión)</Form.Label>
                <Form.Control 
                    as="textarea" 
                    rows={8} 
                    value={terms} 
                    onChange={(e) => setTerms(e.target.value)}
                    style={{ fontSize: '11px', lineHeight: '1.2' }}
                />
                <Form.Text className="text-muted">
                    Puede editar el texto que aparecerá al final del PDF.
                </Form.Text>
            </Card.Body>
          </Card>

        </Col>
        <Col lg={7}>
          <Card className="shadow h-100">
            <Card.Header className="d-flex justify-content-end gap-2 no-print align-items-center">
                <Button variant="outline-secondary" size="sm" onClick={handlePrint}><Printer size={16}/> Imprimir</Button>
                {/* Botón Guardar - Ahora siempre dice Guardar Nueva */}
                <Button className="btn-institutional" size="sm" onClick={handleSave}>
                    <Save size={16}/> {isCloneMode ? 'Guardar' : 'Guardar'}
                </Button>
            </Card.Header>
            <Card.Body className="bg-light d-flex justify-content-center overflow-auto p-4">
              <div className="shadow bg-white" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.75)', transformOrigin: 'top center' }}><QuotationPDF data={pdfData} /></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <div style={{ display: 'none' }}><div ref={printRef}><QuotationPDF data={pdfData} /></div></div>
    </div>
  );
};
export default CreateQuotation;