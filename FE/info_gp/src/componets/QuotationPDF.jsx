import React, { forwardRef } from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp, FaEnvelope, FaGlobe } from 'react-icons/fa';

const API_URL = "http://localhost:5000/api";

const QuotationPDF = forwardRef(({ data }, ref) => {
  if (!data || !data.empresa) return null;

  const { cliente, items, user, numeroCotizacion, fecha, fechaEntrega, empresa } = data;
  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
  const mainColor = empresa.EmpresaID === 1 ? '#005689' : '#D4AF37';

  // --- COMPONENTES INTERNOS ---
  const HeaderStyleA = () => (
    <div className="d-flex justify-content-between align-items-start pb-2 mb-3" style={{ borderBottom: '2px solid #009FE3' }}>
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center mb-2">
          <div>
            <img 
              src="../../src/assets/IndusL.png" 
              alt="Logo Info GP" 
              style={{ width: '200px', height: 'auto', objectFit: 'contain' }} 
            />
          </div>
        </div>
        <h1 style={{ fontFamily: 'Times New Roman, serif', fontSize: '18px', color: '#222', margin: '0', textAlign: 'justify' }}>{empresa.Nombre}</h1>
        <h3 style={{ fontFamily: 'Times New Roman, serif', fontSize: '16px', color: '#555', margin: '0', textAlign: 'justify', width: '450px' }}>FABRICACION Y VENTA DE MUEBLES PARA OFICINA, ESCOLARES, HOSPITALARIOS, ACERO INOXIDABLE Y MÁS</h3>
      </div>
      <div className="text-end">
        <h2 className="fw-bold m-0" style={{ color: '#008CB4', fontSize: '24px' }}>COTIZACIÓN</h2>
        <div className="fw-bold text-secondary fs-5"># {numeroCotizacion}</div>
        <div className="small">Fecha: {new Date(fecha).toLocaleDateString()}</div>
      </div>
    </div>
  );

  const HeaderStyleB = () => (
    <div className="mb-4 text-center">
       {/* ... Tu diseño para empresa 2 ... */}
       <h2 style={{color: mainColor}}>{empresa.Nombre}</h2>
    </div>
  );

  const FooterStyleA = () => (
    <div className="pt-2 border-top w-100" style={{ borderColor: '#005689', borderWidth: '3px', borderStyle: 'solid' }}>
      <div className="d-flex flex-wrap justify-content-center gap-3 text-dark" style={{ fontSize: '10px' }}>
         <div className="d-flex align-items-center"><FaMapMarkerAlt className="me-1"/> {empresa.Direccion}</div>
         <div className="d-flex align-items-center"><FaPhoneAlt className="me-1"/> {empresa.Telefono}</div>
         <div className="d-flex align-items-center"><FaEnvelope className="me-1"/> <span style={{textTransform:'lowercase'}}>{empresa.CorreoElectronico}</span></div>
      </div>
    </div>
  );

  return (
    // IMPORTANTE: Quitamos p-5 del contenedor principal para manejar márgenes con @page
    <div 
      ref={ref} 
      className="bg-white"
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: 'black', textTransform: 'uppercase' }}
    >
      <table className="print-table w-100">
        {/* 1. HEADER (Se repite en cada página) */}
        <thead>
          <tr>
            <td>
              <div className="header-space">
                {empresa.EmpresaID === 1 ? <HeaderStyleA /> : <HeaderStyleB />}
              </div>
            </td>
          </tr>
        </thead>

        {/* 2. CONTENIDO (Fluye página tras página) */}
        <tbody>
          <tr>
            <td>
              <div className="content-wrapper px-2">
                
                {/* Info Cliente */}
                <div className="row mb-4 avoid-break">
                  <div className="col-12"><h6 className="fw-bold border-bottom pb-1" style={{ color: mainColor, borderColor: mainColor }}>CLIENTE</h6></div>
                  <div className="col-8">
                    <p className="fw-bold mb-0 fs-6">{cliente?.NombreCliente}</p>
                    <p className="mb-0 text-muted small">{cliente?.DireccionCalle}</p>
                  </div>
                  <div className="col-4 text-end">
                    <p className="mb-0"><strong>Atención:</strong> {cliente?.AtencionA || 'N/A'}</p>
                    <p className="mb-0"><strong>Vendedor:</strong> {user?.username}</p>
                  </div>
                </div>

                {/* Tabla Items */}
                <table className="table table-striped w-100 mb-4" style={{ borderColor: mainColor }}>
                  <thead style={{ backgroundColor: mainColor, color: 'white' }}>
                    <tr>
                      <th className="py-1 ps-2 text-start">Cant.</th>
                      <th className="py-1 text-start">Descripción</th>
                      <th className="text-end py-1">Precio</th>
                      <th className="text-end py-1 pe-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                        <td className="text-start ps-2 fw-bold">{item.cantidad}</td>
                        <td className="text-start">
                            {item.nombre} 
                            {item.codigo && <div className="text-muted small" style={{fontSize: '10px'}}>COD: {item.codigo}</div>}
                        </td>
                        <td className="text-end">${parseFloat(item.precio).toFixed(2)}</td>
                        <td className="text-end fw-bold pe-2">${(item.cantidad * item.precio).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* --- SECCIÓN DE TOTALES Y DISCLAIMERS (AL FINAL) --- */}
                {/* La clase 'avoid-break' intenta mantener este bloque unido */}
                <div className="avoid-break mt-4">
                    
                    {/* Totales */}
                    <div className="d-flex justify-content-end mb-5">
                        <div className="p-3 text-white fw-bold rounded shadow-sm" style={{ background: mainColor, minWidth: '250px', display:'flex', justifyContent:'space-between', fontSize: '14px' }}>
                        <span>TOTAL GENERAL:</span>
                        <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Disclaimers / Condiciones / Sellos */}
                    <div className="border rounded p-3 bg-light text-secondary" style={{ fontSize: '10px' }}>
                        <div className="row">
                            <div className="col-8">
                                <h6 className="fw-bold mb-2 text-dark">TÉRMINOS Y CONDICIONES:</h6>
                                <ul className="ps-3 mb-0" style={{ listStyleType: 'circle' }}>
                                    <li className="mb-1">Esta cotización es válida por <strong>15 días</strong> a partir de la fecha de emisión.</li>
                                    <li className="mb-1">Tiempo de entrega estimado: <strong>{fechaEntrega ? new Date(fechaEntrega).toLocaleDateString() : 'A convenir'}</strong>.</li>
                                    <li className="mb-1">Forma de pago: 50% anticipo, 50% contra entrega (o según acuerdo).</li>
                                    <li>Precios incluyen IVA. Sujeto a disponibilidad de inventario.</li>
                                </ul>
                            </div>
                            
                            {/* Área de Sellos / Firmas */}
                            <div className="col-4 text-center d-flex flex-column justify-content-end align-items-center" style={{ height: '120px' }}>
                                <div style={{ borderBottom: '1px solid #999', width: '80%', marginBottom: '5px' }}></div>
                                <span className="fw-bold text-uppercase small">Firma y Sello Autorizado</span>
                                <span className="small text-muted">{empresa.Nombre}</span>
                            </div>
                        </div>
                    </div>

                </div>
                {/* --- FIN SECCIÓN FINAL --- */}

              </div>
            </td>
          </tr>
        </tbody>

        {/* 3. FOOTER SPACE (Espacio invisible que empuja contenido para no tapar el footer real) */}
        <tfoot>
          <tr>
            <td>
              <div className="footer-space">
                {/* Vacío: Solo sirve para reservar altura */}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* 4. FOOTER FIXED (Se muestra fijo en cada página sobre el footer-space) */}
      <div className="print-footer-fixed d-flex align-items-end justify-content-center pb-3">
         {empresa.EmpresaID === 1 ? <FooterStyleA /> : (
           <div className="text-center small text-muted border-top pt-2 w-100">
              {empresa.Nombre} | {empresa.Telefono}
           </div>
         )}
      </div>
    </div>
  );
});

export default QuotationPDF;