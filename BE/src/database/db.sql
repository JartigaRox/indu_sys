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
delete  from Clientes;
DBCC CHECKIDENT ('Clientes', RESEED, 0);
SELECT * FROM Pedidos;

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

-- =============================================
--INSERTAR LOS DEPARTAMENTOS, MUNICIPIOS Y DISTRITOS
-- =============================================

--1. INSERTAR DEPARTAMENTOS
INSERT INTO Departamentos (Nombre) VALUES 
('AHUACHAPÁN'),--1
('SAN SALVADOR'),--2
('LA LIBERTAD'),--3
('SANTA ANA'),--4
('SONSONATE'),--5
('CHALATENANGO'),--6
('CUSCATLÁN'),--7
('LA PAZ'),--8
('SAN VICENTE'),--9
('USULUTÁN'),--10
('SAN MIGUEL'),--11
('LA UNIÓN'),--12
('MORAZÁN'),--13
('CABAÑAS');--14

--2. INSERTAR MUNICIPIOS
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
--AHUACHAPÁN
('Ahuachapán Norte', 1),--1
('Ahuachapán Centro', 1),--2
('Ahuachapán Sur', 1),--3
--SAN SALVADOR
('San Salvador Norte', 2),--4
('San Salvador Oeste',2),--5
('San Salvador Este',2),--6
('San Salvador Centro',2),--7
('San Salvador Sur',2),--8
--LA LIBERTAD
('La Libertad Norte',3),--9
('La Libertad Centro',3),--10
('La Libertad Oeste',3),--11
('La Libertad Este',3),--12
('La Libertad Costa',3),--13
('La Libertad Sur',3);--14
--SANTA ANA
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('Santa Ana Norte',4),--15
('Santa Ana Centro',4),--16
('Santa Ana Este',4),--17
('Santa Ana Oeste',4),--18
-- SONSONATE
('Sonsonate Norte',5),--19
('Sonsonate Centro',5),--20
('Sonsonate Este',5),--21
('Sonsonate Oeste',5);--22
--CHALATENANGO
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('Chalatenango Norte',6),--23
('Chalatenango Centro',6),--24
('Chalatenango Sur',6);--25
--CUSCATLÁN
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('Cuscatlán Norte',7),--26
('Cuscatlán Sur',7);--27
--LA PAZ
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('La Paz Oeste',8),--28
('La Paz Centro',8),--29
('La Paz Este',8);--30
--SAN VICENTE
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('San Vicente Norte',9),--31
('San Vicente Sur',9);--32
--USULUTÁN
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('Usulután Norte',10),--33
('Usulután Este',10),--34
('Usulután Oeste',10);--35
--SAN MIGUEL
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('San Miguel Norte',11),--36
('San Miguel Centro',11),--37
('San Miguel Oeste',11);--38
--LA UNIÓN
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('La Unión Norte',12),--39
('La Unión Sur',12);--40
--MORAZÁN
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('Morazán Norte',13),--41
('Morazán Sur',13);--42
--CABAÑAS
INSERT INTO Municipios(Nombre, DepartamentoID) VALUES 
('Cabañas Este',14),--43
('Cabañas Oeste',14);--44

--3. INSERTAR DISTRITOS
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--AHUACHAPÁN
--AHUACHAPÁN NORTE
('Atiquizaya',1),
('El Refugio',1),
('San Lorenzo',1),
('Turín',1),
--AHUACHAPÁN CENTRO
('Ahuachapán',2),
('Apaneca',2),
('Concepción de Ataco',2),
('Tacuba',2),
--AHUACHAPÁN SUR
('Guaymango',3),
('Jujutla',3),
('San Francisco Menéndez',3),
('San Pedro Puxtla',3);
--SAN SALVADOR
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--SAN SALVADOR NORTE
('Aguilares',4),
('El Paisnal',4),
('Guazapa',4),
--SAN SALVADOR OESTE
('Apopa',5),
('Nejapa',5),
--SAN SALVADOR ESTE
('Ilopango',6),
('San Martín',6),
('Soyapango',6),
('Tonacatepeque',6),
--SAN SALVADOR CENTRO
('Ayutuxtepeque',7),
('San Salvador',7),
('Mejicanos',7),
('Cuscatancingo',7),
('Ciudad Delgado',7),
--SAN SALVADOR SUR
('San Marcos',8),
('Panchimalco',8),
('Rosario de Mora',8),
('Santo Tomás',8),
('Santiago Texacuangos',8);

