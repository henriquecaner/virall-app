import React from 'react';

export const ProblemStory: React.FC = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-3xl mx-auto px-4">
        
        <div className="prose prose-lg prose-slate mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-dark-900 mb-2 leading-tight tracking-tight">
            Por que seus posts falham?
          </h2>
          <p className="text-xl text-slate-500 font-medium mb-12 leading-relaxed">
             (E como 10 minutos podem mudar isso)
          </p>
          
          <div className="bg-brand-50 p-6 rounded-xl border border-brand-100 mb-10 text-dark-800">
             <p className="font-bold mb-2">Carta aberta para profissionais cansados de serem ignorados.</p>
             <p className="m-0 text-sm">Leitura: 2 minutos</p>
          </div>

          <p>
            Deixa eu te contar o que descobri depois de analisar <strong>318.842 posts do LinkedIn</strong> nos últimos 6 meses.
            Não foi fácil. Mas o resultado me chocou.
          </p>

          <h3 className="text-2xl font-bold text-dark-900 mt-12 mb-6 tracking-tight">92% dos posts falham pelos mesmos 5 motivos:</h3>

          <ul className="space-y-4 list-none pl-0 my-8">
            {[
              { title: "Hook genérico", desc: "não para o scroll em 2 segundos (você só tem 2s)." },
              { title: "Estrutura errada", desc: "muito curto pra autoridade, muito longo pra atenção." },
              { title: "Parágrafos densos", desc: "ninguém lê blocos de texto no mobile." },
              { title: "Zero dados concretos", desc: "posts vagos não geram 'esse cara sabe do que fala'." },
              { title: "CTA fraco", desc: "se não incentiva salvar, o algoritmo 2025 te enterra." }
            ].map((item, i) => (
              <li key={i} className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-brand-600 font-bold text-xl">0{i+1}.</span>
                <div>
                    <strong className="text-dark-900 block">{item.title}</strong>
                    <span className="text-slate-600">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="my-12 pl-6 border-l-4 border-urgency-500 italic text-slate-700">
            "Você provavelmente está cometendo 3 ou 4 desses erros AGORA MESMO. Não porque você é ruim. Mas porque ninguém te mostrou o processo."
          </div>

          <h3 className="text-2xl font-bold text-dark-900 mt-12 mb-6 tracking-tight">A Visão do Futuro (Imagine isso):</h3>
          
          {/* Future Pacing UI */}
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-brand-600 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold z-10">
                    1
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900">Segunda, 07:00</div>
                    </div>
                    <div className="text-slate-500 text-sm">
                        Você abre o VIRALL. Responde 3 perguntas. O processo te guia em 7 etapas.
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-brand-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold z-10">
                    2
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border-2 border-brand-100 shadow-md">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900">07:10 (10 min depois)</div>
                    </div>
                    <div className="text-slate-600 text-sm">
                        <p>✅ Post completo na tela.</p>
                        <p>✅ Score: <span className="text-success-600 font-bold">8.4/10</span></p>
                        <p>✅ Analytics: "73% chance top 5%"</p>
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-success-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold z-10">
                    3
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-success-50 p-4 rounded-xl border border-success-200 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-success-900">Domingo, 11:00</div>
                    </div>
                    <div className="text-success-800 text-sm font-medium">
                         <p>847 visualizações (e subindo).</p>
                         <p>23 comentários relevantes.</p>
                         <p>4 DMs perguntando sobre serviços.</p>
                    </div>
                </div>
            </div>
          </div>

          <p className="mt-12 text-lg font-medium text-dark-900 text-center">
            Você sorri. Porque sabe que não foi sorte. <span className="bg-brand-100 px-1">Foi o processo.</span>
          </p>
        </div>
      </div>
    </section>
  );
};