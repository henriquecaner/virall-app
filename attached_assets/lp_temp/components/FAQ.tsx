import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FaqItem } from '../types';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    { 
      question: "Quando vou receber acesso?", 
      answer: "Lote 2: Fevereiro 2026. Você entra na lista grátis agora. Quando seu lote abrir, você recebe o convite para entrar GRÁTIS e garantir seu acesso exclusivo de fundador." 
    },
    { 
      question: "É realmente grátis?", 
      answer: (
        <>
          Sim. O preço oficial da assinatura é <span className="line-through text-slate-400 decoration-red-400">R$ 287/mês</span>, mas para os 100 primeiros fundadores é <strong className="text-success-600 bg-success-50 px-1 rounded">100% GRÁTIS</strong>. Estou liberando o acesso sem custo porque preciso de validação e casos de sucesso antes de cobrar o valor cheio.
        </>
      )
    },
    { 
      question: "E se eu não gostar?", 
      answer: "Garantia Tripla: Você não paga nada para entrar, então o risco financeiro é zero. Se não gostar, basta parar de usar. Simples." 
    },
    { 
      question: "VIRALL funciona para o meu nicho?", 
      answer: "Sim. O processo se adapta a qualquer indústria B2B (consultoria, tech, jurídico, saúde...). O algoritmo do LinkedIn é o mesmo pra todos, a Caner™ decodifica esse algoritmo." 
    },
    { 
      question: "Por que não usar só o ChatGPT?", 
      answer: "O ChatGPT usa prompts genéricos e não tem validação. O VIRALL usa dados reais de 318.842 posts, tem tom de voz 100% personalizado e te dá um Score Preditivo ANTES de postar." 
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-dark-900 mb-12 tracking-tight">Perguntas Frequentes</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button 
                onClick={() => toggle(idx)}
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-dark-900 text-lg">{faq.question}</span>
                {openIndex === idx ? <ChevronUp className="text-brand-500" /> : <ChevronDown className="text-slate-400" />}
              </button>
              
              <div 
                id={`faq-answer-${idx}`}
                className={`transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};