--LA LIBERTAD
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--LA LIBERTAD NORTE
('Quezaltepeque',9),
('San Matías',9),
('San Pablo Tacachico',9),
--La Libertad CENTRO
('San Juan Opico',10),
('Ciudad Arce',10),
--LA LIBERTAD OESTE
('Colón',11),
('Jayaque',11),
('Sacacoyo',11),
('Tepecoyo',11),
('Talnique',11),
--LA LIBERTAD ESTE
('Antiguo Cuscatlán',12),
('Huizúcar',12),
('Nuevo Cuscatlán',12),
('San José Villanueva',12),
('Zaragoza',12),
--LA LIBERTAD COSTA
('Chiltiupán',13),
('Tamanique',13),
('La Libertad',13),
('Jicalapa',13),
('Teotepeque',13),
--LA LIBERTAD SUR
('Comasagua',14),
('Santa Tecla',14);

---SANTA ANA
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--SANTA ANA NORTE
('Masahuat',15),
('Metapán',15),
('Santa Rosa Guachipilín',15),
('Texistepeque',15),
--SANTA ANA CENTRO
('Santa Ana',16),
--SANTA ANA ESTE
('Coatepeque',17),
('El Congo',17),
--SANTA ANA OESTE
('Candelaria de la Frontera',18),
('Chalchuapa',18),
('El Porvenir',18),
('San Antonio Pajonal',18),
('San Sebastián Salitrillo',18),
('Santiago de la Frontera',18);

---SONSONATE
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--SONSONATE NORTE
('Juayua',19),
('Nahuizalco',19),
('Salcoatitán',19),
('Santa Catarina Masahuat',19),
--SONSONATE CENTRO
('Sonsonate',20),
('Sonzacate',20),
('Nahulingo',20),
('San Antonio del Monte',20),
('Santo Domingo de Guzmán',20),
--SONSONATE ESTE
('Armenia',21),
('Caluco',21),
('San Julián',21),
('Izalco',21),
('Cuisnahuat',21),
('Santa Isabel Ishuatan',21),
--SONSONATE OESTE
('Acajutla',22);

--CHALATENANGO
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--CHALATENANGO NORTE
('La Palma',23),
('Citalá',23),
('San Ignacio',23),
--CHALATENANGO CENTRO
('Nueva Concepción',24),
('Tejutla',24),
('La Reina',24),
('Agua Caliente',24),
('Dulce Nombre de Maria',24),
('El Paraíso',24),
('San Francisco Morazan',24),
('San Rafael',24),
('Santa Rita',24),
('San Fernando',24),
--CHALATENANGO SUR
('Chalatenango',25),
('Arcatao',25),
('Azacualpa',25),
('Comalapa',25),
('Concepción Quezaltepeque',25),
('El Carrizal',25),
('La Laguna',25),
('Las Vueltas',25),
('Nombre de Jesús',25),
('Nueva Trinidad',25),
('Ojos de Agua',25),
('Potonico',25),
('San Antonio de La Cruz',25),
('San Antonio Los Ranchos',25),
('San Francisco Lempa',25),
('San Isidro Labrador',25),
('San José Cancasque',25),
('San Miguel de Mercedes',25),
('San José Las Flores',25),
('San Luis del Carmen',25);

