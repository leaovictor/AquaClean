import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Navigation from "@/react-app/components/Navigation";
import { CreditCard, Check, Star, Calendar, AlertCircle, Loader2 } from "lucide-react";
import type { SubscriptionPlan, Service, UserSubscription } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

export default function Subscription() {
  const { currentUser, session, loading } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, loading, navigate]);

  const fetchData = async () => {
    try {
      // 1. Fetch Plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // 2. Fetch Services (for Pay-Per-Wash)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // 3. Fetch Current Subscription (if any)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_plan_id')
        .eq('id', currentUser?.id)
        .single();

      if (!profileError && profileData?.subscription_status === 'active') {
        setCurrentSubscription({
          plan_id: profileData.subscription_plan_id,
          status: 'active',
          current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // Mock date
          remaining_washes: 999
        } as any);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: 'error', text: 'Falha ao carregar dados.' });
    } finally {
      setDataLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!session) return;
    setProcessing(true);
    setMessage({ type: 'success', text: `Processando assinatura do plano ${plan.name}...` });

    try {
      const response = await fetch(`${functionsBaseUrl}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan_id: plan.id }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Assinatura realizada com sucesso! Redirecionando...' });
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Falha ao assinar plano.' });
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      setMessage({ type: 'error', text: 'Erro de conexão.' });
      setProcessing(false);
    }
  };

  const isSubscriber = currentUser?.profile?.subscription_status === 'active';

  const theme = {
    bg: isSubscriber ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-blue-50 to-cyan-100",
    text: isSubscriber ? "text-white" : "text-gray-900",
    subText: isSubscriber ? "text-gray-300" : "text-gray-600",
    card: isSubscriber ? "bg-slate-800 border-yellow-500/30 shadow-xl shadow-yellow-900/10" : "bg-white border-blue-100 shadow-lg",
    cardPopular: isSubscriber ? "border-yellow-500 scale-105 z-10 shadow-yellow-500/20" : "border-blue-600 scale-105 z-10",
    cardRegular: isSubscriber ? "border-slate-700 hover:border-yellow-500/50" : "border-gray-200 hover:border-blue-300",
    buttonPrimary: isSubscriber ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900" : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white",
    buttonSecondary: isSubscriber ? "bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600" : "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300",
    badge: isSubscriber ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900" : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white",
    iconPrimary: isSubscriber ? "text-yellow-400" : "text-blue-600",
    iconBg: isSubscriber ? "bg-yellow-500/10" : "bg-blue-100",
    checkIcon: isSubscriber ? "text-yellow-400" : "text-green-600",
    checkBg: isSubscriber ? "bg-yellow-500/10" : "bg-green-100",
    benefitsSection: isSubscriber ? "bg-gradient-to-r from-slate-800 to-slate-900 border border-yellow-500/20" : "bg-gradient-to-r from-blue-600 to-cyan-600",
    benefitsText: isSubscriber ? "text-gray-300" : "text-blue-100",
    benefitsTitle: isSubscriber ? "text-white" : "text-white"
  };

  if (loading || dataLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <Loader2 className={`w-12 h-12 animate-spin ${theme.iconPrimary}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${theme.text}`}>
            Escolha Seu Plano
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${theme.subText}`}>
            Economize com nossos planos de assinatura flexíveis. Mais lavagens, melhor custo-benefício e agendamento prioritário.
          </p>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-center justify-center space-x-2 max-w-2xl mx-auto ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Current Subscription */}
        {currentSubscription && (
          <div className={`rounded-2xl border p-6 mb-8 ${theme.card}`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme.text}`}>Assinatura Atual</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${theme.text}`}>
                  {plans.find(p => p.id === currentSubscription.plan_id)?.name || 'Plano Ativo'}
                </p>
                <p className={`text-sm ${theme.subText}`}>
                  Status: <span className="text-green-600 font-bold uppercase">{currentSubscription.status}</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${theme.subText}`}>Renova em</p>
                <p className={`font-medium ${theme.text}`}>
                  {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPopular = index === 1 || plans.length === 1;
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl shadow-xl border transition-all duration-200 hover:shadow-2xl flex flex-col ${isSubscriber ? 'bg-slate-800' : 'bg-white'} ${isPopular
                  ? theme.cardPopular
                  : theme.cardRegular
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className={`${theme.badge} px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1`}>
                      <Star className="w-4 h-4" />
                      <span>Recomendado</span>
                    </div>
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${theme.text}`}>{plan.name}</h3>
                    <p className={`mb-4 h-10 overflow-hidden ${theme.subText}`}>{plan.description}</p>
                    <div className="mb-4">
                      <span className={`text-4xl font-bold ${theme.text}`}>R$ {plan.price}</span>
                      <span className={theme.subText}>/mês</span>
                    </div>
                    <div className={`flex items-center justify-center space-x-2 ${theme.iconPrimary}`}>
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {plan.washes_per_month} lavagens por mês
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features && plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${theme.checkBg}`}>
                          <Check className={`w-3 h-3 ${theme.checkIcon}`} />
                        </div>
                        <span className={isSubscriber ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan || processing}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center ${isPopular
                      ? `${theme.buttonPrimary} shadow-lg hover:shadow-xl`
                      : `${theme.buttonSecondary}`
                      } ${isCurrentPlan || processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing && !isCurrentPlan ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    {isCurrentPlan ? "Plano Atual" : processing ? "Processando..." : "Selecionar Plano"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pay-Per-Wash Option */}
        <div className={`mt-12 rounded-2xl border p-8 text-center ${theme.card}`}>
          <h3 className={`text-2xl font-bold mb-4 ${theme.text}`}>
            Prefere Pagar por Lavagem?
          </h3>
          <p className={`mb-6 max-w-2xl mx-auto ${theme.subText}`}>
            Não está pronto para uma assinatura? Você sempre pode agendar lavagens de carro individuais
            com nossas tarifas padrão, sem compromisso.
          </p>

          {services.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {services.map(service => (
                <div key={service.id} className={`text-center p-4 border rounded-xl transition-colors ${isSubscriber ? 'border-slate-700 hover:border-yellow-500/50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className={`text-2xl font-bold ${theme.text}`}>R$ {service.price}</div>
                  <div className={`font-semibold ${isSubscriber ? 'text-gray-200' : 'text-gray-800'}`}>{service.name}</div>
                  <div className={`text-sm mt-1 ${theme.subText}`}>{service.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum serviço avulso disponível no momento.</p>
          )}

          <button
            onClick={() => navigate("/booking")}
            className={`mt-8 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md ${theme.buttonPrimary}`}
          >
            Agendar Lavagem Única
          </button>
        </div>

        {/* Subscription Benefits */}
        <div className={`mt-12 rounded-2xl p-8 ${theme.benefitsSection}`}>
          <h3 className={`text-2xl font-bold text-center mb-8 ${theme.benefitsTitle}`}>
            Por Que Escolher uma Assinatura?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h4 className={`text-xl font-semibold mb-2 ${theme.benefitsTitle}`}>Economize Dinheiro</h4>
              <p className={theme.benefitsText}>
                Obtenha descontos exclusivos em comparação com os preços de lavagem individual
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className={`text-xl font-semibold mb-2 ${theme.benefitsTitle}`}>Agendamento Prioritário</h4>
              <p className={theme.benefitsText}>
                Evite a espera com acesso prioritário aos horários mais disputados
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h4 className={`text-xl font-semibold mb-2 ${theme.benefitsTitle}`}>Sem Compromisso</h4>
              <p className={theme.benefitsText}>
                Cancele a qualquer momento, sem taxas ocultas ou penalidades
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
