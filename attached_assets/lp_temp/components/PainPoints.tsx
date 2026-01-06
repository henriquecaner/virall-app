import React from 'react';
import { Clock, Frown, MonitorX } from 'lucide-react';

export const PainPoints: React.FC = () => {
  return (
    <section id="problema" className="py-24 bg-slate-50 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-6 tracking-tight leading-tight">
            Se você é consultor, founder ou especialista B2B, provavelmente reconhece isso:
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Pain 1 - High Contrast Blue */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-200 group-hover:bg-brand-600 transition-colors"></div>
            <div className="mb-6 bg-brand-100 w-16 h-16 rounded-xl flex items-center justify-center text-brand-700 shadow-sm">
                <MonitorX size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-4 tracking-tight">O Bloqueio de Segunda-Feira</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Você abre o LinkedIn às 7h. Cursor piscando. Mente em branco.
              "Sobre o que eu falo hoje?"
            </p>
            <p className="text-sm font-bold text-brand-700 bg-brand-50 inline-block px-2 py-1 rounded">Resultado: Invisibilidade.</p>
          </div>

          {/* Pain 2 - High Contrast Urgency/Orange */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-urgency-500 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-200 group-hover:bg-urgency-500 transition-colors"></div>
            <div className="mb-6 bg-orange-100 w-16 h-16 rounded-xl flex items-center justify-center text-orange-700 shadow-sm">
                <Clock size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-4 tracking-tight">O Tempo que Você Nunca Recupera</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              2-3 horas por post × 12 posts/mês = <span className="font-bold text-orange-700">24-36 horas no lixo.</span>
              Isso é quase uma SEMANA de trabalho.
            </p>
            <p className="text-sm font-bold text-orange-700 bg-orange-50 inline-block px-2 py-1 rounded">Resultado: Baixo ROI.</p>
          </div>

          {/* Pain 3 - High Contrast Dark/Grey */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-dark-900 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-200 group-hover:bg-dark-900 transition-colors"></div>
            <div className="mb-6 bg-slate-200 w-16 h-16 rounded-xl flex items-center justify-center text-slate-800 shadow-sm">
                <Frown size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-4 tracking-tight">A Frustração Silenciosa</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Você é bom no que faz. Seus clientes sabem. O LinkedIn não faz ideia.
              Enquanto isso, concorrentes menos experientes fecham contratos.
            </p>
            <p className="text-sm font-bold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded">Resultado: Perda de Autoridade.</p>
          </div>
        </div>

        {/* Punchline */}
        <div className="mt-16 max-w-4xl mx-auto bg-dark-900 text-white p-8 md:p-12 rounded-2xl text-center shadow-2xl relative overflow-hidden border border-white/10">
            <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">A verdade brutal:</h3>
                <p className="text-lg md:text-xl text-slate-300 mb-6 leading-relaxed">
                    Não é sobre talento. É sobre <span className="text-brand-400 font-bold">PROCESSO.</span><br/>
                    O gap entre você e o top 1% é de <span className="text-white font-bold bg-brand-700 px-2 py-0.5 rounded ml-1">225x em performance.</span>
                </p>
                <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">Até agora.</p>
            </div>
        </div>
      </div>
    </section>
  );
};