import React, { forwardRef } from 'react';

const API_URL = "http://localhost:5000/api";

const OrderPDF = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const { 
    numeroOrden, NumeroCotizacion, NombreCliente, FechaAprobacion, FechaEntrega, 
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

      {/* HEADER CON LOGO Y CÓDIGO DE ORDEN */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '3px solid #003366' }}>
        <div>
          <img 
            src="../../src/assets/Op.png" 
            alt="Logo Empresa" 
            style={{ height: '80px', objectFit: 'contain' }}
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
        <div className="text-end">
          <h5 className="fw-bold mb-1" style={{ color: '#003366' }}>ORDEN DE PEDIDO</h5>
          <p className="mb-0 fw-bold" style={{ fontSize: '14px', color: '#003366' }}>{numeroOrden || 'N/A'}</p>
        </div>
      </div>

      {/* TABLA DE INFORMACIÓN PRINCIPAL */}
      <table className="table table-bordered order-pdf-table mb-4" style={{ border: '2px solid black', width: '100%' }}>
        <tbody>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={{ ...cellStyle, width: '20%' }}>FECHA DE ORDEN DE INICIO</td>
            <td style={{ ...cellStyle, width: '30%' }}>{new Date().toLocaleDateString()}</td>
            <td className="fw-bold" style={{ ...cellStyle, width: '25%' }}>ÁREA</td>
            <td className="fw-bold" style={{ ...cellStyle, width: '25%' }}>FIRMA</td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td colSpan="2" className="fw-bold" style={{ ...cellStyle, backgroundColor: '#F7DD6F' }}>CLIENTE</td>
            <td className="fw-bold" style={cellStyle}>LAMINA Y ACERO INOXIDABLE</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td colSpan="2" rowSpan="2" style={{ ...cellStyle, backgroundColor: '#F7DD6F' }}>{NombreCliente}</td>
            <td className="fw-bold" style={cellStyle}>ESTRUCTURA Y PINTURA</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={cellStyle}>CARPINTERIA</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={{ ...cellStyle, backgroundColor: '#B6BDE3' }}>FECHA DE ENTREGA</td>
            <td style={{ ...cellStyle, backgroundColor: '#B6BDE3' }}>{FechaEntrega ? new Date(FechaEntrega).toLocaleDateString() : 'N/A'}</td>
            <td className="fw-bold" style={cellStyle}>ARMADO</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={cellStyle}>ELABORADO POR</td>
            <td style={cellStyle}>{ElaboradoPor || 'N/A'}</td>
            <td className="fw-bold" style={cellStyle}>LOGISTICA</td>
            <td style={cellStyle}></td>
          </tr>
          <tr style={{ height: '50px' }}>
            <td className="fw-bold" style={cellStyle}>EJECUTIVO DE VENTAS</td>
            <td style={cellStyle}>{EjecutivoVenta || 'N/A'}</td>
            <td className="fw-bold" style={cellStyle}>BODEGA Y SEGURIDAD INDUSTRIAL</td>
            <td style={cellStyle}></td>
          </tr>
        </tbody>
      </table>

      {/* TABLA DE PRODUCTOS (mismo diseño que cotización pero sin precios) */}
      {items && items.length > 0 ? (
        items.map((item, i) => (
        <table key={i} className="w-100 mb-4 product-table" style={{ border: '2px solid black', borderCollapse: 'collapse' }}>
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
                    src={item.imagenURL || item.ImagenURL}
                    alt={item.NombreProducto || item.nombre} 
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
      ))
      ) : (
        <div className="alert alert-warning text-center my-4" role="alert" style={{ border: '2px solid #856404', backgroundColor: '#fff3cd', padding: '20px', borderRadius: '5px' }}>
          <strong style={{ fontSize: '14px', color: '#856404' }}>⚠️ No hay productos asociados a esta orden</strong>
          <p className="mb-0 small mt-2" style={{ fontSize: '11px', color: '#856404' }}>Los productos de la cotización original no están disponibles.</p>
        </div>
      )}

    </div>
  );
});

export default OrderPDF;