import React from 'react';
import { Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-32 md:pb-8">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        
        <div className="mb-12 text-left bg-brand-50 p-6 md:p-8 rounded-2xl border border-brand-100 text-slate-700 space-y-6">
           <div>
              <strong className="text-brand-700 block mb-1">P.S.:</strong> 
              147 profissionais já estão na lista. 100 vagas de early access. Lote 1 esgotou em 8 dias. Se você está lendo isso e ainda não entrou, sua vaga está sendo ocupada enquanto você pensa.
           </div>
           <div>
              <strong className="text-brand-700 block mb-1">P.P.S.:</strong> 
              Eu poderia cobrar R$ 287/mês (US$ 49). Escolhi liberar <span className="underline decoration-brand-400 decoration-2 font-bold">GRÁTIS</span> para os primeiros 100 fundadores. Por quê? Quero 100 casos de sucesso ANTES do lançamento. É estratégia, não caridade. Mas essa janela fecha em 4-6 semanas.
           </div>
           <div className="font-medium text-dark-900 pt-4 border-t border-brand-200">
              Daqui a 90 dias, você vai estar em um desses lugares: 
              1) Ainda invisível, pagando boleto. 
              2) Gerando leads com posts score 8/10 de graça. 
              <span className="block mt-2 font-bold text-brand-600">A decisão demora 30 segundos.</span>
           </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100 pt-8">
          <div className="flex items-center gap-2 font-black text-dark-900 text-2xl tracking-tighter">
             VIRALL<span className="text-brand-600">™</span>
          </div>
          <p className="text-slate-500 text-sm text-center md:text-right">
             Powered by Caner™<br/>
             Transformando profissionais invisíveis em autoridades.
          </p>
          <div className="flex gap-6 text-sm text-slate-500 font-medium">
             <a href="#" className="hover:text-brand-600 transition-colors">Termos</a>
             <a href="#" className="hover:text-brand-600 transition-colors">Privacidade</a>
             <a href="#" className="hover:text-brand-600 transition-colors">Suporte</a>
          </div>
        </div>
      </div>
    </footer>
  );
};