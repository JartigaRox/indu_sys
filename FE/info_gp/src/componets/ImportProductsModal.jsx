import { useState, useRef } from 'react';
import { Modal, Button, Form, Alert, Table, Badge } from 'react-bootstrap';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import api from '../api/axios';

const ImportProductsModal = ({ show, onHide, onSuccess }) => {
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

          // Validar campos requeridos
          if (!row.Nombre || row.Nombre.trim() === '') {
            errors.push('Nombre es requerido');
          }
          if (!row.CategoriaID) {
            errors.push('CategoriaID es requerido');
          }
          if (!row.SubcategoriaID) {
            errors.push('SubcategoriaID es requerido');
          }

          if (errors.length > 0) {
            validationErrors.push({
              row: rowNum,
              errors: errors.join(', ')
            });
          } else {
            validatedData.push({
              nombre: row.Nombre?.trim(),
              descripcion: row.Descripcion?.trim() || '',
              categoriaId: parseInt(row.CategoriaID),
              subcategoriaId: parseInt(row.SubcategoriaID),
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
      Swal.fire('Atención', 'No hay productos válidos para importar', 'warning');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < preview.length; i++) {
      try {
        await api.post('/products', preview[i]);
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
      { Nombre: 'Producto Ejemplo', Descripcion: 'Descripción del producto', CategoriaID: 1, SubcategoriaID: 1 }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <FileSpreadsheet size={24} className="me-2" />
          Importar Productos desde Excel
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Instrucciones */}
        <Alert variant="info" className="mb-3">
          <h6 className="fw-bold mb-2">📋 Formato del archivo Excel:</h6>
          <ul className="mb-2 small">
            <li><strong>Nombre</strong>: Nombre del producto (Requerido)</li>
            <li><strong>Descripcion</strong>: Descripción del producto (Opcional)</li>
            <li><strong>CategoriaID</strong>: ID de la categoría (Requerido, número)</li>
            <li><strong>SubcategoriaID</strong>: ID de la subcategoría (Requerido, número)</li>
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
            <h6 className="fw-bold mb-2">Vista Previa ({preview.length} productos)</h6>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Categoría ID</th>
                    <th>Subcategoría ID</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.nombre}</td>
                      <td>{item.categoriaId}</td>
                      <td>{item.subcategoriaId}</td>
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
              Importar {preview.length} Productos
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportProductsModal;
