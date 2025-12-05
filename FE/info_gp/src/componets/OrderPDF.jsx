import React from 'react';

const API_URL = "http://localhost:5000/api";

const OrderPDF = ({ data }) => {
  if (!data || !data.empresa) return <div className="p-5 text-center">Cargando datos...</div>;

  const { cliente, items, numeroCotizacion, fecha, empresa } = data;

  return (
    <div className="p-5 bg-white h-100" style={{ fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '14px' }}>
      
      {/* ENCABEZADO */}
      <div className="row mb-4 border-bottom pb-3">
        <div className="col-8">
            {/* Logo opcional en la orden */}
            {empresa.EmpresaID && (
                <img 
                    src={`${API_URL}/companies/logo/${empresa.EmpresaID}`} 
                    style={{ height: '50px', marginBottom: '10px' }} 
                    onError={(e)=>e.target.style.display='none'}
                    alt="Logo"
                />
            )}
            <h2 className="fw-bold text-uppercase mb-1">ORDEN DE PEDIDO</h2>
            <div className="text-secondary small">
                <strong>Emisor:</strong> {empresa.Nombre}<br/>
                <strong>Dirección:</strong> {empresa.Direccion}
            </div>
        </div>
        <div className="col-4 text-end">
            <div className="border p-3 rounded bg-light">
                <h5 className="fw-bold mb-1">#{numeroCotizacion}</h5>
                <small className="d-block text-muted">Referencia</small>
                <div className="mt-2 fw-bold">{new Date(fecha).toLocaleDateString()}</div>
            </div>
        </div>
      </div>

      {/* DATOS CLIENTE */}
      <div className="row mb-5">
        <div className="col-12"><h6 className="fw-bold bg-dark text-white p-2 ps-3 mb-3 rounded">INFORMACIÓN DE ENTREGA</h6></div>
        <div className="col-6">
            <p className="mb-1"><strong>Cliente:</strong> {cliente.NombreCliente}</p>
            <p className="mb-1"><strong>Contacto:</strong> {cliente.AtencionA || 'N/A'}</p>
            <p className="mb-1"><strong>Tel:</strong> {cliente.TelefonoCliente || 'N/A'}</p>
        </div>
        <div className="col-6">
            <p className="mb-1"><strong>Dirección:</strong></p>
            <p className="text-muted border p-2 rounded bg-light small">
                {cliente.DireccionCalle || ''} 
                {cliente.Municipio ? `, ${cliente.Municipio}` : ''} 
                {cliente.Departamento ? `, ${cliente.Departamento}` : ''}
                {!cliente.DireccionCalle && "No especificada"}
            </p>
        </div>
      </div>

      {/* TABLA SIN PRECIOS */}
      <table className="table table-bordered mb-4 align-middle">
        <thead className="table-dark">
          <tr>
            <th className="text-center" style={{ width: '80px' }}>IMG</th>
            <th className="text-center" style={{ width: '80px' }}>CANT.</th>
            <th>CÓDIGO</th>
            <th>DESCRIPCIÓN</th>
            <th className="text-center" style={{ width: '80px' }}>CHECK</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="text-center py-2">
                <img 
                    src={`${API_URL}/products/image/${item.productoId}`} 
                    style={{ width: '60px', height: '60px', objectFit: 'contain' }} 
                    onError={(e)=>e.target.src='https://via.placeholder.com/60?text=IMG'} 
                    alt="prod"
                />
              </td>
              <td className="text-center fw-bold fs-4">{item.cantidad}</td>
              <td className="fw-bold text-nowrap">{item.codigo}</td>
              <td>
                <span className="d-block fw-bold">{item.nombre}</span>
                {item.descripcion && <span className="small text-muted">{item.descripcion}</span>}
              </td>
              <td className="text-center">
                  <div style={{ width: '25px', height: '25px', border: '2px solid #ccc', margin: '0 auto', borderRadius: '4px' }}></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FIRMAS */}
      <div className="row mt-5 pt-5 text-center" style={{ pageBreakInside: 'avoid' }}>
        <div className="col-4">
            <div className="border-top border-dark w-75 mx-auto pt-2">Despachado</div>
        </div>
        <div className="col-4">
            <div className="border-top border-dark w-75 mx-auto pt-2">Transporte</div>
        </div>
        <div className="col-4">
            <div className="border-top border-dark w-75 mx-auto pt-2">Recibido</div>
        </div>
      </div>

    </div>
  );
};

export default OrderPDF;