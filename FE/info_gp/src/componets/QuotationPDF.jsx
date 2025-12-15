import React, { forwardRef, useMemo } from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp, FaEnvelope, FaGlobe } from 'react-icons/fa';

const QuotationPDF = forwardRef(({ data }, ref) => {
  if (!data || !data.empresa) return null;

  const { cliente, items, user, numeroCotizacion, fecha, empresa, terminos } = data; 

  // Calcular total
  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

  const mainColor = empresa.EmpresaID === 1 ? '#008CB4' : '#D4AF37';

  // Generar timestamp único para refrescar la imagen de la firma si cambia
  const imageTimestamp = useMemo(() => Date.now(), [data.vendedor?.UsuarioID]);

  // --- FUNCIÓN HELPER PARA FORMATEAR MONEDA ---
  const formatNumber = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // --- 1. NUEVA FUNCIÓN PARA REEMPLAZAR ETIQUETAS ---
  // Esta función busca las "tags" en el texto y pone los datos reales de la empresa actual
  const processTermsText = (text, companyData) => {
    if (!text) return "";
    return text
      .replace(/{{TELEFONO}}/g, companyData.Telefono || '')
      .replace(/{{NIT}}/g, companyData.NIT || '')
      .replace(/{{NRC}}/g, companyData.NRC || '')
      .replace(/{{DIRECCION}}/g, companyData.Direccion || '')
      .replace(/{{EMPRESA}}/g, companyData.Nombre || '');
  };

  // --- 2. FUNCIÓN HELPER MODIFICADA PARA RENDERIZAR TÉRMINOS ---
  const renderTermsList = (rawTerms) => {
    if (!rawTerms) return null;
    
    // Primero procesamos el texto para cambiar {{TELEFONO}} por el número real
    const processedTerms = processTermsText(rawTerms, empresa);

    // Luego renderizamos línea por línea como antes
    return processedTerms.split('\n').map((line, idx) => {
        if (!line.trim()) return null;
        
        // Detectar si la línea tiene una "clave" al principio (ej: "NOTA:", "GARANTÍA:")
        const parts = line.split(':');
        const hasLabel = parts.length > 1 && parts[0].length < 30; // Heurística simple

        if (hasLabel) {
            const label = parts[0];
            const content = parts.slice(1).join(':');
            return (
                <li key={idx} className="mb-1">
                    <strong>{label}:</strong>{content}
                </li>
            );
        }
        
        return <li key={idx}>{line}</li>;
    });
  };

  // --- ESTILOS DE ENCABEZADO ---
  const HeaderStyleA = () => (
    <div className="d-flex justify-content-between align-items-start pb-2 mb-3" style={{ borderBottom: '2px solid #009FE3' }}>
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center mb-2">
          <div>
            <img src="/src/assets/IndusL.png" alt="Logo Info GP" style={{ width: '200px', height: 'auto', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          </div>
        </div>
        <h1 style={{ fontFamily: 'Times New Roman, serif', fontSize: '18px', color: '#222', margin: '0', textAlign: 'justify' }}>{empresa.Nombre}</h1>
        <h3 style={{ fontFamily: 'Times New Roman, serif', fontSize: '16px', color: '#555', margin: '0', textAlign: 'justify', width: '450px' }}>FABRICACION Y VENTA DE MUEBLES PARA OFICINA, ESCOLARES, HOSPITALARIOS, ACERO INOXIDABLE Y MÁS</h3>
      </div>
      <div className="text-end">
        <h2 className="fw-bold m-0" style={{ color: '#008CB4', fontSize: '24px' }}>COTIZACIÓN</h2>
        <div className="fw-bold text-secondary fs-5"># {numeroCotizacion}</div>
      </div>
    </div>
  );

  const HeaderStyleB = () => (
    <div className="d-flex justify-content-between align-items-start pb-2 mb-3" style={{ borderBottom: '2px solid #D4AF37' }}>
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center mb-2">
          <div>
            <img src="/src/assets/PoligL.png" alt="Logo Info GP" style={{ width: '200px', height: 'auto', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          </div>
        </div>
        <h1 style={{ fontFamily: 'Times New Roman, serif', fontSize: '18px', color: '#222', margin: '0', textAlign: 'justify' }}>{empresa.Nombre}</h1>
      </div>
      <div className="text-end">
        <h2 className="fw-bold m-0" style={{ color: '#D4AF37', fontSize: '24px' }}>COTIZACIÓN</h2>
        <div className="fw-bold text-secondary fs-5"># {numeroCotizacion}</div>
      </div>
    </div>
  );

  // --- ESTILOS DE PIE DE PÁGINA ---
  const FooterStyleA = () => (
    <div className="pt-2 border-top w-100" style={{ borderColor: '#005689', borderWidth: '3px' }}>
      <div className="d-flex justify-content-center text-dark mb-1" style={{ fontSize: '9px' }}>
        <div className="d-flex align-items-center"><FaMapMarkerAlt className="me-1" style={{ minWidth: '12px' }} /> <span>{empresa.Direccion}</span></div>
      </div>
      <div className="d-flex flex-wrap justify-content-center gap-3 text-dark" style={{ fontSize: '10px' }}>
        <div className="d-flex align-items-center"><FaPhoneAlt className="me-1" /> {empresa.Telefono}</div>
        <div className="d-flex align-items-center"><FaWhatsapp className="me-1" /> {empresa.Celular}</div>
        <div className="d-flex align-items-center"><FaEnvelope className="me-1" /> <span style={{ textTransform: 'lowercase' }}>{empresa.CorreoElectronico}</span></div>
        <div className="d-flex align-items-center"><FaGlobe className="me-1" /> <span style={{ textTransform: 'lowercase' }}> {empresa.PaginaWeb}</span></div>
      </div>
    </div>
  );

  const FooterStyleB = () => (
    <div className="pt-2 border-top w-100" style={{ borderColor: '#D4AF37', borderWidth: '3px' }}>
      <div className="d-flex justify-content-center text-dark mb-1" style={{ fontSize: '9px' }}>
        <div className="d-flex align-items-center"><FaMapMarkerAlt className="me-1" style={{ minWidth: '12px' }} /> <span>{empresa.Direccion}</span></div>
      </div>
      <div className="d-flex flex-wrap justify-content-center gap-3 text-dark" style={{ fontSize: '10px' }}>
        <div className="d-flex align-items-center"><FaPhoneAlt className="me-1" /> {empresa.Telefono}</div>
        <div className="d-flex align-items-center"><FaWhatsapp className="me-1" /> {empresa.Celular}</div>
        <div className="d-flex align-items-center"><FaEnvelope className="me-1" /> <span style={{ textTransform: 'lowercase' }}>{empresa.CorreoElectronico}</span></div>
        <div className="d-flex align-items-center"><FaGlobe className="me-1" /> <span style={{ textTransform: 'lowercase' }}> {empresa.PaginaWeb}</span></div>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className="bg-white p-4 pdf-container"
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: 'black', textTransform: 'uppercase' }}
    >
      <table className="print-table w-100">
        {/* 1. HEADER */}
        <thead>
          <tr>
            <td>
              <div className="header-space">
                {empresa.EmpresaID === 1 ? <HeaderStyleA /> : <HeaderStyleB />}
              </div>
            </td>
          </tr>
        </thead>

        {/* 2. CONTENIDO PRINCIPAL */}
        <tbody>
          <tr>
            <td>
              <div className="content-wrapper px-2">

                {/* Info Cliente */}
                <div className="row mb-4 avoid-break" style={empresa.EmpresaID === 2 ? { marginTop: '-40px' } : {}}>
                  <div className="col-12"><h6 className="fw-bold border-bottom pb-1" style={{ color: mainColor, borderColor: mainColor }}>CLIENTE</h6></div>
                  <div className="col-8">
                    <p className="mb-0 text small">Lourdes colón, {new Date(fecha).toLocaleDateString()}</p>
                    <p className="fw-bold mb-0 fs-6">{cliente?.NombreCliente}</p>
                    <p className="mb-0"><strong>Atención A:</strong> {cliente?.AtencionA || 'N/A'}</p>
                    <p className="mb-0 text small">{cliente?.Telefono}</p>
                    <p className="mb-0 text small">
                      {cliente?.DireccionCalle}
                      {cliente?.Distrito && `, ${cliente.Distrito}`}
                      {cliente?.Municipio && `, ${cliente.Municipio}`}
                      {cliente?.Departamento && `, ${cliente.Departamento}`}
                    </p>
                    <p className="mb-0 text small">PRESENTE</p>
                    <p className="mb-0 text small">NOS COMPLACE ENNVIARLE LA SIGUIENTE COTIZACIÓN PARA LOS SUMINISTROS DE:</p>
                  </div>
                </div>

                {/* Tabla de Items */}
                {items.map((item, i) => {
                  const rawDesc = item.descripcion ? String(item.descripcion) : "";
                  const descLines = [...new Set(rawDesc.split('\n').map(line => line.trim()).filter(line => line !== ''))];

                  return (
                    <table key={i} className="w-100 mb-4" style={{ border: '2px solid black', borderCollapse: 'collapse', pageBreakInside: 'avoid' }}>
                      <tbody>
                        {/* Headers */}
                        <tr>
                          <td className="fw-bold text-center align-middle" style={{ border: '1px solid black', width: '8%', padding: '8px', fontSize: '11px' }}>CAN</td>
                          <td className="fw-bold text-center align-middle" style={{ border: '1px solid black', width: '15%', padding: '8px', fontSize: '11px' }}>CÓDIGO</td>
                          <td className="fw-bold text-center align-middle" style={{ border: '1px solid black', width: '37%', padding: '8px', fontSize: '11px' }}>NOMBRE ÍTEM</td>
                          <td rowSpan="3" className="text-center align-middle" style={{ border: '1px solid black', width: '40%', padding: '8px' }}>
                            {item.imagenURL ? (
                              <img src={item.imagenURL} alt={item.nombre} style={{ width: '100%', maxWidth: '180px', height: 'auto', maxHeight: '180px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                            ) : (<div className="text-muted" style={{ fontSize: '11px' }}>N/A</div>)}
                          </td>
                        </tr>
                        {/* Valores */}
                        <tr>
                          <td className="text-center align-middle fw-bold" style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>{item.cantidad}</td>
                          <td className="text-center align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>{item.codigo || 'N/A'}</td>
                          <td className="text-center align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>{item.nombre || 'N/A'}</td>
                        </tr>
                        {/* Descripción */}
                        <tr>
                          <td colSpan="3" className="align-top" style={{ border: '1px solid black', padding: '12px' }}>
                            {descLines.length > 0 ? (
                              <ul className="mb-0 ps-3" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                {descLines.map((line, idx) => (<li key={idx}>{line.toUpperCase()}</li>))}
                              </ul>
                            ) : (<ul className="mb-0 ps-3" style={{ fontSize: '10px' }}><li>SIN DESCRIPCIÓN</li></ul>)}
                          </td>
                        </tr>
                        {/* Totales */}
                        <tr>
                          <td colSpan="2" className="fw-bold text-start ps-3 align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>PRECIO UNITARIO</td>
                          <td className="text-center align-middle fw-bold" style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>${formatNumber(item.precio)}</td>
                          <td className="align-middle" style={{ border: '1px solid black', padding: '8px' }}>
                            <div className="d-flex justify-content-between align-items-center px-2">
                              <span className="fw-bold" style={{ fontSize: '11px' }}>PRECIO TOTAL</span>
                              <span className="fw-bold" style={{ fontSize: '12px' }}>${formatNumber(item.cantidad * item.precio)}</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })}

                {/* Footer Total */}
                <div className="mt-4">
                  <div className="d-flex justify-content-end mb-5">
                    <div className="p-3 text-white fw-bold rounded shadow-sm" style={{ background: mainColor, minWidth: '250px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>TOTAL DE LA COTIZACION:  </span>
                      <span> <strong>${formatNumber(total)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Términos, Firmas y Sellos */}
                <div className="avoid-break">
                  <div className="text-secondary" style={{ fontSize: '10px', border: '1px solid #cccccc', borderRadius: '5px', backgroundColor: '#ffffff', padding: '35px' }}>
                    <div className="row m-0">
                      {/* Términos y Condiciones */}
                      <div className="col-8">
                        <h6 className="fw-bold mb-2 text-dark">TÉRMINOS Y CONDICIONES:</h6>
                        <ul className="ps-3 mb-0" style={{ listStyleType: 'circle' }}>
                          {/* AQUI RENDERIZAMOS LOS TERMINOS DINAMICOS */}
                          {renderTermsList(terminos)}
                        </ul>
                      </div>

                      {/* Firmas y Sellos */}
                      <div className="col-4 text-center" style={{ height: '230px', position: 'relative', marginTop: '60px' }}>
                        {/* Capa 1: Sello */}
                        <div style={{ position: 'absolute', top: '-5px', right: '20px', zIndex: 0, opacity: 0.8 }}>
                          {empresa.EmpresaID === 1 ? (
                            <img src="../../src/assets/SelloInds.jpg" alt="Sello Empresa 1" style={{ width: '90px', objectFit: 'contain', mixBlendMode: 'multiply' }} onError={(e) => e.target.style.display = 'none'} />
                          ) : (
                            <img src="../../src/assets/SelloPlgn.jpg" alt="Sello Empresa 2" style={{ width: '90px', objectFit: 'contain', mixBlendMode: 'multiply' }} onError={(e) => e.target.style.display = 'none'} />
                          )}
                        </div>
                        {/* Capa 2: Firma */}
                        <div className="d-flex flex-column justify-content-end align-items-center h-100" style={{ position: 'relative', zIndex: 1 }}>
                          {data.vendedor?.UsuarioID ? (
                            <div className="mb-0" style={{ minHeight: '90px', display: 'flex', alignItems: 'flex-end' }}>
                              <img
                                key={data.vendedor.UsuarioID}
                                src={`http://localhost:5000/api/auth/users/${data.vendedor.UsuarioID}/signature?t=${imageTimestamp}`}
                                alt="Firma"
                                style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div className="mb-0" style={{ minHeight: '60px' }}></div>
                          )}
                          <div style={{ borderBottom: '1px solid #999', width: '80%', marginBottom: '10px' }}></div>
                          <span className="fw-bold text-uppercase small">Firma y Sello Autorizado</span>
                          <span className="small text-muted">{data.vendedor?.Username || user.username}</span>
                          <span className="small text-muted">{empresa.Celular}</span>
                          <span className="small text-muted" style={{ textTransform: 'lowercase' }}>{empresa.CorreoElectronico}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </td>
          </tr>
        </tbody>

        {/* 3. FOOTER SPACE */}
        <tfoot>
          <tr><td><div className="footer-space"></div></td></tr>
        </tfoot>
      </table>

      {/* 4. FOOTER FIXED */}
      <div className="print-footer-fixed d-flex align-items-end justify-content-center pb-3">
        {empresa.EmpresaID === 1 ? <FooterStyleA /> : <FooterStyleB />}
      </div>
    </div>
  );
});

export default QuotationPDF;