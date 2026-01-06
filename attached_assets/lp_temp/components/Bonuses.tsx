import React from 'react';
import { Book, Copy, Layout, Calendar, Users, Rocket } from 'lucide-react';

export const Bonuses: React.FC = () => {
  const bonuses = [
    {
      title: "BÔNUS #1: The Hook Vault",
      subtitle: "147 Hooks Testados",
      value: "R$ 497",
      desc: "A mesma biblioteca que usei para analisar 318k posts. 73% taxa de sucesso.",
      icon: Book
    },
    {
      title: "BÔNUS #2: CTA Arsenal",
      subtitle: "100+ CTAs Categorizados",
      value: "R$ 297",
      desc: "Nunca mais termine um post sem saber o que pedir. Copie, cole, adapte.",
      icon: Copy
    },
    {
      title: "BÔNUS #3: Framework Vault",
      subtitle: "6 Estruturas de Copy",
      value: "R$ 397",
      desc: "Os mesmos frameworks que geram milhões em faturamento (PAS, AIDA, Story...).",
      icon: Layout
    },
    {
      title: "BÔNUS #4: Content Calendar 2026",
      subtitle: "Planejamento de 90 Dias",
      value: "R$ 197",
      desc: "Seu próximo trimestre de conteúdo resolvido em 1 hora.",
      icon: Calendar
    },
    {
      title: "BÔNUS #5: Jornada do Fundador",
      subtitle: "90 Páginas de Conteúdo",
      value: "R$ 1.000",
      desc: "Manual completo para alavancar seu LinkedIn em 10 dias de execução focada.",
      icon: Rocket
    },
    {
      title: "BÔNUS #6: VIRALL Founders Circle",
      subtitle: "Comunidade Exclusiva",
      value: "R$ 997/ano",
      desc: "Networking com os membros. Calls mensais de Q&A.",
      icon: Users
    }
  ];

  return (
    <section className="py-20 bg-brand-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
           <span className="text-brand-600 font-bold tracking-wide uppercase text-sm">Early Access Exclusivo</span>
           <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mt-2 tracking-tight leading-tight">Os 100 Primeiros Também Recebem:</h2>
        </div>

        <div className="grid gap-6">
            {bonuses.map((bonus, i) => (
                <div key={i} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6 items-start shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-brand-100 rounded-lg flex items-center justify-center shrink-0 text-brand-600">
                        <bonus.icon size={32} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-xl text-dark-900 tracking-tight">{bonus.title}</h3>
                             <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap hidden md:block">
                                Valor: {bonus.value}
                             </span>
                        </div>
                        <p className="font-medium text-slate-800 mb-2">{bonus.subtitle}</p>
                        <p className="text-slate-600 text-sm leading-relaxed">{bonus.desc}</p>
                        <div className="mt-4 md:hidden text-brand-700 font-bold text-sm">Valor: {bonus.value}</div>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-12 p-8 bg-dark-900 rounded-2xl text-center text-white">
            <p className="text-slate-400 mb-2 uppercase tracking-widest text-sm">Valor Total dos Bônus</p>
            <div className="text-4xl md:text-5xl font-black text-white mb-4 line-through decoration-urgency-500 decoration-4 tracking-tight">R$ 3.385</div>
            <p className="text-xl font-medium text-brand-300">Você recebe TUDO isso grátis como early adopter.</p>
        </div>
      </div>
    </section>
  );
};