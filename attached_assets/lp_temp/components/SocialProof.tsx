import React from 'react';
import { X, Check, Bot, BrainCircuit, UserX } from 'lucide-react';

export const SocialProof: React.FC = () => {
  return (
    <section id="depoimentos" className="py-24 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-dark-900 mb-4 tracking-tight leading-tight">Por que VIRALL funciona quando outros falham?</h2>
          <p className="text-slate-600">A Diferença: Caner™ vs O Resto</p>
        </div>

        {/* Comparison Cards - 3 Columns */}
        <div className="grid md:grid-cols-3 gap-6 mb-20 items-stretch">
            
            {/* Card 1: Old Way / Manual */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 flex flex-col relative group hover:border-slate-300 transition-colors">
                <div className="absolute top-4 right-4 text-xs font-bold text-slate-400 uppercase tracking-wider border border-slate-200 px-2 py-1 rounded">
                    Inviável
                </div>
                <div className="mb-6 text-slate-400 group-hover:text-slate-500 transition-colors">
                    <UserX size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2 tracking-tight">
                    Fazer Sozinho
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    O caminho tradicional de agências ou freelancers.
                </p>
                <div className="h-px bg-slate-200 w-full mb-6"></div>
                <ul className="space-y-4 flex-1">
                    {[
                        "Custo altíssimo (Tempo ou R$)", 
                        "Depende de inspiração diária", 
                        "Zero previsibilidade de resultado", 
                        "Burnout criativo garantido"
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-slate-600 text-sm font-medium items-start">
                            <X className="shrink-0 text-slate-400 w-5 h-5 mt-0.5" /> 
                            <span className="leading-tight">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Card 2: Other Tools (GPT Wrappers) */}
            <div className="bg-red-50/50 p-8 rounded-2xl border border-red-100 flex flex-col relative group hover:border-red-200 transition-colors">
                <div className="absolute top-4 right-4 text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded uppercase tracking-wider">
                    Amador
                </div>
                <div className="mb-6 text-red-400 group-hover:text-red-500 transition-colors">
                    <Bot size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2 tracking-tight">
                    "Ferramentas" de IA
                </h3>
                <p className="text-sm text-red-700/80 mb-6 leading-relaxed">
                    Apenas uma máscara (wrapper) do ChatGPT sem estratégia.
                </p>
                <div className="h-px bg-red-100 w-full mb-6"></div>
                <ul className="space-y-4 flex-1">
                    {[
                        "Conteúdo robótico e sem alma", 
                        "Você gasta mais tempo editando", 
                        "Zero processo, só aleatoriedade", 
                        "Sem polimento ou formatação",
                        "Alucinações (fatos inventados)"
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-red-800 text-sm font-medium items-start">
                            <X className="shrink-0 text-red-400 w-5 h-5 mt-0.5" /> 
                            <span className="leading-tight">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Card 3: VIRALL - Winner */}
            <div className="bg-white p-8 rounded-2xl border-2 border-brand-500 shadow-2xl shadow-brand-900/10 flex flex-col relative transform md:-translate-y-4 z-10">
                <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                    A Escolha do Top 1%
                </div>
                <div className="mb-6 text-brand-600">
                    <BrainCircuit size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-dark-900 mb-2 tracking-tight">
                    VIRALL (Caner™)
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    Metodologia proprietária baseada em engenharia reversa.
                </p>
                <div className="h-px bg-slate-100 w-full mb-6"></div>
                <ul className="space-y-4 flex-1">
                    {[
                        "318.842 posts reais analisados", 
                        "5 critérios de scoring preditivo", 
                        "Tom de voz 100% treinado", 
                        "Texto polido, pronto para postar", 
                        "Processo guiado, não mágica"
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-dark-900 text-sm font-bold items-start">
                            <Check className="shrink-0 text-success-500 w-5 h-5 mt-0.5" /> 
                            <span className="leading-tight">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* ROI Table */}
        <div className="bg-dark-900 text-white rounded-3xl p-8 md:p-12 overflow-hidden border border-white/10">
            <h3 className="text-2xl font-bold mb-8 text-center tracking-tight">ROI Claro: A Matemática Não Mente</h3>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-200 text-sm uppercase tracking-wider">
                            <th className="py-5 px-4">Opção</th>
                            <th className="py-5 px-4">Custo Real</th>
                            <th className="py-5 px-4">Resultado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        <tr>
                            <td className="py-5 px-4 font-semibold text-slate-200">Fazer sozinho</td>
                            <td className="py-5 px-4 text-urgency-400 font-medium">R$ 2.400 - 3.600 / mês *</td>
                            <td className="py-5 px-4 text-slate-300">200 views, posts medíocres</td>
                        </tr>
                        <tr>
                            <td className="py-5 px-4 font-semibold text-slate-200">Agência</td>
                            <td className="py-5 px-4 text-urgency-400 font-medium">R$ 3.000 - 8.000 / mês</td>
                            <td className="py-5 px-4 text-slate-300">Genérico, sem sua voz</td>
                        </tr>
                        <tr className="bg-brand-900/40">
                            <td className="py-5 px-4 font-bold text-white shadow-[inset_3px_0_0_0_#3b82f6]">VIRALL</td>
                            <td className="py-5 px-4 text-success-400 font-bold text-lg">R$ 0,00 (Grátis)</td>
                            <td className="py-5 px-4 text-white font-bold">Score ≥8/10 Garantido</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="mt-6 text-xs text-slate-500 text-center">*Calculado a R$ 100/hora (conservador para B2B)</p>
        </div>

      </div>
    </section>
  );
};