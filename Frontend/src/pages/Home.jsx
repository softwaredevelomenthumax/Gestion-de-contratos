import { useAuth } from "../hooks/useAuth";
import {
  FileText,
  Send,
  Users,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Edit,
  ThumbsUp,
  Clock,
  Search,
} from "lucide-react";
import ActionCard from "../components/ActionCard";
import LottieAnimation from "../components/LottieAnimation";
import lawAnimation from "../assets/animations/law.json";

const Home = () => {
  const { user } = useAuth();

  const actions = [
    {
      name: "Contratos enviados",
      description: "Visualiza y gestiona tus contratos enviados",
      href: "/my_contracts",
      icon: FileText,
      color: "from-lime-400 to-lime-600",
      role: "regular",
    },
    {
      name: "Contratos nuevos",
      description: "Revisa y asigna los nuevos contratos recibidos",
      href: "/lawyer_new_contracts",
      icon: Users,
      color: "from-gray-500 to-gray-600",
      role: "lawyer",
    },
    {
      name: "Contratos revisados",
      description:
        "Contratos que han sido revisados por el área legal y están pendientes de respuesta por el usuario",
      href: "/lawyer_managed_contracts",
      icon: CheckCircle,
      color: "from-yellow-500 to-yellow-600",
      role: "lawyer",
    },
    {
      name: "Contratos devueltos",
      description: "Contratos que requieren una respuesta o acción de tu parte",
      href: "/lawyer_awaiting_review_contracts",
      icon: MessageSquare,
      color: "from-purple-500 to-purple-600",
      role: "lawyer",
    },
    {
      name: "Contratos para responder",
      description: "Contratos que requieren una respuesta o acción de tu parte",
      href: "/user_awaiting_response_contracts",
      icon: MessageSquare,
      color: "from-purple-500 to-purple-600",
      role: "regular",
    },
    {
      name: "Contratos a la espera de firma del usuario",
      description: "Contratos que ha firmado el representante legal Humax y esperan la firma del usuario",
      href: "/LawyerAwaitingSignature",
      icon: ThumbsUp,
      color: "from-teal-500 to-teal-600",
      role: "lawyer",
    },
    {
      name: "Contratos a la espera de tu firma",
      description: "Contratos que han sido firmados por el representante legal Humax y esperan la firma del usuario",
      href: "/AwaitingSignature",
      icon: ThumbsUp,
      color: "from-teal-500 to-teal-600",
      role: "regular",
    },
    {
      name: "Contratos finalizados",
      description: "Contratos que han completado el ciclo de firma",
      href: "/lawyer_ended",
      icon: ThumbsUp,
      color: "from-green-500 to-green-600",
      role: "lawyer",
    },
    {
      name: "Contratos finalizados",
      description: "Contratos que han completado el ciclo de firma",
      href: "/user_ended",
      icon: ThumbsUp,
      color: "from-green-500 to-green-600",
      role: "regular",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl md:text-6xl">
            ¡Bienvenido, {user.firstName}!
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
            Gestiona tus contratos de forma rápida y sencilla.
          </p>
          
          {/* Law Animation */}
          <div className="mt-8 flex justify-center">
            <LottieAnimation
              animationData={lawAnimation}
              width="300px"
              height="200px"
              loop={true}
              autoplay={true}
              speed={1}
              className="mx-auto"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {actions
            .filter(
              (action) => action.role === user.role || action.role === "all"
            )
            .map((action, index) => (
              <ActionCard key={action.name} action={action} index={index} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
