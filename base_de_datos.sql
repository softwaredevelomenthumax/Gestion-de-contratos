/* =========================================
   1. BASE DE DATOS
========================================= */
CREATE DATABASE [Contract management];
GO

USE [Contract management];
GO


/* =========================================
   2. TABLA: USERS (BASE PRINCIPAL)
========================================= */
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) NOT NULL,
    first_name NVARCHAR(255) NOT NULL,
    last_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(255) NOT NULL,
    status NVARCHAR(255) NOT NULL,
    CONSTRAINT PK_users PRIMARY KEY (id),
    CONSTRAINT UQ_users_email UNIQUE (email)
);
GO


/* =========================================
   3. TABLA: CONTRACTS
========================================= */
CREATE TABLE dbo.contracts (
    id INT IDENTITY(1,1) NOT NULL,
    tipo_solicitud NVARCHAR(255) NOT NULL,
    tipo_contrato NVARCHAR(255) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    area NVARCHAR(255) NOT NULL,
    gerente_area NVARCHAR(255) NOT NULL,
    proveedor NVARCHAR(255) NOT NULL,
    nit_proveedor NVARCHAR(255) NOT NULL,
    valor_sin_i_v_a DECIMAL(20,2) NOT NULL,
    valor_i_v_a DECIMAL(20,2) NOT NULL,
    moneda NVARCHAR(255) NOT NULL,
    fecha_inicio DATETIMEOFFSET(7) NOT NULL,
    fecha_final DATETIMEOFFSET(7) NOT NULL,
    duracion INT NOT NULL,
    estado NVARCHAR(255) NOT NULL,
    lawyer_comment NVARCHAR(MAX) NULL,
    nombre_solicitante NVARCHAR(255) NOT NULL,
    forma_pago NVARCHAR(255) NOT NULL,
    fecha_ingreso DATETIMEOFFSET(7) NOT NULL,
    descripcion_otrosi NVARCHAR(MAX) NULL,
    es_otrosi BIT NOT NULL,
    contrato_original_id INT NULL,
    valor_otrosi DECIMAL(20,2) NULL,
    iva_otrosi DECIMAL(20,2) NULL,
    moneda_otrosi NVARCHAR(255) NULL,
    solicitanteId INT NULL,
    CONSTRAINT PK_contracts PRIMARY KEY (id)
);
GO


/* =========================================
   4. TABLA: REJECTED_USERS
========================================= */
CREATE TABLE dbo.rejected_users (
    id INT IDENTITY(1,1) NOT NULL,
    first_name NVARCHAR(255) NOT NULL,
    last_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    role NVARCHAR(255) NOT NULL,
    rejected_at DATETIMEOFFSET(7) NOT NULL,
    rejected_by INT NOT NULL,
    CONSTRAINT PK_rejected_users PRIMARY KEY (id)
);
GO


/* =========================================
   5. TABLA: CONTRACT_VIEWERS
========================================= */
CREATE TABLE dbo.contract_viewers (
    contractId INT NOT NULL,
    userId INT NOT NULL,
    CONSTRAINT PK_contract_viewers PRIMARY KEY (contractId, userId)
);
GO


/* =========================================
   6. TABLA: CONTRACT_HISTORY
========================================= */
CREATE TABLE dbo.contract_history (
    id INT IDENTITY(1,1) NOT NULL,
    contract_id INT NOT NULL,
    user_id INT NULL,
    role NVARCHAR(255) NOT NULL,
    action NVARCHAR(255) NOT NULL,
    old_status NVARCHAR(255) NULL,
    new_status NVARCHAR(255) NULL,
    comment NVARCHAR(MAX) NULL,
    file_id INT NULL,
    timestamp DATETIMEOFFSET(7) NOT NULL,
    CONSTRAINT PK_contract_history PRIMARY KEY (id)
);
GO


/* =========================================
   7. TABLA: OTROSI
========================================= */
CREATE TABLE dbo.otrosi (
    id INT IDENTITY(1,1) NOT NULL,
    contract_id INT NOT NULL,
    numero_otrosi INT NOT NULL,
    descripcion_cambios NVARCHAR(MAX) NOT NULL,
    valor_total DECIMAL(20,2) NULL,
    moneda NVARCHAR(10) NULL,
    porcentaje_iva DECIMAL(5,2) NULL,
    valor_iva DECIMAL(20,2) NULL,
    forma_pago NVARCHAR(100) NULL,
    fecha_inicio DATETIMEOFFSET(7) NULL,
    fecha_final DATETIMEOFFSET(7) NULL,
    estado NVARCHAR(255) NOT NULL,
    carta_solicitud_path NVARCHAR(500) NULL,
    firmar_otrosi_path NVARCHAR(500) NULL,
    firma_abogado_path NVARCHAR(500) NULL,
    comentarios_abogado NVARCHAR(MAX) NULL,
    fecha_creacion DATETIMEOFFSET(7) NOT NULL,
    fecha_aprobacion DATETIMEOFFSET(7) NULL,
    fecha_devolucion DATETIMEOFFSET(7) NULL,
    firmado_por_usuario BIT NOT NULL,
    enviar_otrosi_path VARCHAR(500) NULL,
    CONSTRAINT PK_otrosi PRIMARY KEY (id)
);
GO