--CUSCATLÁN
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--CUSCATLÁN NORTE
('Suchitoto',26),
('San José Guayabal',26),
('Oratorio de Concepción',26),
('San Bartolomé Perulapán',26),
('San Pedro Perulapán',26),
--CUSCATLÁN SUR
('Cojutepeque',27),
('San Rafael Cedros',27),
('Candelaria',27),
('Monte San Juan',27),
('El Carmen',27),
('San Cristóbal',27),
('Santa Cruz Michapa',27),
('San Ramon',27),
('El Rosario',27),
('Santa Cruz Analquito',27),
('Tenancingo',27);
--LA PAZ
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--LA PAZ OESTE
('Cuyultitán',28),
('Olocuilta',28),
('San Juan Talpa',28),
('San Luis Talpa',28),
('San Pedro Masahuat',28),
('Tapalhuaca',28),
('San Francisco Chinameca',28),
--LA PAZ CENTRO
('El Rosario',29),
('Jerusalén',29),
('Mercedes La Ceiba',29),
('Paraíso de Osorio',29),
('San Antonio Masahuat',29),
('San Emigdio',29),
('San Juan Tepezontes',29),
('San Luis La Herradura',29),
('San Miguel Tepezontes',29),
('San Pedro Nonualco',29),
('Santa María Ostuma',29),
('Santiago Nonualco',29),
--LA PAZ ESTE
('Zacatecoluca',30),
('San Juan Nonualco',30),
('San Rafael Obrajuelo',30);

--SAN VICENTE
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--SAN VICENTE NORTE
('Apastepeque',31),
('Santa Clara',31),
('San Ildefonso',31),
('San Esteban Catarina',31),
('San Sebastian',31),
('San Lorenzo',31),
('Santo Domingo',31),
--SAN VICENTE SUR
('San Vicente',32),
('Guadalupe',32),
('Verapaz',32),
('Tepetitán',32),
('Tecoluca',32),
('San Cayetano Istepeque',32);

--USULUTÁN
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--USULUTÁN NORTE
('Santiago de María',33),
('Alegría',33),
('Berlín',33),
('Mercedes Umaña',33),
('Jucuapa',33),
('El Triunfo',33),
('Estanzuelas',33),
('San Buenaventura',33),
('Nueva Granada',33),
--USULUTÁN ESTE
('Usulután',34),
('Jucuarán',34),
('San Dionisio',34),
('Concepcíon Batres',34),
('Santa María',34),
('Ozatlán',34),
('Tecapán',34),
('Santa Elena',34),
('California',34),
('Ereguayquín',34),
--USULUTÁN OESTE
('Jiquilisco',35),
('Puerto El Triunfo',35),
('San Agustin',35),
('San Francisco Javier',35);

--SAN MIGUEL
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--SAN MIGUEL NORTE
('Ciudad Barrios',36),
('Sesori',36),
('Nuevo Edén de San Juan',36),
('San Gerardo',36),
('San Luis de la Reina',36),
('Carolina',36),
('San Antonio del Mosco',36),
('Chapeltique',36),
--SAN MIGUEL CENTRO
('San Miguel',37),
('Comacarán',37),
('Uluazapa',37),
('Moncagua',37),
('Quelepa',37),
('Chirilagua',37),
--SAN MIGUEL OESTE
('Chinameca',38),
('Nueva Guadalupe',38),
('Lolotique',38),
('San Jorge',38),
('San Rafael Oriente',38),
('El Tránsito',38);

--LA UNIÓN
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--LA UNIÓN NORTE
('Anamorós',39),
('Bolivar',39),
('Concepcion de Oriente',39),
('El Sauce',39),
('Lislique',39),
('Nueva Esparta',39),
('Pasaquina',39),
('Polorós',39),
('San José La Fuente',39),
('Santa Rosa de Lima',39),
--LA UNIÓN SUR
('Conchagua',40),
('El Carmen',40),
('Intipucá',40),
('La Unión',40),
('Meanguera del Golfo',40),
('San Alejo',40),
('Yayantique',40),
('Yucuaiquín',40);

