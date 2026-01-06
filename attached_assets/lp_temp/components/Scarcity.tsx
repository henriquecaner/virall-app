import React from 'react';

export const Scarcity: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <span className="bg-urgency-500 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wide mb-4 inline-block animate-pulse">
            Urgência Real
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-dark-900 mb-4 tracking-tight leading-none">
            100 vagas de early access
            <div className="mt-2 text-2xl md:text-3xl font-medium text-slate-500">
               de <span className="line-through decoration-red-400 decoration-2 text-slate-400">R$ 287/mês</span> por <span className="text-success-600 font-black bg-success-50 px-2 rounded">ZERO</span>
            </div>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Lançamento oficial: Março 2026.<br/>
            Os 100 primeiros entram <strong>GRÁTIS</strong> e levam R$ 3.385 em bônus.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-100 mb-12 relative overflow-hidden">
          
          <div className="space-y-6">
            {/* LOT 1 */}
            <div className="relative">
                <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                    <span>LOTE 1: Janeiro 2026</span>
                    <span className="flex items-center gap-1 text-success-600"><span className="w-2 h-2 rounded-full bg-success-500"></span> 100% ESGOTADO</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 w-full"></div>
                </div>
            </div>

            {/* LOT 2 - ACTIVE */}
            <div className="relative">
                <div className="flex justify-between text-sm font-bold text-dark-900 mb-2">
                    <span className="flex items-center gap-2">
                         LOTE 2: Fevereiro 2026
                         <span className="bg-urgency-500 text-white text-[10px] px-2 py-0.5 rounded">FECHANDO</span>
                    </span>
                    <span className="text-urgency-600">Poucas vagas restantes</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                    {/* Pattern overlay */}
                    <div className="h-full bg-brand-600 w-[70%] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Últimas 3 preenchidas nas últimas 24h.</p>
            </div>

             {/* LOT 3 & 4 */}
             <div className="opacity-40 grayscale space-y-4">
                <div className="relative">
                    <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                        <span>LOTE 3: Disponível</span>
                        <span>Abre em breve</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden"></div>
                </div>
                <div className="relative">
                    <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                        <span>LOTE 4: Março 2026</span>
                        <span>Preço Cheio (R$ 287/mês)</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden"></div>
                </div>
             </div>
          </div>
        </div>

        {/* Reason Why */}
        <div className="text-center max-w-2xl mx-auto">
            <h4 className="font-bold text-dark-900 mb-4 tracking-tight">Por que de graça?</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
                Não é caridade. Preciso de <strong>feedback brutal</strong> e <strong>casos de sucesso</strong> antes de cobrar R$ 287/mês do público geral. 
                Eu te dou o software, você me dá feedback. Win-win.
            </p>
        </div>
      </div>
    </section>
  );
};