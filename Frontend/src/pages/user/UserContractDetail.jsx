import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getContract } from '../../api/contracts';
import ContractDetailSkeleton from '../../components/ContractDetailSkeleton';
// Importar subcomponentes por estado
import UserAwaitingUserResponse from './userStates/UserAwaitingUserResponse';
import UserAwaitingSignature from './userStates/UserAwaitingSignature';
import UserReturned from './userStates/UserReturned';
import UserFirmado from './userStates/UserFirmado';
import UserVencido from './userStates/UserVencido';
import UserDefault from './userStates/UserDefault';

const UserContractDetail = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        console.log('🔍 Fetching contract with ID:', id);
        console.log('🌐 API call: GET /contracts/' + id);
        const data = await getContract(id);
        console.log('📋 Contract data received:', data);
        console.log('📁 Files in contract:', data.files ? data.files.length : 'No files property');
        console.log('📄 Files details:', data.files);
        setContract(data);
      } catch (error) {
        console.error('❌ Error fetching contract:', error);
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
