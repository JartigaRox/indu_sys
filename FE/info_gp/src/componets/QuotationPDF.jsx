import React from 'react';

const API_URL = "http://localhost:5000/api";

const QuotationPDF = ({ data }) => {
  if (!data || !data.empresa) {
    return (
      <div className="p-5 text-center text-muted border m-3">
        <p className="mb-0">Cargando datos del documento...</p>
      </div>
    );
  }

  const { cliente, items, user, numeroCotizacion, fecha, empresa } = data;
  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

  // --- DISEÑO 1: EMPRESA AZUL ---
  const HeaderStyleA = () => (
    <div className="row mb-4 pb-4 border-bottom" style={{ borderColor: '#003366' }}>
      <div className="col-7">
         <img 
            src={`${API_URL}/companies/logo/${empresa.EmpresaID}`} 
            alt={empresa.Nombre}
            style={{ maxHeight: '80px', marginBottom: '15px', objectFit: 'contain', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }}
         />
         <h2 className="fw-bold text-uppercase m-0" style={{ color: '#003366', fontSize: '24px' }}>
            {empresa.Nombre}
         </h2>
         <div className="text-secondary small mt-2" style={{ lineHeight: '1.5' }}>
           <div>{empresa.Direccion}</div>
           <div>NRC: {empresa.NRC} | Tel: {empresa.Telefono}</div>
           <div>{empresa.CorreoElectronico}</div>
         </div>
      </div>
      <div className="col-5 text-end d-flex flex-column justify-content-center ps-4">
         <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px' }}>
             <h3 className="fw-bold mb-2" style={{ color: '#003366', letterSpacing: '1px' }}>COTIZACIÓN</h3>
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

  // --- DISEÑO 2: EMPRESA DORADA ---
  const HeaderStyleB = () => (
    <div className="mb-5 text-center">
      <img src={`${API_URL}/companies/logo/${empresa.EmpresaID}`} alt="Logo" style={{ height: '80px', marginBottom: '10px' }} onError={(e)=>e.target.style.display='none'}/>
      <h2 className="fw-light text-uppercase" style={{ letterSpacing: '4px', color: '#D4AF37' }}>{empresa.Nombre}</h2>
      <hr className="mx-auto" style={{ width: '50px', backgroundColor: '#D4AF37', height: '2px' }} />
      <p className="small text-muted">{empresa.Direccion} | {empresa.Telefono}</p>
      <div className="row mt-4 border-top border-bottom py-3" style={{ borderColor: '#D4AF37' }}>
        <div className="col-6 text-start fw-bold text-muted text-uppercase small">Cotización: <span className="fs-5 text-dark d-block">#{numeroCotizacion}</span></div>
        <div className="col-6 text-end fw-bold text-muted text-uppercase small">Fecha: <span className="fs-5 text-dark d-block">{new Date(fecha).toLocaleDateString()}</span></div>
      </div>
    </div>
  );

  const mainColor = empresa.EmpresaID === 1 ? '#003366' : '#D4AF37';

  return (
    // CAMBIO 1: Quitamos altura fija, dejamos que crezca (h-auto)
    <div className="p-5 bg-white h-auto" style={{ width: '100%', fontFamily: 'Arial, sans-serif', fontSize: '12px', color: 'black' }}>
      
      {empresa.EmpresaID === 1 ? <HeaderStyleA /> : <HeaderStyleB />}

      {/* CLIENTE */}
      <div className="row mb-4 mt-4">
        <div className="col-12"><h6 className="fw-bold text-uppercase border-bottom pb-1 mb-2" style={{ color: mainColor, borderColor: mainColor }}>Cliente</h6></div>
        <div className="col-7">
            {cliente ? (
                <>
                    <p className="fw-bold mb-0 fs-5 text-dark">{cliente.NombreCliente}</p>
                    <p className="mb-0 text-muted">
                        {cliente.DireccionCalle || ''} 
                        {cliente.Municipio ? `, ${cliente.Municipio}` : ''}
                    </p>
                </>
            ) : (
                <p className="text-muted fst-italic">-- Seleccione un cliente --</p>
            )}
        </div>
        <div className="col-5 text-end">
            <p className="mb-0"><strong>Atención:</strong> {cliente?.AtencionA || 'N/A'}</p>
            <p className="mb-0"><strong>Vendedor:</strong> {user?.username}</p>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <table className="table table-striped mt-4 w-100" style={{ borderColor: mainColor }}>
        <thead style={{ backgroundColor: mainColor, color: 'white' }}>
          <tr>
            <th className="text-center py-2" style={{ width: '80px' }}>Producto</th>
            <th className="text-center py-2" style={{ width: '50px' }}>Cant.</th>
            <th className="py-2">Descripción</th>
            <th className="text-end py-2" style={{ width: '100px' }}>Precio</th>
            <th className="text-end py-2" style={{ width: '100px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            // CAMBIO 2: 'break-inside-avoid' evita que la fila se corte a la mitad entre páginas
            <tr key={i} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <td className="text-center align-middle py-2">
                <img 
                    src={`${API_URL}/products/image/${item.productoId}`} 
                    style={{ 
                        width: '60px', height: '60px', 
                        objectFit: 'contain', background: '#fff', 
                        border: '1px solid #eee', borderRadius: '4px' 
                    }} 
                    onError={(e)=>e.target.src='https://via.placeholder.com/60?text=IMG'} 
                    alt="prod"
                />
              </td>
              <td className="text-center fw-bold align-middle fs-6">{item.cantidad}</td>
              <td className="align-middle">
                <span className="d-block fw-bold fs-6 text-dark mb-1">{item.nombre}</span>
                <span className="badge bg-light text-secondary border fw-normal">CÓD: {item.codigo}</span>
              </td>
              <td className="text-end align-middle fw-bold text-secondary">
                ${parseFloat(item.precio).toFixed(2)}
              </td>
              <td className="text-end align-middle fw-bold fs-6 text-dark">
                ${(item.cantidad * item.precio).toFixed(2)}
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-muted">Sin items.</td></tr>}
        </tbody>
      </table>

      {/* TOTALES (Evitamos que se rompa el bloque de totales) */}
      <div className="row justify-content-end mb-4" style={{ pageBreakInside: 'avoid' }}>
        <div className="col-5 col-md-4">
            <div className="d-flex justify-content-between p-3 text-white fw-bold fs-4 rounded shadow-sm" style={{ background: mainColor }}>
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
            </div>
        </div>
      </div>

      {/* CAMBIO 3: FOOTER RELATIVO (Se va al final del contenido, no fijo abajo) */}
      <div className="mt-5 pt-4 text-center small text-muted border-top" style={{ borderColor: '#eee', pageBreakInside: 'avoid' }}>
        <p className="fw-bold mb-0 text-uppercase" style={{ color: mainColor }}>{empresa.Nombre}</p>
        <p className="mb-1">{empresa.PaginaWeb} | {empresa.CorreoElectronico}</p>
        <p className="fst-italic" style={{ fontSize: '11px' }}>
            Válido por 15 días. Sujeto a disponibilidad.
        </p>
      </div>

    </div>
  );
};

export default QuotationPDF;