--MORAZÁN
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--MORAZÁN NORTE
('Arambala',41),
('Cacaopera',41),
('Corinto',41),
('El Rosario',41),
('Joateca',41),
('Jocoaitique',41),
('Meanguera',41),
('Perquín',41),
('San Fernando',41),
('San Isidro',41),
('Torola',41),

--MORAZÁN SUR
('Chilanga',42),
('El Divisadero',42),
('Delicias de Concepción',42),
('Gualococti',42),
('Guatajiagua',42),
('Jocoro',42),
('Lolotiquillo',42),
('Osicala',42),
('San Carlos',42),
('San Francisco Gotera',42),
('San Simón',42),
('Sesembra',42),
('Sociedad',42),
('Yamabal',42),
('Yoloaiquín',42);

---CABAÑAS
INSERT INTO Distritos(Nombre, MunicipioID) VALUES
--CABAÑAS ESTE
('Sensuntepeque',43),
('Victoria',43),
('Dolores',43),
('Guacotecti',43),
('San Isidro',43),

--CABAÑAS OESTE
('Ilobasco',44),
('Jutiapa',44),
('Tejutepeque',44),
('Cinquera',44);

ALTER TABLE Cotizaciones ADD Estado NVARCHAR(20) DEFAULT 'Pendiente';

SELECT * FROM Productos;


-- 1. CAMBIOS EN USUARIOS (Para recuperar contraseña)
ALTER TABLE Usuarios ADD CorreoElectronico NVARCHAR(150);
GO

-- 2. CAMBIOS PARA MULTI-EMPRESA (Las 2 empresas)
CREATE TABLE Empresas (
    EmpresaID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Direccion NVARCHAR(200),
    NRC NVARCHAR(50),
    Telefono NVARCHAR(20),
    CorreoElectronico NVARCHAR(150),
    PaginaWeb NVARCHAR(150)
);
GO
-- Insertamos las 2 empresas por defecto
INSERT INTO Empresas (Nombre, Direccion, NRC,Telefono,CorreoElectronico,PaginaWeb) VALUES ('Empresa A S.A. de C.V.', 'San Salvador','1234-5','1111-1111','empresa1@prueba.com','www.gp.com');
INSERT INTO Empresas (Nombre, Direccion, NRC,Telefono,CorreoElectronico,PaginaWeb) VALUES ('Empresa B Solutions', 'Santa Tecla','1234-6','2222-2222','empresa2@prueba.com','www.gp.com');
GO

SELECT * FROM Empresas;
-- Agregamos la relación en Cotizaciones
-- Verificar si la columna EmpresaID ya existe antes de agregarla
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Cotizaciones') AND name = 'EmpresaID')
BEGIN
    ALTER TABLE Cotizaciones ADD EmpresaID INT DEFAULT 1;
END
GO
ALTER TABLE Cotizaciones ADD CONSTRAINT FK_Cotizaciones_Empresas FOREIGN KEY (EmpresaID) REFERENCES Empresas(EmpresaID);
GO

-- 3. CAMBIOS EN PRODUCTOS (Categorías y Subcategorías)
CREATE TABLE Categorias (
    CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoCategoria NVARCHAR(3) NOT NULL -- Ej: OFI
);

SELECT * FROM Categorias;

CREATE TABLE Subcategorias (
    SubcategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoSubcategoria NVARCHAR(3) NOT NULL, -- Ej: ARM
    CategoriaID INT NOT NULL,
    FOREIGN KEY (CategoriaID) REFERENCES Categorias(CategoriaID)
);
GO

