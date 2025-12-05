import React from 'react';

const API_URL = "http://localhost:5000/api";

export const QuotationPDF = React.forwardRef(({ data }, ref) => {
  const { cliente, items, user, numeroCotizacion, fecha, empresa } = data;
  
  if (!empresa) {
    return <div ref={ref} className="p-5 text-center">Cargando...</div>;
  }

  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

  // ==========================================================================
  // DISEÑO 1: EMPRESA A (AZUL) - CORREGIDO (Más ancho)
  // ==========================================================================
  const HeaderStyleA = () => (
    <div className="row mb-5 pb-4 border-bottom" style={{ borderColor: '#003366' }}>
      
      {/* IZQUIERDA: DATOS DE EMPRESA (Reducido a col-6 para equilibrar) */}
      <div className="col-6">
         <img 
            src={`${API_URL}/companies/logo/${empresa.EmpresaID}`} 
            alt={empresa.Nombre}
            style={{ maxHeight: '80px', marginBottom: '15px' }}
            onError={(e) => { e.target.style.display = 'none'; }}
         />
         <h2 className="fw-bold text-uppercase m-0" style={{ color: '#003366', fontSize: '24px' }}>
            {empresa.Nombre}
         </h2>
         <div className="text-secondary small mt-2" style={{ lineHeight: '1.6' }}>
           <div><strong>Dirección:</strong> {empresa.Direccion}</div>
           <div><strong>NCR:</strong> {empresa.NRC} &nbsp;|&nbsp; <strong>Tel:</strong> {empresa.Telefono}</div>
           <div><strong>Email:</strong> {empresa.CorreoElectronico}</div>
         </div>
      </div>

      {/* DERECHA: CAJA DE COTIZACIÓN (Aumentado a col-6) */}
      <div className="col-6 text-end d-flex flex-column justify-content-center ps-3">
         <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px' }}>
             
             {/* TÍTULO BLINDADO: whiteSpace: 'nowrap' evita que se corte */}
             <h3 className="fw-bold mb-3 m-0" style={{ color: '#003366', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                COTIZACIÓN
             </h3>
             
             <div className="mb-2">
                <span className="text-uppercase small fw-bold text-muted me-2">NÚMERO:</span>
                <span className="fw-bold fs-4 text-dark" style={{ whiteSpace: 'nowrap' }}>
                    #{numeroCotizacion}
                </span>
             </div>

             <div>
                <span className="text-uppercase small fw-bold text-muted me-2">FECHA:</span>
                <span className="fs-6 text-dark" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(fecha).toLocaleDateString()}
                </span>
             </div>
         </div>
      </div>
    </div>
  );

  // ==========================================================================
  // DISEÑO 2: EMPRESA B (DORADO)
  // ==========================================================================
  const HeaderStyleB = () => (
    <div className="mb-5">
      <div className="text-center mb-4">
        <h2 className="fw-light text-uppercase tracking-widest" style={{ letterSpacing: '4px', color: '#D4AF37' }}>
            {empresa.Nombre}
        </h2>
        <div style={{ width: '50px', height: '2px', backgroundColor: '#D4AF37', margin: '10px auto' }}></div>
        <p className="small text-muted mb-0">{empresa.Direccion} &bull; {empresa.PaginaWeb}</p>
        <p className="small text-muted">NCR: {empresa.NRC} &bull; Tel: {empresa.Telefono}</p>
      </div>
      
      <div className="row bg-light py-3 border-top border-bottom" style={{ borderColor: '#D4AF37' }}>
        <div className="col-6 text-start ps-4">
            <span className="text-uppercase small fw-bold text-muted">Documento:</span><br/>
            <span className="fs-5" style={{ whiteSpace: 'nowrap' }}>#{numeroCotizacion}</span>
        </div>
        <div className="col-6 text-end pe-4">
            <span className="text-uppercase small fw-bold text-muted">Fecha:</span><br/>
            <span className="fs-5">{new Date(fecha).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  const mainColor = empresa.EmpresaID === 1 ? '#003366' : '#D4AF37';

  return (
    <div ref={ref} className="p-5" style={{ width: '100%', color: 'black', backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
      
      {empresa.EmpresaID === 1 ? <HeaderStyleA /> : <HeaderStyleB />}

      {/* DATOS DEL CLIENTE */}
      <div className="row mb-5 mt-4">
        <div className="col-12">
            <h6 className="fw-bold text-uppercase border-bottom mb-3 pb-1" style={{ color: mainColor, fontSize: '13px', borderColor: mainColor }}>
                Datos del Cliente
            </h6>
        </div>
        <div className="col-7">
            {cliente ? (
                <>
                    <p className="mb-1 fw-bold fs-5 text-dark">{cliente.NombreCliente}</p>
                    {(cliente.DireccionCalle || cliente.Municipio) && (
                        <p className="mb-1 small text-muted">
                            {cliente.DireccionCalle}, {cliente.Municipio}, {cliente.Departamento}
                        </p>
                    )}
                    {cliente.Telefono && <p className="mb-0 small text-muted">Tel: {cliente.Telefono}</p>}
                </>
            ) : <p className="text-muted">...</p>}
        </div>
        <div className="col-5 text-end">
            <div className="mb-1"><strong>Atención a:</strong> {cliente?.AtencionA || 'N/A'}</div>
            <div><strong>Ejecutivo:</strong> {user?.username}</div>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS (Imagen Grande) */}
      <table className="table mb-4 table-striped border-top" style={{ borderColor: mainColor }}>
        <thead style={{ backgroundColor: mainColor, color: 'white' }}>
          <tr>
            <th className="py-3 text-center" style={{ width: '100px' }}>Producto</th>
            <th className="py-3 text-center" style={{ width: '60px' }}>Cant.</th>
            <th className="py-3">Descripción</th>
            <th className="text-end py-3">Precio</th>
            <th className="text-end py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} style={{ verticalAlign: 'middle' }}>
              <td className="text-center py-3">
                <img 
                  src={`${API_URL}/products/image/${item.productoId}`} 
                  alt="x" 
                  style={{ 
                      width: '200px', 
                      height: '200px', 
                      objectFit: 'contain',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      border: '1px solid #dee2e6'
                  }}
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/80?text=IMG"; }}
                />
              </td>
              <td className="text-center fw-bold fs-5">{item.cantidad}</td>
              <td>
                <span className="d-block fw-bold mb-1" style={{ fontSize: '1.1em' }}>{item.nombre}</span>
                <span className="small text-muted bg-light px-2 rounded border">CÓD: {item.codigo}</span>
              </td>
              <td className="text-end fw-bold">${parseFloat(item.precio).toFixed(2)}</td>
              <td className="text-end fw-bold fs-5">${(item.cantidad * item.precio).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALES */}
      <div className="d-flex justify-content-end">
        <div style={{ width: '250px' }}>
          <div className="d-flex justify-content-between p-3 text-white rounded" style={{ backgroundColor: mainColor }}>
            <span className="fw-bold fs-5">TOTAL:</span>
            <span className="fw-bold fs-4">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed-bottom p-5 text-center small text-muted" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <hr style={{ borderColor: mainColor }} />
        <p className="fw-bold mb-0">{empresa.Nombre}</p>
        <p>{empresa.PaginaWeb} | {empresa.CorreoElectronico}</p>
      </div>

    </div>
  );
});

export default QuotationPDF;