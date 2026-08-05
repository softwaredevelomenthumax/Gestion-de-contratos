import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getContract } from '../api/contracts';
import ContractDetailSkeleton from '../components/ContractDetailSkeleton';
import ContractFullDetail from '../components/ContractFullDetail';

const AdminContractDetail = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await getContract(id);
        setContract(data);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.error || 'Error al cargar el contrato');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  if (loading) return <ContractDetailSkeleton />;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (!contract) return <div className="text-center text-gray-500 py-10">Contrato no encontrado.</div>;

  return <ContractFullDetail contract={contract} />;
};

export default AdminContractDetail;
