-- 1. Crear la Base de Datos
CREATE DATABASE info_gp_sys;
GO
USE info_gp_sys;
GO

-- =============================================
-- SEGURIDAD Y USUARIOS (Roles y Usuarios)
-- =============================================

-- Tabla de Roles
CREATE TABLE Roles (
    RolID INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol NVARCHAR(50) NOT NULL UNIQUE -- 'sudo', 'operador'
);
GO

-- Tabla de Usuarios
CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL, -- Recuerda encriptar esto en el backend
    RolID INT NOT NULL,
    FOREIGN KEY (RolID) REFERENCES Roles(RolID)
);
GO

-- Insertar roles por defecto
INSERT INTO Roles (NombreRol) VALUES ('sudo'), ('operador');
GO

-- =============================================
-- UBICACIÓN GEOGRÁFICA (Normalización)
-- =============================================

CREATE TABLE Departamentos (
    DepartamentoID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL
);

CREATE TABLE Municipios (
    MunicipioID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    DepartamentoID INT NOT NULL,
    FOREIGN KEY (DepartamentoID) REFERENCES Departamentos(DepartamentoID)
);

CREATE TABLE Distritos (
    DistritoID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    MunicipioID INT NOT NULL,
    FOREIGN KEY (MunicipioID) REFERENCES Municipios(MunicipioID)
);
GO

-- =============================================
-- MÓDULO 1: PRODUCTOS
-- =============================================

CREATE TABLE Productos (
    ProductoID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoProducto NVARCHAR(50) NOT NULL UNIQUE, -- Código interno (ej. PROD-001)
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500),
    Imagen VARBINARY(MAX) -- Opción A: Guardar la imagen directo en BD
    -- ImagenURL NVARCHAR(MAX) -- Opción B: Guardar solo la ruta (comentar la línea de arriba si usas esta)
);
GO

-- =============================================
-- MÓDULO 2: CLIENTES
-- =============================================

CREATE TABLE Clientes (
    ClienteID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoCliente NVARCHAR(50) NOT NULL UNIQUE,
    NombreCliente NVARCHAR(200) NOT NULL, -- Razón Social o Nombre completo
    AtencionA NVARCHAR(150), -- Nombre de la persona de contacto
    Telefono NVARCHAR(20),
    CorreoElectronico NVARCHAR(150),
    DireccionCalle NVARCHAR(250), -- Dirección específica
    DistritoID INT, -- Enlace a la ubicación normalizada
    FechaRegistro DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DistritoID) REFERENCES Distritos(DistritoID)
);
GO

-- =============================================
-- MÓDULO 3: COTIZACIONES (Maestro - Detalle)
-- =============================================

-- Encabezado de la Cotización (Datos generales)
CREATE TABLE Cotizaciones (
    CotizacionID INT IDENTITY(1,1) PRIMARY KEY,
    NumeroCotizacion NVARCHAR(50) NOT NULL UNIQUE, -- Folio visible al cliente
    FechaRealizacion DATETIME DEFAULT GETDATE(),
    ClienteID INT NOT NULL,
    NombreQuienCotiza NVARCHAR(150), -- Usuario o empleado que hizo la cotización
    -- Datos "Snapshot": Se guardan aquí por si el cliente cambia de dirección en el futuro, la cotización histórica no cambie.
    TelefonoSnapshot NVARCHAR(20),
    AtencionASnapshot NVARCHAR(150),
    DireccionSnapshot NVARCHAR(250),
    TotalCotizacion DECIMAL(18, 2) DEFAULT 0, -- Suma total
    FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID)
);

-- Detalle de la Cotización (Productos dentro de la cotización)
CREATE TABLE DetalleCotizaciones (
    DetalleID INT IDENTITY(1,1) PRIMARY KEY,
    CotizacionID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(18, 2) NOT NULL,
    PrecioTotal AS (Cantidad * PrecioUnitario), -- Columna calculada automáticamente
    FOREIGN KEY (CotizacionID) REFERENCES Cotizaciones(CotizacionID),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);
GO

-- =============================================
-- MÓDULO 4: PEDIDOS (Simplificado / Interno)
-- =============================================

CREATE TABLE Pedidos (
    PedidoID INT IDENTITY(1,1) PRIMARY KEY,
    
    -- 1. Fecha de orden de inicio
    FechaOrdenInicio DATETIME DEFAULT GETDATE(),
    
    -- 2. Cliente (Relación con la tabla Clientes)
    ClienteID INT NOT NULL,
    
    -- 3. Fecha de entrega
    FechaEntrega DATETIME,
    
    -- 4. Elaborado por (Relación con tabla Usuarios)
    ElaboradoPorID INT, 
    
    -- 5. Ejecutivo de ventas (Relación con tabla Usuarios)
    EjecutivoVentasID INT,

    -- Definición de relaciones (Foreign Keys)
    FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID),
    FOREIGN KEY (ElaboradoPorID) REFERENCES Usuarios(UsuarioID),
    FOREIGN KEY (EjecutivoVentasID) REFERENCES Usuarios(UsuarioID)
);
GO

--CREAR AL ADMINISTRADOR POR DEFECTO
INSERT INTO Usuarios (Username, PasswordHash, RolID) VALUES ('admin-pruebas', '$2b$10$zIgXOX/fCSTzNu1sT22n.uS5mC5QqU2pdFxKpVVS90yNLVoJ2YJhC', 1);--contraseña es contraAdmin
GO
SELECT * FROM Usuarios;