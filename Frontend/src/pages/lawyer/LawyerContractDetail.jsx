import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getContract } from '../../api/contracts';
import ContractDetailSkeleton from '../../components/ContractDetailSkeleton';
// Importar subcomponentes por estado
import LawyerNew from './lawyerStates/LawyerNew';
import LawyerAwaitingLawyerReview from './lawyerStates/LawyerAwaitingLawyerReview';
import LawyerAwaitingSignature from './lawyerStates/LawyerAwaitingSignature';
import LawyerReturned from './lawyerStates/LawyerReturned';
import LawyerFirmado from './lawyerStates/LawyerFirmado';
import LawyerVencido from './lawyerStates/LawyerVencido';
import LawyerDefault from './lawyerStates/LawyerDefault';

const LawyerContractDetail = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  console.log('Contract status:', contract.estado);
  console.log('Contract:', contract);

  switch (contract.estado) {
    case 'new':
      return <LawyerNew contract={contract} />;
    case 'awaiting_lawyer_review':
    case 'otrosi_awaiting_lawyer_review':
      return <LawyerAwaitingLawyerReview contract={contract} />;
    case 'awaiting_signature':
    case 'otrosi_awaiting_signature':
      return <LawyerAwaitingSignature contract={contract} />;
    case 'signature_otrosi_already_signedByUser':
      return <LawyerAwaitingSignature contract={contract} />;
    case 'returned':
    case 'devuelto':
      return <LawyerReturned contract={contract} />;
    case 'firmado':
      return <LawyerFirmado contract={contract} />;
    case 'vencido':
      return <LawyerVencido contract={contract} />;
    default:
      return <LawyerDefault contract={contract} />;
  }
};

export default LawyerContractDetail;
