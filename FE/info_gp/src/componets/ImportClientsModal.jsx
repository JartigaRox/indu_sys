import { useState, useRef } from 'react';
import { Modal, Button, Form, Alert, Table, Badge } from 'react-bootstrap';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import api from '../api/axios';

const ImportClientsModal = ({ show, onHide, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      Swal.fire('Error', 'Por favor selecciona un archivo Excel válido (.xlsx o .xls)', 'error');
      return;
    }

    setFile(selectedFile);
    processExcel(selectedFile);
  };

  const processExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Validar y formatear datos
        const validatedData = [];
        const validationErrors = [];

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +2 porque Excel empieza en 1 y tiene header
          const errors = [];

          // Validar campo requerido (solo nombre)
          if (!row.Nombre || row.Nombre.trim() === '') {
            errors.push('Nombre es requerido');
          }

          if (errors.length > 0) {
            validationErrors.push({
              row: rowNum,
              errors: errors.join(', ')
            });
          } else {
            validatedData.push({
              nombre: row.Nombre?.trim(),
              telefono: row.Telefono?.toString().trim() || '',
              correo: row.Correo?.trim() || '',
              direccion: row.Direccion?.trim() || '',
              departamentoId: row.DepartamentoID ? parseInt(row.DepartamentoID) : null,
              municipioId: row.MunicipioID ? parseInt(row.MunicipioID) : null,
              distritoId: row.DistritoID ? parseInt(row.DistritoID) : null,
              status: 'pending'
            });
          }
        });

        setPreview(validatedData);
        setErrors(validationErrors);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo leer el archivo Excel', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      Swal.fire('Atención', 'No hay clientes válidos para importar', 'warning');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < preview.length; i++) {
      try {
        await api.post('/clients', preview[i]);
        preview[i].status = 'success';
        successCount++;
      } catch (error) {
        preview[i].status = 'error';
        preview[i].error = error.response?.data?.message || 'Error al crear';
        errorCount++;
      }
      setPreview([...preview]); // Actualizar vista
    }

    setLoading(false);

    await Swal.fire({
      title: 'Importación Completa',
      html: `
        <div class="text-start">
          <p><strong class="text-success">✓ Importados: ${successCount}</strong></p>
          <p><strong class="text-danger">✗ Errores: ${errorCount}</strong></p>
        </div>
      `,
      icon: successCount > 0 ? 'success' : 'error'
    });

    if (successCount > 0) {
      onSuccess();
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onHide();
  };

  const downloadTemplate = () => {
    // Crear plantilla de ejemplo
    const template = [
      { 
        Nombre: 'Cliente Ejemplo S.A.',
        Telefono: '2222-2222',
        Correo: 'cliente@ejemplo.com',
        Direccion: 'Dirección ejemplo',
        DepartamentoID: 1,
        MunicipioID: 1,
        DistritoID: 1
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'plantilla_clientes.xlsx');
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <FileSpreadsheet size={24} className="me-2" />
          Importar Clientes desde Excel
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Instrucciones */}
        <Alert variant="info" className="mb-3">
          <h6 className="fw-bold mb-2">📋 Formato del archivo Excel:</h6>
          <ul className="mb-2 small">
            <li><strong>Nombre</strong>: Nombre o razón social del cliente (Requerido)</li>
            <li><strong>Telefono</strong>: Teléfono del cliente (Opcional)</li>
            <li><strong>Correo</strong>: Correo electrónico (Opcional)</li>
            <li><strong>Direccion</strong>: Dirección física (Opcional)</li>
            <li><strong>DepartamentoID</strong>: ID del departamento (Opcional, número)</li>
            <li><strong>MunicipioID</strong>: ID del municipio (Opcional, número)</li>
            <li><strong>DistritoID</strong>: ID del distrito (Opcional, número)</li>
          </ul>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={downloadTemplate}
            className="d-flex align-items-center gap-2"
          >
            <Download size={16} />
            Descargar Plantilla de Ejemplo
          </Button>
        </Alert>

        {/* Selector de archivo */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Seleccionar archivo Excel</Form.Label>
          <Form.Control
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
        </Form.Group>

        {/* Errores de validación */}
        {errors.length > 0 && (
          <Alert variant="danger">
            <h6 className="fw-bold">❌ Errores encontrados:</h6>
            <ul className="mb-0 small">
              {errors.map((err, i) => (
                <li key={i}>Fila {err.row}: {err.errors}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Vista previa */}
        {preview.length > 0 && (
          <div className="mt-3">
            <h6 className="fw-bold mb-2">Vista Previa ({preview.length} clientes)</h6>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.nombre}</td>
                      <td>{item.telefono || '-'}</td>
                      <td>{item.correo || '-'}</td>
                      <td>
                        {item.status === 'pending' && <Badge bg="secondary">Pendiente</Badge>}
                        {item.status === 'success' && <Badge bg="success"><CheckCircle size={14} /> Importado</Badge>}
                        {item.status === 'error' && (
                          <Badge bg="danger" title={item.error}>
                            <XCircle size={14} /> Error
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={handleImport}
          disabled={preview.length === 0 || loading}
          className="d-flex align-items-center gap-2"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Importando...
            </>
          ) : (
            <>
              <Upload size={18} />
              Importar Clientes
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportClientsModal;
