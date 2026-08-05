const { Contract, ContractViewer } = require('./Contract');
const User = require('./User');
const ContractFile = require('./ContractFile');
const ContractHistory = require('./ContractHistory');
const Otrosi = require('./Otrosi');
const OtrosiFile = require('./OtrosiFile');
const RejectedUser = require('./RejectedUser');

// Asociaciones existentes
Contract.belongsTo(User, { foreignKey: 'solicitanteId', as: 'solicitante' });
Contract.belongsToMany(User, { through: ContractViewer, as: 'viewers', foreignKey: 'contractId' });
User.belongsToMany(Contract, { through: ContractViewer, as: 'viewedContracts', foreignKey: 'userId' }); 
ContractFile.belongsTo(Contract, { foreignKey: 'contractId', as: 'associatedContract' }); 
Contract.hasMany(ContractFile, { foreignKey: 'contractId', as: 'files' });

// Asociaciones para ContractHistory
ContractHistory.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
ContractHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Contract.hasMany(ContractHistory, { foreignKey: 'contractId', as: 'history' });
User.hasMany(ContractHistory, { foreignKey: 'userId', as: 'contractHistory' }); 

// Asociaciones para Otrosi
Contract.hasMany(Otrosi, { foreignKey: 'contractId', as: 'otrosi' });
Otrosi.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });

// Asociaciones para OtrosiFile
Otrosi.hasMany(OtrosiFile, { foreignKey: 'otrosiId', as: 'files' });
OtrosiFile.belongsTo(Otrosi, { foreignKey: 'otrosiId', as: 'otrosi' });
OtrosiFile.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
OtrosiFile.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(OtrosiFile, { foreignKey: 'uploadedBy', as: 'uploadedOtrosiFiles' });

// Asociaciones para RejectedUser
RejectedUser.belongsTo(User, { foreignKey: 'rejectedBy', as: 'rejector' });
User.hasMany(RejectedUser, { foreignKey: 'rejectedBy', as: 'rejectedUsers' });

//