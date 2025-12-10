import React, { forwardRef } from 'react';

const API_URL = "http://localhost:5000/api";

const OrderPDF = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const { 
    NumeroCotizacion, NombreCliente, FechaAprobacion, FechaEntrega, 
    ElaboradoPor, EjecutivoVenta, items, empresa 
  } = data;

  const cellStyle = {
    border: '2px solid black',
    padding: '8px',
    verticalAlign: 'middle',
    textAlign: 'center'
  };

  return (
    <div ref={ref} className="p-5 bg-white text-dark" style={{ width: '100%', minHeight: '100%', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>

      {/* TABLA DE INFORMACIÓN PRINCIPAL */}
      <table className="table table-bordered order-pdf-table mb-4" style={{ border: '2px solid black', width: '100%' }}>
        <tbody>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={{ ...cellStyle, width: '25%' }}>FECHA DE ORDEN DE INICIO</td>
            <td style={{ ...cellStyle, width: '25%' }}>{new Date().toLocaleDateString()}</td>
            <td className="fw-bold" style={{ ...cellStyle, width: '25%' }}>ÁREA</td>
            <td className="fw-bold" style={{ ...cellStyle, width: '25%' }}>FIRMA</td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td colSpan="2" className="fw-bold" style={{ ...cellStyle, backgroundColor: '#F7DD6F' }}>CLIENTE</td>
            <td className="fw-bold" style={cellStyle}>LAMINA Y ACERO INOXIDABLE</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td colSpan="2" style={{ ...cellStyle, backgroundColor: '#F7DD6F' }}>{NombreCliente}</td>
            <td className="fw-bold" style={cellStyle}>ESTRUCTURA Y PINTURA</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={cellStyle}>FECHA DE ENTREGA</td>
            <td style={cellStyle}>{FechaEntrega ? new Date(FechaEntrega).toLocaleDateString() : 'N/A'}</td>
            <td className="fw-bold" style={cellStyle}>CARPINTERIA</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={cellStyle}>ELABORADO POR</td>
            <td style={cellStyle}>{ElaboradoPor || 'N/A'}</td>
            <td className="fw-bold" style={cellStyle}>ARMADO</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={cellStyle}>EJECUTIVO DE VENTAS</td>
            <td style={cellStyle}>{EjecutivoVenta || 'N/A'}</td>
            <td className="fw-bold" style={cellStyle}>LOGISTICA</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td colSpan="2" style={cellStyle}></td>
            <td className="fw-bold" style={cellStyle}>BODEGA Y SEGURIDAD INDUSTRIAL</td>
            <td style={cellStyle}></td>
          </tr>
        </tbody>
      </table>

      {/* TABLA DE PRODUCTOS (mismo diseño que cotización pero sin precios) */}
      {items?.map((item, i) => (
        <table key={i} className="w-100 mb-4" style={{ border: '2px solid black', borderCollapse: 'collapse', pageBreakInside: 'avoid' }}>
          <tbody>
            {/* Fila 1: Headers con CAN, CÓDIGO, NOMBRE ÍTEM */}
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
                {(item.ImagenURL || item.imagenURL) ? (
                  <img 
                    src={`http://localhost:5000/api/products/image/${item.ProductoID || item.productoId}`}
                    alt={item.NombreProducto || item.nombre} 
                    style={{ 
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/200?text=IMG'}
                  />
                ) : (
                  <div className="text-muted" style={{ fontSize: '11px' }}>N/A</div>
                )}
              </td>
            </tr>
            
            {/* Fila 2: Valores de CAN, CÓDIGO, NOMBRE */}
            <tr>
              <td className="text-center align-middle fw-bold" style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                {item.Cantidad || item.cantidad}
              </td>
              <td className="text-center align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>
                {item.CodigoProducto || item.codigo || 'N/A'}
              </td>
              <td className="text-center align-middle" style={{ border: '1px solid black', padding: '8px', fontSize: '11px' }}>
                {item.NombreProducto || item.nombre || 'N/A'}
              </td>
            </tr>
            
            {/* Fila 3: Descripciones (bullets) - SIN FILA DE PRECIOS */}
            <tr>
              <td colSpan="3" className="align-top" style={{ border: '1px solid black', padding: '12px' }}>
                {(item.Descripcion || item.descripcion) ? (
                  <ul className="mb-0 ps-3" style={{ fontSize: '10px', lineHeight: '1.4', textTransform: 'uppercase' }}>
                    {(item.Descripcion || item.descripcion).split('\n').filter(line => line.trim()).map((line, idx) => (
                      <li key={idx}>{line.trim().toUpperCase()}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="mb-0 ps-3" style={{ fontSize: '10px' }}>
                    <li>SIN DESCRIPCIÓN</li>
                  </ul>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      ))}

      {/* FIRMAS (Al final de la hoja) */}
      <div className="fixed-bottom position-absolute w-100 px-5" style={{ bottom: '50px' }}>
        <div className="row text-center">
            <div className="col-4">
                <div className="border-top border-dark pt-2 mx-3">Autorizado</div>
            </div>
            <div className="col-4">
                <div className="border-top border-dark pt-2 mx-3">Entrega / Despacho</div>
            </div>
            <div className="col-4">
                <div className="border-top border-dark pt-2 mx-3">Recibido Conforme</div>
            </div>
        </div>
        <div className="text-center mt-4 text-muted fst-italic" style={{ fontSize: '10px' }}>
            Este documento es un comprobante interno de orden de trabajo y entrega.
        </div>
      </div>

    </div>
  );
});

export default OrderPDF;