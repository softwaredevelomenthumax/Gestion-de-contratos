import { useAuth } from '../hooks/useAuth';
import { FileText, Users, CheckCircle, MessageSquare, ThumbsUp } from 'lucide-react';
import ActionCard from '../components/ActionCard';
import LottieAnimation from '../components/LottieAnimation';
import lawAnimation from '../assets/animations/law.json';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const copy = (en, es) => (isEnglish ? en : es);

  const actions = [
    ['Sent Contracts', 'Contratos enviados', 'View and manage your sent contracts', 'Visualiza y gestiona tus contratos enviados', '/my_contracts', FileText, 'from-lime-400 to-lime-600', 'regular'],
    ['New Contracts', 'Contratos nuevos', 'Review and assign newly received contracts', 'Revisa y asigna los nuevos contratos recibidos', '/lawyer_new_contracts', Users, 'from-gray-500 to-gray-600', 'lawyer'],
    ['Reviewed Contracts', 'Contratos revisados', 'Contracts reviewed by Legal that are awaiting a user response', 'Contratos que han sido revisados por el área legal y están pendientes de respuesta por el usuario', '/lawyer_managed_contracts', CheckCircle, 'from-yellow-500 to-yellow-600', 'lawyer'],
    ['Returned Contracts', 'Contratos devueltos', 'Contracts that require your response or action', 'Contratos que requieren una respuesta o acción de tu parte', '/lawyer_awaiting_review_contracts', MessageSquare, 'from-purple-500 to-purple-600', 'lawyer'],
    ['Contracts to Respond To', 'Contratos para responder', 'Contracts that require your response or action', 'Contratos que requieren una respuesta o acción de tu parte', '/user_awaiting_response_contracts', MessageSquare, 'from-purple-500 to-purple-600', 'regular'],
    ['Contracts Awaiting User Signature', 'Contratos a la espera de firma del usuario', "Contracts signed by the Humax legal representative and awaiting the user's signature", 'Contratos que ha firmado el representante legal Humax y esperan la firma del usuario', '/LawyerAwaitingSignature', ThumbsUp, 'from-teal-500 to-teal-600', 'lawyer'],
    ['Contracts Awaiting Your Signature', 'Contratos a la espera de tu firma', 'Contracts signed by the Humax legal representative and awaiting your signature', 'Contratos que han sido firmados por el representante legal Humax y esperan la firma del usuario', '/AwaitingSignature', ThumbsUp, 'from-teal-500 to-teal-600', 'regular'],
    ['Completed Contracts', 'Contratos finalizados', 'Contracts that have completed the signing process', 'Contratos que han completado el ciclo de firma', '/lawyer_ended', ThumbsUp, 'from-green-500 to-green-600', 'lawyer'],
    ['Completed Contracts', 'Contratos finalizados', 'Contracts that have completed the signing process', 'Contratos que han completado el ciclo de firma', '/user_ended', ThumbsUp, 'from-green-500 to-green-600', 'regular']
  ].map(([enName, esName, enDescription, esDescription, href, icon, color, role]) => ({
    name: copy(enName, esName), description: copy(enDescription, esDescription), href, icon, color, role
  }));

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl md:text-6xl">
            {copy('Welcome', '¡Bienvenido')}, {user.firstName}!
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
            {copy('Manage your contracts quickly and easily.', 'Gestiona tus contratos de forma rápida y sencilla.')}
          </p>
          <div className="mt-8 flex justify-center">
            <LottieAnimation animationData={lawAnimation} width="300px" height="200px" loop autoplay speed={1} className="mx-auto" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {actions.filter((action) => action.role === user.role || action.role === 'all').map((action, index) => (
            <ActionCard key={action.href} action={action} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
