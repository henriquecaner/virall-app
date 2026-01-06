import React from 'react';
import { ShieldCheck, RefreshCw, Trophy } from 'lucide-react';

export const Guarantee: React.FC = () => {
  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-900 mb-2 tracking-tight leading-tight">Garantia "LinkedIn Visível"</h2>
            <p className="text-lg text-slate-600">Risco ZERO para você. Garantia Tripla.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            {/* Teste Total */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-dark-900">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2 tracking-tight">Teste Total</h3>
                <p className="text-sm text-slate-600">Incondicional. Não amou? Basta cancelar o teste. Sem perguntas.</p>
            </div>

            {/* Score 8 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-dark-900">
                    <RefreshCw size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2 tracking-tight">Score 8</h3>
                <p className="text-sm text-slate-600">Se o score for menor que 8, continuo otimizando o processo PRA VOCÊ até chegar lá.</p>
            </div>

            {/* Performance */}
            <div className="bg-white p-6 rounded-xl border border-brand-200 shadow-lg shadow-brand-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                    <Trophy size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-brand-900 tracking-tight">Performance</h3>
                <p className="text-sm text-slate-700 font-medium">Se seu engajamento não aumentar, devolvo 100% do dinheiro + Você fica com os bônus.</p>
            </div>
        </div>
      </div>
    </section>
  );
};