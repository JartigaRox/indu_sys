import React, { forwardRef } from 'react';

const API_URL = "http://localhost:5000/api";

const OrderPDF = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const { 
    NumeroCotizacion, NombreCliente, FechaAprobacion, FechaEntrega, 
    ElaboradoPor, EjecutivoVenta, items, empresa 
  } = data;

  return (
    <div ref={ref} className="p-5 bg-white text-dark" style={{ width: '100%', minHeight: '100%', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4 border-bottom pb-3">
        <div>
            {/* Logo de la empresa (si existe ID de empresa en la orden o cotización) */}
            {/* Nota: Asegúrate de pasar el ID de la empresa en 'data' si lo necesitas dinámico */}
            <h2 className="fw-bold text-uppercase mb-0">ORDEN DE TRABAJO</h2>
            <div className="small text-secondary mt-1">
                <strong>{empresa?.Nombre || 'Don Bosco'}</strong><br/>
                {empresa?.Direccion}
            </div>
        </div>
        <div className="text-end">
            <div className="border rounded p-2 bg-light">
                <h5 className="fw-bold m-0">#{NumeroCotizacion}</h5>
                <small className="text-muted">Referencia</small>
            </div>
            <div className="mt-2 small">
                <strong>Fecha Entrega:</strong> {new Date(FechaEntrega).toLocaleDateString()}
            </div>
        </div>
      </div>

      {/* INFO GENERAL */}
      <div className="row mb-4">
        <div className="col-6">
            <h6 className="fw-bold bg-secondary text-white p-1 ps-2 rounded-top mb-0">CLIENTE</h6>
            <div className="border rounded-bottom p-2">
                <p className="mb-1 fs-6 fw-bold">{NombreCliente}</p>
                <p className="mb-0 text-muted">Aprobado el: {new Date(FechaAprobacion).toLocaleDateString()}</p>
            </div>
        </div>
        <div className="col-6">
            <h6 className="fw-bold bg-secondary text-white p-1 ps-2 rounded-top mb-0">RESPONSABLES</h6>
            <div className="border rounded-bottom p-2">
                <p className="mb-1"><strong>Ejecutivo Venta:</strong> {EjecutivoVenta}</p>
                <p className="mb-0"><strong>Elaborado Por:</strong> {ElaboradoPor}</p>
            </div>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS (Resumen para Taller/Entrega) */}
      <table className="table table-bordered mb-5">
        <thead className="table-light">
            <tr>
                <th className="text-center" style={{width: '60px'}}>CANT</th>
                <th>DESCRIPCIÓN DEL PRODUCTO</th>
                <th className="text-center" style={{width: '100px'}}>VERIFICACIÓN</th>
            </tr>
        </thead>
        <tbody>
            {items?.map((item, i) => (
                <tr key={i}>
                    <td className="text-center fw-bold fs-5 align-middle">{item.Cantidad || item.cantidad}</td>
                    <td className="align-middle">
                        <span className="fw-bold d-block">{item.NombreProducto || item.nombre}</span>
                        <span className="small text-muted">{item.CodigoProducto || item.codigo}</span>
                    </td>
                    <td className="text-center align-middle">
                        <div style={{width: '20px', height: '20px', border: '2px solid #ccc', margin: '0 auto'}}></div>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>

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