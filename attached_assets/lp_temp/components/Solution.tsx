import React from 'react';
import { Target, MessageSquare, BarChart, Zap, LayoutTemplate, PenTool, CheckCircle } from 'lucide-react';

export const Solution: React.FC = () => {
  const steps = [
    { num: 1, title: "Pautas Inteligentes", text: "Processo sugere 3-5 temas baseados no seu perfil. 'Nunca mais sobre o que eu falo hoje?'", icon: Target },
    { num: 2, title: "Estrutura de Copy", text: "6 frameworks validados (PAS, AIDA, Contrarian...). O piloto automático do top 1%.", icon: LayoutTemplate },
    { num: 3, title: "Tipo de Conteúdo", text: "16 tipos testados (How-to, Polêmica, Bastidores...). Escolha o objetivo da semana.", icon: MessageSquare },
    { num: 4, title: "Hooks Magnéticos", text: "3 opções de hooks gerados. 73% de taxa de sucesso em reter atenção.", icon: Zap },
    { num: 5, title: "Corpo Completo", text: "Montado com seu tom de voz. Soa como VOCÊ, não como um robô.", icon: PenTool },
    { num: 6, title: "CTAs que Convertem", text: "Otimizados para salvamento (algoritmo) ou leads (dinheiro).", icon: CheckCircle },
    { num: 7, title: "Score + Validação", text: "Se tiver menos que 8/10, o processo melhora sozinho. Garantido.", icon: BarChart },
  ];

  return (
    <section id="solucao" className="py-24 bg-dark-900 text-white overflow-hidden relative scroll-mt-20">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-dark-800 border border-dark-700 text-xs font-bold tracking-wider uppercase text-brand-400 mb-4">
            SOLUÇÃO
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-[0.95]">Apresento: VIRALL</h2>
          <p className="text-xl text-slate-400">Powered by Caner™</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          {/* Steps Timeline */}
          <div className="relative">
            <h3 className="text-2xl font-bold mb-12 text-white pl-2 tracking-tight">Processo de evolução por Etapas</h3>
            
            <div className="space-y-12 md:space-y-16 relative">
                {/* Connecting Vertical Line for visual flow */}
                <div className="absolute left-6 md:left-8 top-8 bottom-8 w-px bg-gradient-to-b from-brand-600/50 via-brand-900/50 to-transparent block"></div>

                {steps.map((step) => (
                  <div key={step.num} className="flex gap-4 md:gap-6 group items-start relative z-10">
                    
                    {/* Icon Container with dynamic hover effects */}
                    <div className="relative flex-shrink-0 group-hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-brand-700 shadow-[0_0_25px_rgba(29,78,216,0.25)] flex items-center justify-center text-white ring-1 ring-white/10 group-hover:bg-brand-600 transition-colors duration-300 z-10 relative">
                            {React.createElement(step.icon, { 
                                size: 24, 
                                className: "md:w-7 md:h-7", 
                                strokeWidth: 2.5 
                            })}
                        </div>
                        {/* Number Badge */}
                        <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 bg-dark-900 border-2 border-brand-700 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black text-white shadow-lg z-20 group-hover:border-brand-500 transition-colors">
                            {step.num}
                        </div>
                    </div>

                    <div className="pt-0.5 md:pt-1">
                        <h4 className="font-bold text-lg md:text-xl text-white group-hover:text-brand-300 transition-colors mb-1 md:mb-2 tracking-tight">
                            {step.title}
                        </h4>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed group-hover:text-slate-300 transition-colors max-w-md">
                            {step.text}
                        </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Results Box */}
          <div className="lg:sticky lg:top-24 hidden lg:block">
             <div className="bg-gradient-to-br from-brand-900 to-dark-800 p-8 rounded-3xl border border-brand-700/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 blur-[100px] opacity-20"></div>
                
                <h3 className="text-2xl font-bold mb-8 relative z-10 tracking-tight">Resultado Final</h3>
                
                <div className="space-y-6 relative z-10">
                    <div className="bg-dark-900/50 p-5 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-colors">
                        <div className="text-sm text-slate-400 mb-1 font-medium">Tempo Investido</div>
                        <div className="text-2xl font-bold text-white tracking-tight">10-15 minutos</div>
                        <div className="text-xs text-slate-500 mt-1">vs 2-3 horas fazendo sozinho</div>
                    </div>

                    <div className="bg-dark-900/50 p-5 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-colors">
                        <div className="text-sm text-slate-400 mb-1 font-medium">Score Garantido</div>
                        <div className="text-2xl font-bold text-success-400 tracking-tight">≥ 8/10 em cada post</div>
                    </div>

                    <div className="bg-dark-900/50 p-5 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-colors">
                        <div className="text-sm text-slate-400 mb-1 font-medium">Probabilidade Viral</div>
                        <div className="text-2xl font-bold text-brand-300 tracking-tight">60-85% chance top 5%</div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                    <p className="font-bold text-white flex items-center gap-3 bg-brand-600/10 p-4 rounded-xl border border-brand-500/20">
                        <CheckCircle className="text-brand-400 fill-brand-400/20 w-6 h-6" />
                        Zero bloqueio criativo
                    </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};