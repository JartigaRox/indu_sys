import React, { forwardRef } from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp, FaEnvelope, FaGlobe } from 'react-icons/fa';

const API_URL = "http://localhost:5000/api";

const QuotationPDF = forwardRef(({ data }, ref) => {
  if (!data || !data.empresa) return null;

  const { cliente, items, user, numeroCotizacion, fecha, empresa } = data;
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
    <div className="pt-2 border-top w-100" style={{ borderColor: '#005689', borderWidth: '3px' }}>
      <div className="d-flex flex-wrap justify-content-center gap-3 text-dark" style={{ fontSize: '10px' }}>
         <div className="d-flex align-items-center text-nowrap"><FaMapMarkerAlt className="me-1"/> {empresa.Direccion}</div>
         <div className="d-flex align-items-center"><FaPhoneAlt className="me-1"/> {empresa.Telefono}</div>
         <div className="d-flex align-items-center"><FaWhatsapp className="me-1"/> {empresa.Celular}</div>
         <div className="d-flex align-items-center"><FaEnvelope className="me-1"/> <span style={{textTransform:'lowercase'}}>{empresa.CorreoElectronico}</span></div>
         <div className="d-flex align-items-center"><FaGlobe className="me-1"/> <span style={{textTransform:'lowercase'}}> {empresa.PaginaWeb}</span></div>
      </div>
    </div>
  );

  return (
    // IMPORTANTE: Padding para vista previa y padding adicional en impresión
    <div 
      ref={ref} 
      className="bg-white p-4 pdf-container"
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
                    <p className="mb-0 text-muted small">Lourdes colón, {new Date(fecha).toLocaleDateString()}</p>
                    <p className="fw-bold mb-0 fs-6">{cliente?.NombreCliente}</p>
                    <p className="mb-0"><strong>Atención A:</strong> {cliente?.AtencionA || 'N/A'}</p>
                    <p className="mb-0 text-muted small">{cliente?.Telefono}</p>
                    <p className="mb-0 text-muted small">
                      {cliente?.DireccionCalle}
                      {cliente?.Distrito && `, ${cliente.Distrito}`}
                      {cliente?.Municipio && `, ${cliente.Municipio}`}
                      {cliente?.Departamento && `, ${cliente.Departamento}`}
                    </p>
                    <p></p>
                    <p className="mb-0 text-muted small">PRESENTE</p>
                    <p></p>
                    <p className="mb-0 text-muted small">NOS COMPLACE ENNVIARLE LA SIGUIENTE COTIZACIÓN PARA LOS SUMINISTROS DE:</p>
                  </div>
                </div>

                {/* Tabla Items */}
                {items.map((item, i) => (
                  <table key={i} className="w-100 mb-4" style={{ border: '2px solid black', borderCollapse: 'collapse', pageBreakInside: 'avoid' }}>
                    <tbody>
                      {/* Fila 1: Headers con CAN, CÓDIGO, NOMBRE ITEM (sin header de imagen) */}
                      <tr>
                        <td className="fw-bold text-center align-middle" style={{ border: '1px solid black', width: '8%', padding: '8px', fontSize: '11px' }}>
                          CAN
                        </td>
                        <td className="fw-bold text-center align-middle" style={{ border: '1px solid black', width: '15%', padding: '8px', fontSize: '11px' }}>
                          CÓDIGO
                        </td>
                        <td className="fw-bold text-center align-middle" style={{ border: '1px solid black', width: '37%', padding: '8px', fontSize: '11px' }}>
                          NOMBRE ÍTEM
                        </td>
                        <td rowSpan="3" className="text-center align-middle" style={{ border: '1px solid black', width: '40%', padding: '8px' }}>
                          {item.imagenURL ? (
                            <img 
                              src={item.imagenURL} 
                              alt={item.nombre} 
                              style={{ 
                                width: '100%',
                                maxWidth: '200px',
                                height: 'auto',
                                maxHeight: '200px',
                                objectFit: 'contain'
                              }}
                            />
                          ) : (
                            <div className="text-muted" style={{ fontSize: '11px' }}>N/A</div>
                          )}
                        </td>
                      </tr>
                      
                      {/* Fila 2: Valores de CAN, CÓDIGO, NOMBRE */}
                      <tr>
                        <td className="text-center align-middle fw-bold" style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                          {item.cantidad}
                        </td>
                        <td className="text-center align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>
                          {item.codigo || 'N/A'}
                        </td>
                        <td className="text-center align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>
                          {item.nombre || 'N/A'}
                        </td>
                      </tr>
                      
                      {/* Fila 3: Descripciones (bullets) */}
                      <tr>
                        <td colSpan="3" className="align-top" style={{ border: '1px solid black', padding: '12px' }}>
                          {item.descripcion ? (
                            <ul className="mb-0 ps-3" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                              {item.descripcion.split('\n').filter(line => line.trim()).map((line, idx) => (
                                <li key={idx}>{line.trim().toUpperCase()}</li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="mb-0 ps-3" style={{ fontSize: '10px' }}>
                              <li>NO HAS </li>
                              <li>PUESTO LA</li>
                              <li>DESCRIPCIÓN</li>
                              <li>DEL PRODUCTO</li>
                              <li>¡¡¡¡¡¡¡¡¡¡¡¡</li>
                            </ul>
                          )}
                        </td>
                      </tr>
                      
                      {/* Fila 4: PRECIO UNITARIO y PRECIO TOTAL */}
                      <tr>
                        <td colSpan="2" className="fw-bold text-start ps-3 align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>
                          PRECIO UNITARIO
                        </td>
                        <td className="text-center align-middle fw-bold" style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                          ${item.precio.toFixed(2)}
                        </td>
                        <td className="align-middle" style={{ border: '1px solid black', padding: '8px' }}>
                          <div className="d-flex justify-content-between align-items-center px-2">
                            <span className="fw-bold" style={{ fontSize: '11px' }}>PRECIO TOTAL</span>
                            <span className="fw-bold" style={{ fontSize: '12px' }}>${(item.cantidad * item.precio).toFixed(2)}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ))}

                {/* --- SECCIÓN DE TOTALES Y DISCLAIMERS (AL FINAL) --- */}
                {/* La clase 'avoid-break' intenta mantener este bloque unido */}
                <div className="avoid-break mt-4">
                    
                    {/* Totales */}
                    <div className="d-flex justify-content-end mb-5">
                        <div className="p-3 text-white fw-bold rounded shadow-sm" style={{ background: '#008CB4', minWidth: '250px', display:'flex', justifyContent:'space-between', fontSize: '14px' }}>
                        <span>TOTAL DE LA COTIZACION:  </span>
                        <span> <strong>${total.toFixed(2)}</strong></span>
                        </div>
                    </div>

                    {/* Disclaimers / Condiciones / Sellos */}
                    <div className="border rounded p-3 bg-light text-secondary" style={{ fontSize: '10px' }}>
                        <div className="row">
                            <div className="col-8">
                                <h6 className="fw-bold mb-2 text-dark">TÉRMINOS Y CONDICIONES:</h6>
                                <ul className="ps-3 mb-0" style={{ listStyleType: 'circle' }}>
                                    <li className="mb-1"><strong>NOTA:</strong> EN CASO DE DETECTARSE ERRORES ARITMÉTICOS EN LOS CÁLCULOS, LA COTIZACIÓN SERÁ CORREGIDA Y ACTUALIZADA DE INMEDIATO, NOTIFICANDO AL CLIENTE. LOS VALORES CORRECTOS PREVALECERÁN SOBRE CUALQUIER ERROR TIPOGRÁFICO O DE CÁLCULO. LA ACEPTACIÓN DE ESTA COTIZACIÓN IMPLICA EL RECONOCIMIENTO DE ESTA CONDICIÓN. LAS IMÁGENES SON DE FIN ILUSTRATIVO, SUJETAS A CAMBIOS.</li>
                                    <li className="mb-1"><strong>GARANTÍA:</strong> 1 AÑO POR DESPERFECTO DE FABRICACIÓN VALIDEZ DE LA OFERTA: <strong>7 DÍAS CALENDARIO</strong> PRECIO INCLUYE IVA Y TRANSPORTE</li>
                                    <li className="mb-1"><strong>CONDICIÓN DE PAGO: CHEQUE O AL CONTADO</strong></li>
                                    <li>CHEQUE A NOMBRE DE: JEREMÍAS DE JESÚS ARTIGA DE PAZ</li>
                                    <li>RAZÓN SOCIAL: JEREMÍAS DE JESÚS ARTIGA DE PAZ</li>
                                    <li className="mb-1"><strong>CONTACTO DE LA EMPRESA:</strong></li>
                                    <li>DIRECCIÓN: CARRETERA A SONSONATE, KM. 24, EDIFICIO GP DON BOSCO, DISTRITO DE COLON, MUNICIPIO DE LA LIBERTAD OESTE</li>
                                    <li>TELÉFONO:{empresa.Telefono} </li>
                                    <li>NIT: {empresa.NIT}</li>
                                    <li>Registro: {empresa.NRC}</li>
                                </ul>
                            </div>
                            
                            {/* Área de Sellos / Firmas */}
                            <div className="col-4 text-center d-flex flex-column justify-content-end align-items-center" style={{ height: '120px' }}>
                                <div style={{ borderBottom: '1px solid #999', width: '80%', marginBottom: '5px' }}></div>
                                <span className="fw-bold text-uppercase small">Firma y Sello Autorizado</span>
                                <span className="small text-muted">{user.username}</span>
                                <span className="small text-muted">{empresa.Celular}</span>
                                <span className="small text-muted" style={{textTransform:'lowercase'}}>{empresa.CorreoElectronico}</span>
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