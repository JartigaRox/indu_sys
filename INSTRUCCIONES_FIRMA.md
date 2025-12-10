# Instrucciones para Implementar Firma y Sello

## 📋 Paso 1: Ejecutar Scripts SQL

**IMPORTANTE:** Debes ejecutar los siguientes comandos en tu base de datos SQL Server si aún no lo has hecho:

```sql
-- Ya ejecutado por ti:
ALTER TABLE Usuarios ADD FirmaSello VARBINARY(MAX);

-- Ejecutar estos dos comandos:
ALTER TABLE Cotizaciones ADD VendedorID INT;
ALTER TABLE Cotizaciones ADD CONSTRAINT FK_Cotizaciones_Vendedor 
  FOREIGN KEY (VendedorID) REFERENCES Usuarios(UsuarioID);
```

Estos comandos se encuentran en el archivo `BE/src/database/db.sql` en las líneas 27, 578-580.

## ✅ Funcionalidades Implementadas

### 1. **Registro de Usuarios con Firma**
- Al crear un nuevo usuario desde el panel de administración, ahora puedes:
  - Subir una imagen de firma/sello (formatos: PNG, JPG, etc.)
  - Ver una vista previa de la imagen antes de guardar
  - La imagen se guarda como binario en la base de datos

### 2. **Edición de Usuarios**
- Al editar un usuario existente:
  - Se muestra la firma actual del usuario (si existe)
  - Puedes subir una nueva firma para reemplazar la actual
  - Vista previa de la nueva firma antes de guardar

### 3. **Selector de Vendedor en Cotizaciones**
- Al crear una cotización:
  - Hay un nuevo campo "VENDEDOR / QUIEN COTIZA"
  - Lista desplegable con búsqueda de todos los usuarios
  - Muestra rol (Administrador/Operador) y tipo de vendedor
  - Por defecto selecciona el usuario actual que está creando la cotización
  - Puedes cambiar al vendedor que realmente hizo la cotización

### 4. **Firma en PDF de Cotizaciones**
- En el PDF de la cotización:
  - Se muestra la firma del vendedor seleccionado
  - Aparece en la sección "Firma y Sello Autorizado"
  - Se muestra el nombre del vendedor
  - Si no hay firma registrada, solo aparece la línea de firma

## 🎯 Cómo Usar

### Para Administradores:

1. **Registrar firma de usuarios:**
   - Ve a Usuarios > Agregar Usuario
   - Llena los datos normales
   - En "Firma y Sello (Imagen)", selecciona la imagen
   - Verás una vista previa
   - Haz clic en "Registrar Usuario"

2. **Actualizar firma existente:**
   - Ve a Usuarios > Editar usuario
   - Verás la firma actual
   - Selecciona una nueva imagen para cambiarla
   - Haz clic en "Guardar Cambios"

### Para Crear Cotizaciones:

1. **Con tu propia firma:**
   - Crea la cotización normalmente
   - El campo "Vendedor" ya estará seleccionado con tu usuario
   - Tu firma aparecerá automáticamente en el PDF

2. **Para otro vendedor:**
   - En "VENDEDOR / QUIEN COTIZA", busca y selecciona al vendedor correcto
   - La firma de ese vendedor aparecerá en el PDF

## 🔧 Endpoints API Creados

- `POST /api/auth/register` - Acepta `multipart/form-data` con campo `firma`
- `PUT /api/auth/users/:id` - Acepta `multipart/form-data` con campo `firma`
- `GET /api/auth/users/:id/signature` - Devuelve la imagen de firma como PNG
- `GET /api/auth/sellers` - Lista todos los usuarios para el selector de vendedor
- `POST /api/quotations` - Ahora acepta `vendedorId` en el payload
- `GET /api/quotations/:id` - Ahora devuelve `VendedorID` y `VendedorUsername`

## 📁 Archivos Modificados

### Backend:
- `BE/src/controllers/auth.js` - Funciones para manejar firmas
- `BE/src/routes/auth.js` - Rutas con multer para upload
- `BE/src/controllers/quotations.js` - Soporte para vendedorId
- `BE/src/database/db.sql` - Schema actualizado

### Frontend:
- `FE/info_gp/src/componets/CreateUserModal.jsx` - Upload de firma en registro
- `FE/info_gp/src/componets/EditUserModal.jsx` - Upload y preview de firma
- `FE/info_gp/src/pages/CreateQuotation.jsx` - Selector de vendedor
- `FE/info_gp/src/componets/QuotationPDF.jsx` - Display de firma en PDF

## 🐛 Solución de Problemas

**La firma no aparece en el PDF:**
- Verifica que el usuario tenga una firma registrada
- Asegúrate de haber seleccionado un vendedor al crear la cotización
- Revisa que el backend esté corriendo en `http://localhost:5000`

**Error al subir firma:**
- Verifica que la imagen sea válida (PNG, JPG, JPEG, etc.)
- Asegúrate de que el tamaño no sea excesivo (recomendado < 2MB)

**No aparecen vendedores en el selector:**
- Verifica que existan usuarios registrados
- Asegúrate de que el endpoint `/api/auth/sellers` esté funcionando

## 📝 Notas Importantes

- Las firmas se guardan como `VARBINARY(MAX)` en SQL Server
- Las imágenes se almacenan directamente en la base de datos (no en disco)
- El vendedor seleccionado puede ser diferente al usuario que crea la cotización
- Al editar una cotización, se crea una nueva versión manteniendo el vendedor original

## ✨ Próximas Mejoras Sugeridas

- Limitar tamaño máximo de archivo de firma
- Permitir recortar/ajustar imagen antes de subir
- Agregar validación de dimensiones recomendadas
- Permitir eliminar firma existente
- Historial de cambios de firma por usuario