DELETE FROM Categorias;
DELETE FROM Subcategorias;
CREATE TABLE Categorias (
    CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoCategoria NVARCHAR(3) NOT NULL, -- Ej: OFI
    Nombre NVARCHAR(100) NOT NULL
);
ALTER TABLE Categorias ADD Nombre NVARCHAR(100) NOT NULL;

CREATE TABLE Subcategorias (
    SubcategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoSubcategoria NVARCHAR(3) NOT NULL, -- Ej: ARM
    Nombre NVARCHAR(100) NOT NULL,
    CategoriaID INT NOT NULL,
    FOREIGN KEY (CategoriaID) REFERENCES Categorias(CategoriaID)
);

ALTER TABLE Subcategorias ADD Nombre NVARCHAR(100) NOT NULL;

SELECT * FROM Categorias;

INSERT INTO Categorias (CodigoCategoria, Nombre) VALUES 
('OFI', 'OFICINA'), ('ESC', 'ESCOLARES'), ('HOS', 'HOSPITALARIOS'), ('INOX', 'ACERO INOXIDABLE'), ('RECR', 'RECREATIVOS'), ('OTR', 'OTROS');
INSERT INTO Subcategorias (CodigoSubcategoria, Nombre, CategoriaID) VALUES 
('ARM', 'ARMARIOS', 1), ('ARCH', 'ARCHIVOS', 1), ('MCOM', 'MUEBLES PARA COMPUTADORA', 1),('MCOM', 'MUEBLES PARA COMPUTADORA', 1),
('ESCR', 'ESCRITORIOS', 1), ('EST', 'ESTANTES', 1), ('LOC', 'LOCKERS', 1),
('LIB', 'LIBRERAS', 1), ('MES', 'MESAS', 1), ('REC', 'MUEBLES PARA RECEPCION', 1), ('SEJE', 'SILLAS ERGONOMICAS Y EJECUTIVAS', 1),
('SEST', 'SILLAS PARA ESTUDIANTES', 2), ('PIZ', 'PIZARRAS', 2), ('PUP', 'PUPITRES', 2),
('PARV', 'PARVULARIA', 2), ('HOSP', 'HOSPITALARIOS', 3), ('AINX', 'MUEBLES EN ACERO INOXIDABLE', 4),
('MLAB', 'MUEBLES PARA LABORATORIO', 4), ('RECT', 'RECREATIVOS', 5), ('CARR', 'CARRETILLAS', 6),
('MSES', 'MODULOS DE SILLA DE ESPERA', 6),('POD', 'PODIUMS', 6),('OTRS', 'OTROS', 6),
('BIB', 'BIBLIOTECA', 2),('DIVE', 'DIVERSOS ESCOLARES', 2);

-- Modificar tabla Productos para vincular Subcategoría (y quitar código manual si quieres, aunque lo dejaremos para llenarlo auto)
ALTER TABLE Productos ADD SubcategoriaID INT;
ALTER TABLE Productos ADD CONSTRAINT FK_Productos_Subcategorias FOREIGN KEY (SubcategoriaID) REFERENCES Subcategorias(SubcategoriaID);
GO

-- Modificar el tamaño de las columnas NVARCHAR para evitar truncamiento
ALTER TABLE Categorias ALTER COLUMN CodigoCategoria NVARCHAR(25);
ALTER TABLE Subcategorias ALTER COLUMN CodigoSubcategoria NVARCHAR(50);
GO


Select * FROM DetalleCotizaciones;
DELETE FROM Productos;
DELETE FROM DetalleCotizaciones;

DBCC CHECKIDENT ('Subcategorias', RESEED, 0);

-- 1. Agregar campos a Cotizaciones
-- Fecha de entrega estimada
ALTER TABLE Cotizaciones ADD FechaEntregaEstimada DATETIME;
-- Usuario que aceptó o rechazó (Guardaremos el nombre para el historial)
ALTER TABLE Cotizaciones ADD UsuarioDecision NVARCHAR(50);
GO

select * from Cotizaciones;