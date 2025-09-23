-- Performance Optimization Indexes for Contract Management System
-- Run this script to add database indexes for better query performance

-- Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_estado ON contracts(estado);
CREATE INDEX IF NOT EXISTS idx_contracts_solicitante_estado ON contracts(solicitanteId, estado);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_id_desc ON contracts(id DESC);

-- Otrosi table indexes  
CREATE INDEX IF NOT EXISTS idx_otrosi_contract ON otrosi(contractId);
CREATE INDEX IF NOT EXISTS idx_otrosi_estado ON otrosi(estado);
CREATE INDEX IF NOT EXISTS idx_otrosi_contract_estado ON otrosi(contractId, estado);

-- Contract Files indexes
CREATE INDEX IF NOT EXISTS idx_contract_files_contract ON contract_files(contractId);
CREATE INDEX IF NOT EXISTS idx_contract_files_created_at ON contract_files(created_at);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Contract Viewers junction table indexes
CREATE INDEX IF NOT EXISTS idx_contract_viewers_contract ON contract_viewers(contractId);
CREATE INDEX IF NOT EXISTS idx_contract_viewers_user ON contract_viewers(userId);

-- Contract History indexes
CREATE INDEX IF NOT EXISTS idx_contract_history_contract ON contract_history(contractId);
CREATE INDEX IF NOT EXISTS idx_contract_history_created_at ON contract_history(created_at);

PRINT 'Performance indexes added successfully!';
