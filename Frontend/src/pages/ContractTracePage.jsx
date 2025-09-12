import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getContract, getContractHistory } from '../api/contracts';
import { getOtrosiByContract } from '../api/otrosi';
import ContractTraceDetail from './ContractTraceDetail';
import LoadingAnimation from '../components/LoadingAnimation';

const ContractTracePage = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [history, setHistory] = useState([]);
  const [otrosi, setOtrosi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyOrder, setHistoryOrder] = useState('oldest');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const contractData = await getContract(id);
        setContract(contractData);
        const historyData = await getContractHistory(id);
        setHistory(historyData);
        
        // Cargar otrosí para mostrar en trazabilidad
        try {
          const otrosiData = await getOtrosiByContract(id);
          setOtrosi(otrosiData);
        } catch (err) {
          console.log('No hay otrosí para este contrato:', err);
          setOtrosi([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingAnimation text="Cargando trazabilidad del contrato..." />;
  if (!contract) return <div className="text-center py-10 text-gray-500">Contrato no encontrado.</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <ContractTraceDetail
        contract={contract}
        history={history}
        otrosi={otrosi}
        historyOrder={historyOrder}
        setHistoryOrder={setHistoryOrder}
      />
    </div>
  );
};

export default ContractTracePage; 