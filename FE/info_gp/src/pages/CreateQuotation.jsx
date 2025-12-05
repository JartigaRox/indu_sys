import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { Plus, Printer, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Select from 'react-select'; 
import QuotationPDF from '../componets/QuotationPDF';

const CreateQuotation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const componentRef = useRef();

  // Estados de Datos
  const [clients, setClients] = useState([]);
  const [productOptions, setProductOptions] = useState([]); 
  const [companies, setCompanies] = useState([]); // <--- ESTADO PARA EMPRESAS
  const [nextId, setNextId] = useState(0);
  
  // Estados del Formulario
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null); // <--- ID SELECCIONADO
  
  // Estados Item Actual
  const [currentProduct, setCurrentProduct] = useState(null); 
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  
  const [items, setItems] = useState([]);

  // Cargar todo al inicio
  useEffect(() => {
    const loadData = async () => {
      try {
        const resClients = await api.get('/clients');
        const resProducts = await api.get('/products');
        const resNext = await api.get('/quotations/next-number');
        const resCompanies = await api.get('/companies'); // <--- CARGAR EMPRESAS

        setClients(resClients.data);
        setNextId(resNext.data.nextId);
        setCompanies(resCompanies.data);
        
        // Seleccionar la primera empresa por defecto si existe
        if (resCompanies.data.length > 0) {
            setSelectedCompanyId(resCompanies.data[0].EmpresaID);
        }

        const options = resProducts.data.map(p => ({
            value: p.ProductoID,
            label: `${p.CodigoProducto} - ${p.Nombre}`,
            data: p 
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
    setQuantity(1);
    setPrice(0);
    setCurrentProduct(null); 
  };

  // Preparar datos para el PDF
  const clientData = clients.find(c => c.ClienteID === parseInt(selectedClient));
  const companyData = companies.find(c => c.EmpresaID === parseInt(selectedCompanyId)); // <--- OBJETO EMPRESA COMPLETO
  
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'XX';
  const quoteNumber = `${initials}-${nextId.toString().padStart(6, '0')}`;

  const pdfData = {
    cliente: clientData,
    items: items,
    user: user,
    numeroCotizacion: quoteNumber,
    fecha: new Date(),
    empresa: companyData // <--- Pasamos TODA la info de la empresa (NCR, Web, etc)
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
        empresaId: parseInt(selectedCompanyId),
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
          {/* TARJETA CONFIGURACIÓN */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h6 className="text-inst-blue fw-bold mb-3">Emisor y Receptor</h6>
              
              {/* SELECTOR DE EMPRESA (Dinámico) */}
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
                            <div>
                                <span className={`fw-bold ${selectedCompanyId === comp.EmpresaID ? 'text-inst-blue' : 'text-secondary'}`}>
                                    {comp.Nombre}
                                </span>
                                <div className="small text-muted" style={{ fontSize: '0.8rem' }}>
                                    {comp.PaginaWeb}
                                </div>
                            </div>
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

          {/* TARJETA PRODUCTOS */}
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h6 className="text-inst-blue fw-bold mb-3">Agregar Items</h6>
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
                  <Button variant="outline-primary" className="w-100" onClick={addItem}>
                    <Plus size={18} /> Agregar
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* VISTA PREVIA */}
        <Col lg={7}>
          <Card className="shadow border-0 h-100">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-secondary">Vista Previa Documento</h6>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={handlePrint} disabled={items.length === 0}>
                  <Printer size={16} className="me-1" /> PDF
                </Button>
                <Button className="btn-institutional" size="sm" onClick={handleSave} disabled={items.length === 0}>
                  <Save size={16} className="me-1" /> Guardar
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="bg-secondary bg-opacity-10 d-flex justify-content-center overflow-auto p-4">
              <div className="shadow bg-white" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.75)', transformOrigin: 'top center' }}>
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