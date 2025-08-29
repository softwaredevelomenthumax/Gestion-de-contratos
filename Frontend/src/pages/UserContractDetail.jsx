import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getContract } from '../api/contracts';
import ContractDetailSkeleton from '../components/ContractDetailSkeleton';
// Importar subcomponentes por estado
import UserAwaitingUserResponse from './userStates/UserAwaitingUserResponse';
import UserAwaitingSignature from './userStates/UserAwaitingSignature';
import UserReturned from './userStates/UserReturned';
import UserFirmado from './userStates/UserFirmado';
import UserVencido from './userStates/UserVencido';
import UserDefault from './userStates/UserDefault';

const UserContractDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fromMyContracts = location.state?.fromMyContracts;

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await getContract(id);
        setContract(data);
      } catch {
        setError('Error al cargar el contrato');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  if (loading) return <ContractDetailSkeleton />;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (!contract) return <div className="text-center text-gray-500 py-10">Contrato no encontrado.</div>;

  switch (contract.estado) {
    case 'awaiting_user_response':
      return <UserAwaitingUserResponse contract={contract} />;
    case 'awaiting_signature':
      return <UserAwaitingSignature contract={contract} />;
    case 'signature_otrosi_already_signedByUser':
      return <UserDefault contract={contract} />;
    case 'returned':
    case 'devuelto':
      return <UserReturned contract={contract} />;
    case 'firmado':
      return <UserFirmado contract={contract} />;
    case 'vencido':
      return <UserVencido contract={contract} />;
    default:
      return <UserDefault contract={contract} />;
  }
};

export default UserContractDetail;
