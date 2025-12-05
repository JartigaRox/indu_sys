import React from 'react';

// URL base de tu API (ajústala si subes el sistema a un servidor real)
const API_URL = "http://localhost:5000/api";

export const QuotationPDF = React.forwardRef(({ data }, ref) => {
  const { cliente, items, user, numeroCotizacion, fecha } = data;
  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

  return (
    <div ref={ref} className="p-5" style={{ width: '100%', color: 'black', backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
      
      {/* --- ENCABEZADO --- */}
      <div className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-3" style={{ borderColor: '#D4AF37' }}>
        <div>
          <h1 className="fw-bold m-0" style={{ color: '#003366', fontSize: '28px' }}>INDU SYS</h1>
          <p className="small text-muted mb-0">Soluciones Industriales S.A. de C.V.</p>
          <p className="small text-muted">San Salvador, El Salvador | Tel: 2222-0000</p>
        </div>
        <div className="text-end">
          <h3 className="text-secondary fw-bold mb-0">COTIZACIÓN</h3>
          <h5 className="fw-bold" style={{ color: '#D4AF37' }}>#{numeroCotizacion || 'BORRADOR'}</h5>
          <p className="small mb-0 text-muted">Fecha: {new Date(fecha).toLocaleDateString()}</p>
        </div>
      </div>

      {/* --- DATOS DEL CLIENTE --- */}
      <div className="row mb-5">
        <div className="col-7">
          <div className="p-3 bg-light rounded border-start border-4" style={{ borderColor: '#003366' }}>
            <h6 className="fw-bold text-uppercase mb-2" style={{ color: '#003366', letterSpacing: '1px' }}>Cliente</h6>
            <p className="mb-1 fw-bold fs-5">{cliente?.NombreCliente || 'Nombre del Cliente'}</p>
            <p className="mb-0 small text-muted">{cliente?.DireccionCalle}</p>
            <p className="mb-0 small text-muted">{cliente?.Municipio}, {cliente?.Departamento}</p>
            <p className="mb-0 small text-muted">Tel: {cliente?.Telefono}</p>
          </div>
        </div>
        <div className="col-5 text-end d-flex flex-column justify-content-center">
          <div className="mb-3">
            <h6 className="fw-bold text-uppercase mb-0" style={{ color: '#003366' }}>Atención a:</h6>
            <p className="mb-0">{cliente?.AtencionA || 'Encargado de Compras'}</p>
          </div>
          <div>
            <h6 className="fw-bold text-uppercase mb-0" style={{ color: '#003366' }}>Ejecutivo:</h6>
            <p className="mb-0">{user?.username}</p>
          </div>
        </div>
      </div>

      {/* --- TABLA DE PRODUCTOS --- */}
      <table className="table mb-4">
        <thead style={{ backgroundColor: '#003366', color: 'white' }}>
          <tr>
            <th className="py-2 text-center" style={{ width: '80px' }}>Imagen</th>
            <th className="py-2 text-center" style={{ width: '60px' }}>Cant.</th>
            <th className="py-2">Descripción del Producto</th>
            <th className="text-end py-2" style={{ width: '120px' }}>Precio Unit.</th>
            <th className="text-end py-2" style={{ width: '120px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} style={{ verticalAlign: 'middle' }}>
              {/* COLUMNA DE IMAGEN */}
              <td className="text-center">
                <img 
                  src={`${API_URL}/products/image/${item.productoId}`} 
                  alt="Prod" 
                  style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eee' }}
                  // Si la imagen falla (ej. no tiene foto), mostramos un cuadro gris vacío
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/50?text=No+Img"; }}
                />
              </td>
              
              <td className="text-center fw-bold">{item.cantidad}</td>
              <td>
                <span className="fw-bold d-block text-dark">{item.nombre}</span>
                <span className="small text-muted">{item.codigo || 'S/C'}</span> 
                {/* Puedes agregar descripción extra aquí si la tuvieras en el objeto item */}
              </td>
              <td className="text-end">${parseFloat(item.precio).toFixed(2)}</td>
              <td className="text-end fw-bold text-inst-blue">${(item.cantidad * item.precio).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- TOTALES --- */}
      <div className="row">
        <div className="col-7">
            <p className="small text-muted fst-italic mt-2">
                * Tiempos de entrega sujetos a disponibilidad.<br/>
                * Precios incluyen IVA.
            </p>
        </div>
        <div className="col-5">
          <div className="d-flex justify-content-between mb-2 border-bottom pb-1">
            <span className="fw-bold text-secondary">Subtotal:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {/* Si quisieras calcular IVA aparte: */}
          {/* <div className="d-flex justify-content-between mb-2 border-bottom pb-1">
            <span className="fw-bold text-secondary">IVA (13%):</span>
            <span>${(total * 0.13).toFixed(2)}</span>
          </div> */}
          <div className="d-flex justify-content-between p-3 text-white rounded" style={{ backgroundColor: '#003366' }}>
            <span className="fw-bold fs-5">TOTAL:</span>
            <span className="fw-bold fs-4">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* --- PIE DE PÁGINA --- */}
      <div className="fixed-bottom p-5 text-center text-muted small" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <hr style={{ borderColor: '#D4AF37', opacity: 1 }} />
        <p className="mb-1 fw-bold">Gracias por confiar en INDU SYS</p>
        <p>Visítanos en www.indusys.com | contacto@indusys.com</p>
      </div>

    </div>
  );
});

export default QuotationPDF;