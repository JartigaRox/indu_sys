-- 1. Crear la Base de Datos (Si es necesario, en Railway ya viene creada)
-- CREATE DATABASE info_gp_sys;

-- ==========================================================
-- BLOQUE 1: TABLAS INDEPENDIENTES (CATÁLOGOS)
-- Se crean primero porque no dependen de nadie
-- ==========================================================

CREATE TABLE Roles (
    RolID SERIAL PRIMARY KEY,
    NombreRol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Departamentos (
    DepartamentoID SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Empresas (
    EmpresaID SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Direccion VARCHAR(200),
    NRC VARCHAR(50),
    Telefono VARCHAR(20),
    CorreoElectronico VARCHAR(150),
    PaginaWeb VARCHAR(150),
    Celular VARCHAR(20),
    NIT VARCHAR(50)
);

CREATE TABLE Categorias (
    CategoriaID SERIAL PRIMARY KEY,
    CodigoCategoria VARCHAR(25) NOT NULL,
    Nombre VARCHAR(100) NOT NULL
);

CREATE TABLE MetodosPago (
    MetodoID SERIAL PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE EstadosFactura (
    EstadoFacturaID SERIAL PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE EstadosOrden (
    EstadoOrdenID SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    ColorHex VARCHAR(20) NOT NULL
);

CREATE TABLE TiposVendedor (
    TipoVendedorID SERIAL PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE TipoMuebles (
    TipoMuebleID SERIAL PRIMARY KEY,
    Tipo VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE EstadoProducto (
    EstadoProductoID SERIAL PRIMARY KEY,
    Estado VARCHAR(50) NOT NULL UNIQUE
);

-- ==========================================================
-- BLOQUE 2: TABLAS DEPENDIENTES (NIVEL 1)
-- Dependen de los catálogos anteriores
-- ==========================================================

CREATE TABLE Municipios (
    MunicipioID SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    DepartamentoID INT NOT NULL REFERENCES Departamentos(DepartamentoID)
);

CREATE TABLE Subcategorias (
    SubcategoriaID SERIAL PRIMARY KEY,
    CodigoSubcategoria VARCHAR(50) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    CategoriaID INT NOT NULL REFERENCES Categorias(CategoriaID)
);

CREATE TABLE Usuarios (
    UsuarioID SERIAL PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    RolID INT NOT NULL REFERENCES Roles(RolID),
    FirmaSello BYTEA,
    CorreoElectronico VARCHAR(150),
    TipoVendedorID INT REFERENCES TiposVendedor(TipoVendedorID),
    ResetToken VARCHAR(255),
    ResetTokenExpiry TIMESTAMP
);

-- ==========================================================
-- BLOQUE 3: TABLAS DEPENDIENTES (NIVEL 2)
-- Dependen de Nivel 1
-- ==========================================================

CREATE TABLE Distritos (
    DistritoID SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    MunicipioID INT NOT NULL REFERENCES Municipios(MunicipioID)
);

CREATE TABLE Productos (
    ProductoID SERIAL PRIMARY KEY,
    CodigoProducto VARCHAR(50) NOT NULL UNIQUE,
    Nombre VARCHAR(150) NOT NULL,
    Descripcion VARCHAR(1000),
    Imagen BYTEA,
    SubcategoriaID INT REFERENCES Subcategorias(SubcategoriaID),
    TipoMuebleID INT REFERENCES TipoMuebles(TipoMuebleID),
    EstadoProductoID INT REFERENCES EstadoProducto(EstadoProductoID)
);

CREATE TABLE Clientes (
    ClienteID SERIAL PRIMARY KEY,
    CodigoCliente VARCHAR(50) NOT NULL UNIQUE,
    NombreCliente VARCHAR(200) NOT NULL,
    AtencionA VARCHAR(150),
    Telefono VARCHAR(20),
    CorreoElectronico VARCHAR(150),
    DireccionCalle VARCHAR(250),
    DistritoID INT REFERENCES Distritos(DistritoID),
    FechaRegistro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Notificaciones (
    NotificacionID SERIAL PRIMARY KEY,
    UsuarioID INT REFERENCES Usuarios(UsuarioID),
    Mensaje TEXT NOT NULL,
    Leida BOOLEAN DEFAULT FALSE,
    FechaCreacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Auditoria (
    AuditoriaID SERIAL PRIMARY KEY,
    UsuarioID INT REFERENCES Usuarios(UsuarioID),
    Accion VARCHAR(100) NOT NULL,
    TablaAfectada VARCHAR(100),
    FechaAccion TIMESTAMP DEFAULT NOW(),
    Detalles TEXT
);

-- ==========================================================
-- BLOQUE 4: TRANSACCIONALES (COTIZACIONES Y ORDENES)
-- El núcleo del negocio
-- ==========================================================

CREATE TABLE Cotizaciones (
    CotizacionID SERIAL PRIMARY KEY,
    NumeroCotizacion VARCHAR(50) NOT NULL UNIQUE,
    FechaRealizacion TIMESTAMP DEFAULT NOW(),
    ClienteID INT NOT NULL REFERENCES Clientes(ClienteID),
    NombreQuienCotiza VARCHAR(150),
    TelefonoSnapshot VARCHAR(20),
    AtencionASnapshot VARCHAR(150),
    DireccionSnapshot VARCHAR(250),
    TotalCotizacion NUMERIC(18,2) DEFAULT 0,
    Estado VARCHAR(20) DEFAULT 'Pendiente',
    VendedorID INT REFERENCES Usuarios(UsuarioID),
    EmpresaID INT REFERENCES Empresas(EmpresaID),
    UsuarioDecision VARCHAR(50),
    Terminos TEXT
);

CREATE TABLE DetalleCotizaciones (
    DetalleID SERIAL PRIMARY KEY,
    CotizacionID INT NOT NULL REFERENCES Cotizaciones(CotizacionID),
    ProductoID INT NOT NULL REFERENCES Productos(ProductoID),
    Cantidad INT NOT NULL,
    PrecioUnitario NUMERIC(18,2) NOT NULL,
    Descripcion TEXT
);

CREATE TABLE Ordenes (
    OrdenID SERIAL PRIMARY KEY,
    NumeroOrden VARCHAR(50) NOT NULL UNIQUE,
    CotizacionID INT NOT NULL REFERENCES Cotizaciones(CotizacionID),
    UsuarioID INT NOT NULL REFERENCES Usuarios(UsuarioID),
    FechaEntrega DATE,
    UbicacionEntrega VARCHAR(255),
    MontoVenta NUMERIC(18,2),
    PagoAnticipo NUMERIC(18,2) DEFAULT 0,
    MetodoAnticipoID INT REFERENCES MetodosPago(MetodoID),
    DocAnticipoPDF VARCHAR(255),
    PagoComplemento NUMERIC(18,2) DEFAULT 0,
    MetodoComplementoID INT REFERENCES MetodosPago(MetodoID),
    DocComplementoPDF VARCHAR(255),
    TotalPagado NUMERIC(18,2) DEFAULT 0,
    PagoPendiente NUMERIC(18,2) DEFAULT 0,
    EstadoFacturaID INT REFERENCES EstadosFactura(EstadoFacturaID),
    EstadoOrdenID INT REFERENCES EstadosOrden(EstadoOrdenID),
    Observaciones TEXT,
    FechaCreacion TIMESTAMP DEFAULT NOW(),
    UsuarioModificacionID INT REFERENCES Usuarios(UsuarioID),
    FechaModificacion TIMESTAMP
);

CREATE TABLE DetalleOrdenes (
    DetalleID SERIAL PRIMARY KEY,
    OrdenID INT NOT NULL REFERENCES Ordenes(OrdenID),
    ProductoID INT NOT NULL REFERENCES Productos(ProductoID),
    Cantidad INT NOT NULL,
    PrecioUnitario NUMERIC(18,2) NOT NULL,
    Descripcion TEXT
);

CREATE TABLE Pedidos (
    PedidoID SERIAL PRIMARY KEY,
    FechaOrdenInicio TIMESTAMP DEFAULT NOW(),
    ClienteID INT NOT NULL REFERENCES Clientes(ClienteID),
    FechaEntrega TIMESTAMP,
    ElaboradoPorID INT REFERENCES Usuarios(UsuarioID),
    EjecutivoVentasID INT REFERENCES Usuarios(UsuarioID)
);

CREATE TABLE HistorialEstadosOrden (
    HistorialID SERIAL PRIMARY KEY,
    OrdenID INT NOT NULL REFERENCES Ordenes(OrdenID),
    EstadoOrdenID INT NOT NULL REFERENCES EstadosOrden(EstadoOrdenID),
    FechaCambio TIMESTAMP DEFAULT NOW(),
    UsuarioID INT REFERENCES Usuarios(UsuarioID),
    Observaciones TEXT
);

-- ==========================================================
-- BLOQUE 5: FACTURACIÓN Y EXTRAS
-- Dependen de Ordenes
-- ==========================================================

CREATE TABLE Facturas (
    FacturaID SERIAL PRIMARY KEY,
    NumeroFactura VARCHAR(50) NOT NULL UNIQUE,
    OrdenID INT NOT NULL REFERENCES Ordenes(OrdenID),
    FechaEmision TIMESTAMP DEFAULT NOW(),
    TotalFactura NUMERIC(18,2) NOT NULL,
    EstadoFacturaID INT REFERENCES EstadosFactura(EstadoFacturaID),
    PDF VARCHAR(255),
    Observaciones TEXT
);

CREATE TABLE Pagos (
    PagoID SERIAL PRIMARY KEY,
    FacturaID INT NOT NULL REFERENCES Facturas(FacturaID),
    FechaPago TIMESTAMP DEFAULT NOW(),
    Monto NUMERIC(18,2) NOT NULL,
    MetodoID INT REFERENCES MetodosPago(MetodoID),
    PDF VARCHAR(255),
    Observaciones TEXT
);

CREATE TABLE ArchivosAdjuntos (
    ArchivoID SERIAL PRIMARY KEY,
    OrdenID INT REFERENCES Ordenes(OrdenID),
    CotizacionID INT REFERENCES Cotizaciones(CotizacionID),
    FacturaID INT REFERENCES Facturas(FacturaID),
    NombreArchivo VARCHAR(255) NOT NULL,
    RutaArchivo VARCHAR(255) NOT NULL,
    FechaSubida TIMESTAMP DEFAULT NOW(),
    UsuarioID INT REFERENCES Usuarios(UsuarioID)
);

-- ==========================================================
-- BLOQUE 6: INSERCIÓN DE DATOS (AL FINAL)
-- Ahora que las tablas existen, podemos llenarlas
-- ==========================================================

-- Roles
INSERT INTO Roles (NombreRol) VALUES ('sudo'), ('operador');

-- Tipos de vendedor (Necesario para usuarios)
INSERT INTO TiposVendedor (Nombre) VALUES ('Sala de ventas'), ('Venta externa'), ('Oficina');

-- Usuarios
INSERT INTO Usuarios (Username, PasswordHash, RolID) VALUES ('admin-pruebas', '$2b$10$zIgXOX/fCSTzNu1sT22n.uS5mC5QqU2pdFxKpVVS90yNLVoJ2YJhC', 1);

-- Departamentos
INSERT INTO Departamentos (Nombre) VALUES 
('AHUACHAPÁN'),('SAN SALVADOR'),('LA LIBERTAD'),('SANTA ANA'),('SONSONATE'),('CHALATENANGO'),('CUSCATLÁN'),('LA PAZ'),('SAN VICENTE'),('USULUTÁN'),('SAN MIGUEL'),('LA UNIÓN'),('MORAZÁN'),('CABAÑAS');

-- Municipios
INSERT INTO Municipios (Nombre, DepartamentoID) VALUES
('Ahuachapán Norte', 1),('Ahuachapán Centro', 1),('Ahuachapán Sur', 1),
('San Salvador Norte', 2),('San Salvador Oeste',2),('San Salvador Este',2),('San Salvador Centro',2),('San Salvador Sur',2),
('La Libertad Norte',3),('La Libertad Centro',3),('La Libertad Oeste',3),('La Libertad Este',3),('La Libertad Costa',3),('La Libertad Sur',3),
('Santa Ana Norte',4),('Santa Ana Centro',4),('Santa Ana Este',4),('Santa Ana Oeste',4),
('Sonsonate Norte',5),('Sonsonate Centro',5),('Sonsonate Este',5),('Sonsonate Oeste',5),
('Chalatenango Norte',6),('Chalatenango Centro',6),('Chalatenango Sur',6),
('Cuscatlán Norte',7),('Cuscatlán Sur',7),
('La Paz Oeste',8),('La Paz Centro',8),('La Paz Este',8),
('San Vicente Norte',9),('San Vicente Sur',9),
('Usulután Norte',10),('Usulután Este',10),('Usulután Oeste',10),
('San Miguel Norte',11),('San Miguel Centro',11),('San Miguel Oeste',11),
('La Unión Norte',12),('La Unión Sur',12),
('Morazán Norte',13),('Morazán Sur',13),
('Cabañas Este',14),('Cabañas Oeste',14);

-- Distritos
INSERT INTO Distritos (Nombre, MunicipioID) VALUES
('Atiquizaya',1),('El Refugio',1),('San Lorenzo',1),('Turín',1),
('Ahuachapán',2),('Apaneca',2),('Concepción de Ataco',2),('Tacuba',2),
('Guaymango',3),('Jujutla',3),('San Francisco Menéndez',3),('San Pedro Puxtla',3),
('Aguilares',4),('El Paisnal',4),('Guazapa',4),('Apopa',5),('Nejapa',5),
('Ilopango',6),('San Martín',6),('Soyapango',6),('Tonacatepeque',6),
('Ayutuxtepeque',7),('San Salvador',7),('Mejicanos',7),('Cuscatancingo',7),('Ciudad Delgado',7),
('San Marcos',8),('Panchimalco',8),('Rosario de Mora',8),('Santo Tomás',8),('Santiago Texacuangos',8),
('Quezaltepeque',9),('San Matías',9),('San Pablo Tacachico',9),('San Juan Opico',10),('Ciudad Arce',10),
('Colón',11),('Jayaque',11),('Sacacoyo',11),('Tepecoyo',11),('Talnique',11),
('Antiguo Cuscatlán',12),('Huizúcar',12),('Nuevo Cuscatlán',12),('San José Villanueva',12),('Zaragoza',12),
('Chiltiupán',13),('Tamanique',13),('La Libertad',13),('Jicalapa',13),('Teotepeque',13),
('Comasagua',14),('Santa Tecla',14),
('Masahuat',15),('Metapán',15),('Santa Rosa Guachipilín',15),('Texistepeque',15),('Santa Ana',16),('Coatepeque',17),('El Congo',17),
('Candelaria de la Frontera',18),('Chalchuapa',18),('El Porvenir',18),('San Antonio Pajonal',18),('San Sebastián Salitrillo',18),('Santiago de la Frontera',18),
('Juayua',19),('Nahuizalco',19),('Salcoatitán',19),('Santa Catarina Masahuat',19),('Sonsonate',20),('Sonzacate',20),('Nahulingo',20),('San Antonio del Monte',20),('Santo Domingo de Guzmán',20),
('Armenia',21),('Caluco',21),('San Julián',21),('Izalco',21),('Cuisnahuat',21),('Santa Isabel Ishuatan',21),('Acajutla',22),
('La Palma',23),('Citalá',23),('San Ignacio',23),('Nueva Concepción',24),('Tejutla',24),('La Reina',24),('Agua Caliente',24),('Dulce Nombre de Maria',24),('El Paraíso',24),('San Francisco Morazan',24),('San Rafael',24),('Santa Rita',24),('San Fernando',24),
('Chalatenango',25),('Arcatao',25),('Azacualpa',25),('Comalapa',25),('Concepción Quezaltepeque',25),('El Carrizal',25),('La Laguna',25),('Las Vueltas',25),('Nombre de Jesús',25),('Nueva Trinidad',25),('Ojos de Agua',25),('Potonico',25),('San Antonio de La Cruz',25),('San Antonio Los Ranchos',25),('San Francisco Lempa',25),('San Isidro Labrador',25),('San José Cancasque',25),('San Miguel de Mercedes',25),('San José Las Flores',25),('San Luis del Carmen',25),
('Suchitoto',26),('San José Guayabal',26),('Oratorio de Concepción',26),('San Bartolomé Perulapán',26),('San Pedro Perulapán',26),('Cojutepeque',27),('San Rafael Cedros',27),('Candelaria',27),('Monte San Juan',27),('El Carmen',27),('San Cristóbal',27),('Santa Cruz Michapa',27),('San Ramon',27),('El Rosario',27),('Santa Cruz Analquito',27),('Tenancingo',27),
('Cuyultitán',28),('Olocuilta',28),('San Juan Talpa',28),('San Luis Talpa',28),('San Pedro Masahuat',28),('Tapalhuaca',28),('San Francisco Chinameca',28),('El Rosario',29),('Jerusalén',29),('Mercedes La Ceiba',29),('Paraíso de Osorio',29),('San Antonio Masahuat',29),('San Emigdio',29),('San Juan Tepezontes',29),('San Luis La Herradura',29),('San Miguel Tepezontes',29),('San Pedro Nonualco',29),('Santa María Ostuma',29),('Santiago Nonualco',29),('Zacatecoluca',30),('San Juan Nonualco',30),('San Rafael Obrajuelo',30),
('Apastepeque',31),('Santa Clara',31),('San Ildefonso',31),('San Esteban Catarina',31),('San Sebastian',31),('San Lorenzo',31),('Santo Domingo',31),('San Vicente',32),('Guadalupe',32),('Verapaz',32),('Tepetitán',32),('Tecoluca',32),('San Cayetano Istepeque',32),
('Santiago de María',33),('Alegría',33),('Berlín',33),('Mercedes Umaña',33),('Jucuapa',33),('El Triunfo',33),('Estanzuelas',33),('San Buenaventura',33),('Nueva Granada',33),('Usulután',34),('Jucuarán',34),('San Dionisio',34),('Concepcíon Batres',34),('Santa María',34),('Ozatlán',34),('Tecapán',34),('Santa Elena',34),('California',34),('Ereguayquín',34),('Jiquilisco',35),('Puerto El Triunfo',35),('San Agustin',35),('San Francisco Javier',35),
('Ciudad Barrios',36),('Sesori',36),('Nuevo Edén de San Juan',36),('San Gerardo',36),('San Luis de la Reina',36),('Carolina',36),('San Antonio del Mosco',36),('Chapeltique',36),('San Miguel',37),('Comacarán',37),('Uluazapa',37),('Moncagua',37),('Quelepa',37),('Chirilagua',37),('Chinameca',38),('Nueva Guadalupe',38),('Lolotique',38),('San Jorge',38),('San Rafael Oriente',38),('El Tránsito',38),
('Anamorós',39),('Bolivar',39),('Concepcion de Oriente',39),('El Sauce',39),('Lislique',39),('Nueva Esparta',39),('Pasaquina',39),('Polorós',39),('San José La Fuente',39),('Santa Rosa de Lima',39),('Conchagua',40),('El Carmen',40),('Intipucá',40),('La Unión',40),('Meanguera del Golfo',40),('San Alejo',40),('Yayantique',40),('Yucuaiquín',40),
('Arambala',41),('Cacaopera',41),('Corinto',41),('El Rosario',41),('Joateca',41),('Jocoaitique',41),('Meanguera',41),('Perquín',41),('San Fernando',41),('San Isidro',41),('Torola',41),('Chilanga',42),('El Divisadero',42),('Delicias de Concepción',42),('Gualococti',42),('Guatajiagua',42),('Jocoro',42),('Lolotiquillo',42),('Osicala',42),('San Carlos',42),('San Francisco Gotera',42),('San Simón',42),('Sesembra',42),('Sociedad',42),('Yamabal',42),('Yoloaiquín',42),
('Sensuntepeque',43),('Victoria',43),('Dolores',43),('Guacotecti',43),('San Isidro',43),('Ilobasco',44),('Jutiapa',44),('Tejutepeque',44),('Cinquera',44);

-- Categorías
INSERT INTO Categorias (CodigoCategoria, Nombre) VALUES 
('OFI', 'OFICINA'), ('ESC', 'ESCOLARES'), ('HOS', 'HOSPITALARIOS'), ('INOX', 'ACERO INOXIDABLE'), ('RECR', 'RECREATIVOS'), ('OTR', 'OTROS');

-- Subcategorías
INSERT INTO Subcategorias (CodigoSubcategoria, Nombre, CategoriaID) VALUES 
('ARM', 'ARMARIOS', 1), ('ARCH', 'ARCHIVOS', 1), ('MCOM', 'MUEBLES PARA COMPUTADORA', 1),('MCOM', 'MUEBLES PARA COMPUTADORA', 1),
('ESCR', 'ESCRITORIOS', 1), ('EST', 'ESTANTES', 1), ('LOC', 'LOCKERS', 1),
('LIB', 'LIBRERAS', 1), ('MES', 'MESAS', 1), ('REC', 'MUEBLES PARA RECEPCION', 1), ('SEJE', 'SILLAS ERGONOMICAS Y EJECUTIVAS', 1),
('SEST', 'SILLAS PARA ESTUDIANTES', 2), ('PIZ', 'PIZARRAS', 2), ('PUP', 'PUPITRES', 2),
('PARV', 'PARVULARIA', 2), ('HOSP', 'HOSPITALARIOS', 3), ('AINX', 'MUEBLES EN ACERO INOXIDABLE', 4),
('MLAB', 'MUEBLES PARA LABORATORIO', 4), ('RECT', 'RECREATIVOS', 5), ('CARR', 'CARRETILLAS', 6),
('MSES', 'MODULOS DE SILLA DE ESPERA', 6),('POD', 'PODIUMS', 6),('OTRS', 'OTROS', 6),
('BIB', 'BIBLIOTECA', 2),('DIVE', 'DIVERSOS ESCOLARES', 2);

-- Métodos de pago
INSERT INTO MetodosPago (Nombre) VALUES ('Transferencia'), ('Depósito'), ('Cheque'), ('Tarjeta'), ('Efectivo');

-- Estados de factura
INSERT INTO EstadosFactura (Nombre) VALUES ('No facturado'), ('Factura anticipo'), ('Facturado total');

-- Estados de orden
INSERT INTO EstadosOrden (Nombre, ColorHex) VALUES 
('Pagado y finalizado', '#FFFFFF');

-- Tipo de muebles
INSERT INTO TipoMuebles (Tipo) VALUES ('DE LINEA'), ('ESPECIAL'), ('NORMAL'), ('DESCONTINUADO');

-- Estado de producto
INSERT INTO EstadoProducto (Estado) VALUES ('REVISADO Y ACEPTADO'), ('PENDIENTE'), ('DESCONTINUADO');