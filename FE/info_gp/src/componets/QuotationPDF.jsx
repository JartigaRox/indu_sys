import React from 'react';

// Ajusta esto si tu backend cambia de puerto/IP
const API_URL = "http://localhost:5000/api";

const QuotationPDF = ({ data }) => {
  // 1. Protección inicial: Si no hay datos, mostramos un aviso simple.
  if (!data || !data.empresa) {
    return (
      <div className="p-5 text-center text-muted border m-3">
        <p className="mb-0">Esperando datos para generar la vista previa...</p>
      </div>
    );
  }

  const { cliente, items, user, numeroCotizacion, fecha, empresa } = data;
  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

  // --- DISEÑO 1: EMPRESA A (AZUL / INDUSTRIAL) ---
  const HeaderStyleA = () => (
    <div className="row mb-5 pb-4 border-bottom" style={{ borderColor: '#003366' }}>
      <div className="col-7">
         {/* Logo de la empresa desde BD */}
         <img 
            src={`${API_URL}/companies/logo/${empresa.EmpresaID}`} 
            alt={empresa.Nombre}
            style={{ 
                maxHeight: '100px', 
                marginBottom: '15px', 
                objectFit: 'contain', 
                display: 'block' 
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
         />
         
         <h2 className="fw-bold text-uppercase m-0" style={{ color: '#003366', fontSize: '26px' }}>
            {empresa.Nombre}
         </h2>
         
         <div className="text-secondary small mt-3" style={{ lineHeight: '1.6', fontSize: '13px' }}>
           <div><strong>Dirección:</strong> {empresa.Direccion}</div>
           <div><strong>NCR:</strong> {empresa.NCR} &nbsp;|&nbsp; <strong>Tel:</strong> {empresa.Telefono}</div>
           <div><strong>Email:</strong> {empresa.CorreoElectronico}</div>
           <div><strong>Web:</strong> {empresa.PaginaWeb}</div>
         </div>
      </div>

      <div className="col-5 text-end d-flex flex-column justify-content-center ps-4">
         <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px' }}>
             <h3 className="fw-bold mb-2" style={{ color: '#003366', letterSpacing: '1px', fontSize: '22px' }}>
                COTIZACIÓN
             </h3>
             {/* whiteSpace: nowrap asegura que el número NUNCA se corte */}
             <div className="fs-4 fw-bold text-dark" style={{ whiteSpace: 'nowrap' }}>
                #{numeroCotizacion}
             </div>
             <div className="text-muted small mt-1">
                Fecha: {new Date(fecha).toLocaleDateString()}
             </div>
         </div>
      </div>
    </div>
  );

  // --- DISEÑO 2: EMPRESA B (DORADO / CONSULTORÍA) ---
  const HeaderStyleB = () => (
    <div className="mb-5 text-center">
      <img 
        src={`${API_URL}/companies/logo/${empresa.EmpresaID}`} 
        alt="Logo" 
        style={{ height: '90px', marginBottom: '15px', objectFit: 'contain' }} 
        onError={(e)=>e.target.style.display='none'}
      />
      <h2 className="fw-light text-uppercase" style={{ letterSpacing: '4px', color: '#D4AF37', fontSize: '28px' }}>
        {empresa.Nombre}
      </h2>
      <div className="mx-auto my-3" style={{ width: '60px', backgroundColor: '#D4AF37', height: '3px' }}></div>
      
      <p className="small text-muted mb-0">{empresa.Direccion} | {empresa.PaginaWeb}</p>
      <p className="small text-muted">Tel: {empresa.Telefono}</p>

      <div className="row mt-4 border-top border-bottom py-3" style={{ borderColor: '#D4AF37' }}>
        <div className="col-6 text-start">
            <span className="text-uppercase small fw-bold text-muted">Cotización Nº</span><br/>
            <span className="fs-4 text-dark d-block" style={{ whiteSpace: 'nowrap' }}>#{numeroCotizacion}</span>
        </div>
        <div className="col-6 text-end">
            <span className="text-uppercase small fw-bold text-muted">Fecha Emisión</span><br/>
            <span className="fs-5 text-dark d-block">{new Date(fecha).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  // Definir color principal según empresa
  const mainColor = empresa.EmpresaID === 1 ? '#003366' : '#D4AF37';

  return (
    // CONTENEDOR PRINCIPAL TIPO HOJA DE PAPEL
    <div className="p-5 bg-white h-100" style={{ fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '14px' }}>
      
      {/* 1. HEADER DINÁMICO */}
      {empresa.EmpresaID === 1 ? <HeaderStyleA /> : <HeaderStyleB />}

      {/* 2. INFORMACIÓN DEL CLIENTE */}
      <div className="row mb-4 mt-5">
        <div className="col-12">
            <h6 className="fw-bold text-uppercase border-bottom pb-2 mb-3" style={{ color: mainColor, borderColor: mainColor }}>
                Información del Cliente
            </h6>
        </div>
        <div className="col-7">
            {cliente ? (
                <>
                    <p className="fw-bold mb-1 fs-5 text-dark">{cliente.NombreCliente}</p>
                    <p className="mb-1 text-muted">
                        {cliente.DireccionCalle || ''} 
                        {cliente.Municipio ? `, ${cliente.Municipio}` : ''}
                        {cliente.Departamento ? `, ${cliente.Departamento}` : ''}
                    </p>
                    {cliente.Telefono && <p className="mb-0 small text-muted">Tel: {cliente.Telefono}</p>}
                </>
            ) : (
                <p className="text-muted fst-italic">-- Seleccione un cliente --</p>
            )}
        </div>
        <div className="col-5 text-end">
            <div className="mb-2">
                <span className="d-block small fw-bold text-uppercase" style={{ color: mainColor }}>Atención a:</span>
                <span>{cliente?.AtencionA || 'Encargado de Compras'}</span>
            </div>
            <div>
                <span className="d-block small fw-bold text-uppercase" style={{ color: mainColor }}>Ejecutivo:</span>
                <span>{user?.username}</span>
            </div>
        </div>
      </div>

      {/* 3. TABLA DE PRODUCTOS */}
      <table className="table table-striped mt-4 mb-4" style={{ borderColor: mainColor }}>
        <thead style={{ backgroundColor: mainColor, color: 'white' }}>
          <tr>
            <th className="text-center py-3" style={{ width: '100px' }}>Producto</th>
            <th className="text-center py-3" style={{ width: '80px' }}>Cant.</th>
            <th className="py-3">Descripción</th>
            <th className="text-end py-3" style={{ width: '120px' }}>Precio</th>
            <th className="text-end py-3" style={{ width: '120px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ verticalAlign: 'middle' }}>
              {/* IMAGEN GRANDE (80px) */}
              <td className="text-center py-3">
                <img 
                    src={`${API_URL}/products/image/${item.productoId}`} 
                    style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'contain', 
                        backgroundColor: '#fff', 
                        border: '1px solid #dee2e6',
                        borderRadius: '4px' 
                    }} 
                    onError={(e)=>e.target.src='https://via.placeholder.com/80?text=SIN+IMG'} 
                    alt="prod"
                />
              </td>
              
              <td className="text-center fw-bold fs-5">{item.cantidad}</td>
              
              <td>
                <span className="d-block fw-bold fs-6 text-dark mb-1">{item.nombre}</span>
                <span className="badge bg-light text-secondary border fw-normal">CÓD: {item.codigo}</span>
              </td>
              
              <td className="text-end fw-bold text-secondary">
                ${parseFloat(item.precio).toFixed(2)}
              </td>
              
              <td className="text-end fw-bold fs-5 text-dark">
                ${(item.cantidad * item.precio).toFixed(2)}
              </td>
            </tr>
          ))}
          
          {items.length === 0 && (
              <tr><td colSpan="5" className="text-center py-5 text-muted">No hay productos agregados a la cotización.</td></tr>
          )}
        </tbody>
      </table>

      {/* 4. TOTALES */}
      <div className="row justify-content-end mb-5">
        <div className="col-6 col-md-4">
            <div className="d-flex justify-content-between p-3 text-white fw-bold fs-4 rounded shadow-sm" style={{ backgroundColor: mainColor }}>
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
            </div>
        </div>
      </div>

      {/* 5. PIE DE PÁGINA (Fijo al final) */}
      <div className="fixed-bottom p-5 text-center small text-muted" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <hr style={{ borderColor: mainColor, opacity: 1 }} />
        <p className="fw-bold mb-1 text-uppercase" style={{ color: mainColor }}>{empresa.Nombre}</p>
        <p className="mb-0">{empresa.PaginaWeb} &bull; {empresa.CorreoElectronico}</p>
        <p className="mt-2 fst-italic" style={{ fontSize: '11px' }}>
            Esta cotización tiene una validez de 15 días a partir de su fecha de emisión. Precios incluyen IVA.
        </p>
      </div>

    </div>
  );
};

export default QuotationPDF;