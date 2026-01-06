import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowRight } from 'lucide-react';

export const Comparison: React.FC = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Registered!');
    }

  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-16 tracking-tight leading-tight">A escolha parece óbvia.</h2>
        
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto mb-16">
          {/* Option A */}
          <div className="flex-1 p-8 rounded-2xl bg-dark-800 border border-slate-700 opacity-60 hover:opacity-100 transition-opacity">
            <h3 className="text-xl font-bold mb-4 text-slate-300 tracking-tight">Opção A: Continuar Invisível</h3>
            <ul className="text-left space-y-3 text-slate-400 text-sm mb-8">
                <li>• Fecha essa página e volta pro LinkedIn amanhã.</li>
                <li>• Cursor piscando. Mente em branco.</li>
                <li>• 3 horas pra criar um post que ninguém vê.</li>
                <li>• Concorrentes continuam dominando.</li>
            </ul>
            <div className="py-4 border-t border-slate-700">
               <span className="block text-sm text-slate-500 mb-1">Custo Real</span>
               <strong className="text-white">R$ 2.400+/mês em tempo perdido</strong>
            </div>
          </div>

          {/* Option B - Highlighted */}
          <div className="flex-1 p-8 rounded-2xl bg-white text-dark-900 border-4 border-brand-500 shadow-[0_0_50px_rgba(10,102,194,0.3)] relative transform md:-translate-y-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider shadow-lg">
                ESCOLHA INTELIGENTE
            </div>
            <h3 className="text-2xl font-bold mb-6 text-brand-700 tracking-tight">Opção B: Entrar Pra Lista</h3>
            <ul className="text-left space-y-3 text-slate-700 font-medium text-sm mb-8">
                <li>✅ Coloca seu email abaixo em 10 segundos.</li>
                <li>✅ Garante uma das poucas vagas restantes.</li>
                <li>✅ Recebe acesso Antecipado GRÁTIS.</li>
                <li>✅ Score ≥8/10 garantido em cada post.</li>
            </ul>
            <div className="py-4 border-t border-slate-200 bg-brand-50 -mx-8 px-8 rounded-b-xl flex flex-col justify-center">
               <span className="block text-sm text-slate-500 mb-1 font-medium uppercase tracking-wide">Custo para Fundadores</span>
               
               <div className="flex items-center justify-center gap-3 mb-1">
                   <span className="text-slate-400 line-through font-bold text-lg decoration-red-400 decoration-2">R$ 287/mês</span>
                   <span className="bg-success-100 text-success-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-success-200">
                        100% OFF
                   </span>
               </div>
               
               <strong className="text-success-600 text-4xl font-black tracking-tight">GRÁTIS</strong>
               <span className="block text-xs text-slate-500 mt-2 font-medium">Economia de R$ 3.444/ano</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
             <div className="mb-6 text-xl font-bold tracking-tight">Mas só você pode fazer.</div>
             <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Seu melhor e-mail..." 
                className="flex-1 px-6 py-5 bg-white text-dark-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-500/50 text-lg"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" variant="urgency" className="px-8 py-5 text-xl animate-pulse-slow">
                GARANTIR VAGA GRÁTIS <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </form>
             <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1"><span className="text-success-500">✓</span> Grátis para sempre (Early Access)</span>
                <span className="flex items-center gap-1"><span className="text-success-500">✓</span> Sem cartão de crédito</span>
                <span className="flex items-center gap-1"><span className="text-urgency-500">⚠</span> Poucas vagas restantes</span>
            </div>
        </div>
      </div>
    </section>
  );
};