/* =========================================
   8. TABLA: CONTRACTFILES
========================================= */
CREATE TABLE dbo.ContractFiles (
    id INT IDENTITY(1,1) NOT NULL,
    filename NVARCHAR(255) NOT NULL,
    filepath NVARCHAR(255) NOT NULL,
    category NVARCHAR(255) NULL,
    file_type NVARCHAR(255) NULL,
    response_type NVARCHAR(255) NULL,
    contract_id INT NULL,
    drive_file_id NVARCHAR(255) NULL,
    drive_web_view_link NVARCHAR(255) NULL,
    drive_web_content_link NVARCHAR(255) NULL,
    created_at DATETIMEOFFSET(7) NOT NULL,
    updated_at DATETIMEOFFSET(7) NOT NULL,
    CONSTRAINT PK_ContractFiles PRIMARY KEY (id)
);
GO


/* =========================================
   9. TABLA: OTROSI_FILES
========================================= */
CREATE TABLE dbo.otrosi_files (
    id INT IDENTITY(1,1) NOT NULL,
    otrosi_id INT NOT NULL,
    contract_id INT NOT NULL,
    filename NVARCHAR(255) NOT NULL,
    filepath NVARCHAR(500) NOT NULL,
    mimetype NVARCHAR(100) NULL,
    size INT NULL,
    category NVARCHAR(255) NULL,
    file_type NVARCHAR(255) NULL,
    response_type NVARCHAR(255) NULL,
    uploaded_by INT NULL,
    uploaded_at DATETIMEOFFSET(7) NULL,
    CONSTRAINT PK_otrosi_files PRIMARY KEY (id)
);
GO


/* =========================================
   10. INDICES
========================================= */
CREATE UNIQUE INDEX IX_otrosi_contract_numero
ON dbo.otrosi (contract_id, numero_otrosi);

CREATE INDEX IX_otrosi_files_contract_id
ON dbo.otrosi_files (contract_id);

CREATE INDEX IX_otrosi_files_otrosi_id
ON dbo.otrosi_files (otrosi_id);

CREATE INDEX IX_otrosi_files_uploaded_by
ON dbo.otrosi_files (uploaded_by);
GO


/* =========================================
   11. DEFAULTS
========================================= */
ALTER TABLE dbo.users ADD CONSTRAINT DF_users_role DEFAULT ('regular') FOR role;
ALTER TABLE dbo.users ADD CONSTRAINT DF_users_status DEFAULT ('pending') FOR status;

ALTER TABLE dbo.contracts ADD CONSTRAINT DF_contracts_estado DEFAULT ('new') FOR estado;
ALTER TABLE dbo.contracts ADD CONSTRAINT DF_contracts_es_otrosi DEFAULT (0) FOR es_otrosi;

ALTER TABLE dbo.otrosi ADD CONSTRAINT DF_otrosi_estado DEFAULT ('pendiente') FOR estado;
ALTER TABLE dbo.otrosi ADD CONSTRAINT DF_otrosi_firmado DEFAULT (0) FOR firmado_por_usuario;
GO


/* =========================================
   12. FOREIGN KEYS
========================================= */

-- rejected_users -> users
ALTER TABLE dbo.rejected_users
ADD CONSTRAINT FK_rejected_users_users
FOREIGN KEY (rejected_by) REFERENCES dbo.users(id);

-- contracts -> users
ALTER TABLE dbo.contracts
ADD CONSTRAINT FK_contracts_users
FOREIGN KEY (solicitanteId) REFERENCES dbo.users(id)
ON DELETE SET NULL;

-- otrosi -> contracts
ALTER TABLE dbo.otrosi
ADD CONSTRAINT FK_otrosi_contracts
FOREIGN KEY (contract_id) REFERENCES dbo.contracts(id)
ON DELETE CASCADE;

-- ContractFiles -> contracts
ALTER TABLE dbo.ContractFiles
ADD CONSTRAINT FK_ContractFiles_contracts
FOREIGN KEY (contract_id) REFERENCES dbo.contracts(id)
ON DELETE SET NULL;

-- contract_viewers
ALTER TABLE dbo.contract_viewers
ADD CONSTRAINT FK_contract_viewers_contract
FOREIGN KEY (contractId) REFERENCES dbo.contracts(id)
ON DELETE CASCADE;

ALTER TABLE dbo.contract_viewers
ADD CONSTRAINT FK_contract_viewers_user
FOREIGN KEY (userId) REFERENCES dbo.users(id)
ON DELETE CASCADE;

-- contract_history
ALTER TABLE dbo.contract_history
ADD CONSTRAINT FK_contract_history_contract
FOREIGN KEY (contract_id) REFERENCES dbo.contracts(id);

ALTER TABLE dbo.contract_history
ADD CONSTRAINT FK_contract_history_user
FOREIGN KEY (user_id) REFERENCES dbo.users(id)
ON DELETE SET NULL;

-- otrosi_files
ALTER TABLE dbo.otrosi_files
ADD CONSTRAINT FK_otrosi_files_contract
FOREIGN KEY (contract_id) REFERENCES dbo.contracts(id);

ALTER TABLE dbo.otrosi_files
ADD CONSTRAINT FK_otrosi_files_otrosi
FOREIGN KEY (otrosi_id) REFERENCES dbo.otrosi(id)
ON DELETE CASCADE;

ALTER TABLE dbo.otrosi_files
ADD CONSTRAINT FK_otrosi_files_user
FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id)
ON DELETE SET NULL;
GO