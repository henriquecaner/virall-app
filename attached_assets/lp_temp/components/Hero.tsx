import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowRight, CheckCircle2, Flame, TrendingUp } from 'lucide-react';

export const Hero: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Vaga reservada para ${email}`);
  };

  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-[#030712] text-white border-b border-white/5">
        
        {/* Background: Deep Dark Grid */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        
        {/* Soft Spotlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        
        {/* Simple Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-200 text-xs font-semibold tracking-wide mb-8">
           <span className="w-2 h-2 rounded-full bg-success-500"></span>
           <span>METODOLOGIA CANER™ — ANÁLISE EM TEMPO REAL</span>
        </div>

        {/* Clean H1 */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-8 leading-[1.1] md:leading-[0.95] max-w-5xl mx-auto uppercase">
          VOCÊ ESTÁ <span className="text-brand-500">INVISÍVEL</span> NO LINKEDIN.
          <span className="block text-lg sm:text-xl md:text-3xl text-slate-400 mt-4 font-medium tracking-normal normal-case">
            E seus concorrentes agradecem.
          </span>
        </h1>
        
        {/* Subhead - Fixed Width (50rem) & Smaller Font (text-xl) */}
        <div className="max-w-[50rem] mx-auto mb-12">
            <p className="text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed font-light px-2">
              Enquanto você gasta 3 horas criando um post que ninguém vai ver, o top 1% domina <strong className="text-white font-bold">63% do alcance total</strong> usando um processo rápido, fácil e replicável.
            </p>
        </div>

        {/* Input Form */}
        <div className="max-w-[500px] mx-auto mb-10 z-20 relative">
             <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-center bg-[#0B0F19] rounded-xl p-1.5 border border-white/10 shadow-2xl ring-1 ring-white/5">
                <input 
                  type="email" 
                  name="email"
                  aria-label="Digite seu e-mail corporativo"
                  placeholder="Digite seu e-mail corporativo..." 
                  className="flex-1 w-full sm:w-auto px-4 py-4 sm:py-3 bg-transparent outline-none text-white placeholder:text-slate-500 text-base min-w-0 text-center sm:text-left"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="w-full sm:w-auto rounded-lg py-4 sm:py-3 px-6 text-base font-bold whitespace-nowrap bg-brand-600 hover:bg-brand-500 text-white border border-white/10 transition-all hover:scale-[1.02] mt-2 sm:mt-0">
                  Entrar na Lista <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
             </form>
             
             <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-[10px] md:text-xs font-medium text-slate-400">
               <div className="flex items-center gap-2">
                 <TrendingUp className="w-3 h-3 text-success-500" />
                 <span>100 vagas de early access</span>
               </div>
               <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-700 mx-1"></span>
               <span>Lotes enchem em 4-6 semanas</span>
             </div>
        </div>

        {/* Social Proof Ticker */}
        <div className="inline-flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-slate-300 bg-white/5 border border-white/5 py-4 px-6 md:py-2.5 rounded-2xl w-full md:w-auto">
            <div className="flex items-center gap-2">
               <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
               <span className="font-medium tracking-wide">147 na fila</span>
            </div>
            <div className="hidden md:block w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2 text-slate-400">
               <span className="font-bold line-through decoration-slate-500">Lote 1 ESGOTADO</span>
            </div>
            <div className="hidden md:block w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2 text-urgency-500">
               <Flame className="w-3.5 h-3.5 fill-urgency-500/20" />
               <span className="font-bold tracking-wide text-white">Poucas vagas restantes</span>
            </div>
        </div>

      </div>
    </section>
  );
};