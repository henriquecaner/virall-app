import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackButtonClick, trackWaitlistSignup } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import {
  ArrowRight,
  Flame,
  TrendingUp,
  Menu,
  X,
  Clock,
  Frown,
  MonitorX,
  Target,
  MessageSquare,
  BarChart,
  Zap,
  CheckCircle,
  CheckCircle2,
  Book,
  Copy,
  Layout,
  LayoutTemplate,
  PenTool,
  Calendar,
  Users,
  Rocket,
  Check,
  Bot,
  BrainCircuit,
  UserX,
  ShieldCheck,
  RefreshCw,
  Trophy,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Gift,
} from "lucide-react";

const waitlistSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(Math.min(scrolled, 100));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div className="scroll-progress" style={{ width: `${progress}%` }} />;
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Problema", href: "#problema" },
    { name: "Solução", href: "#solucao" },
    { name: "Resultados", href: "#depoimentos" },
  ];

  const smoothScroll = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const id = targetId.replace("#", "");
    const targetElement = id ? document.getElementById(id) : document.body;

    if (!targetElement) return;

    const headerOffset = 90;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const startPosition = window.scrollY;

    const finalPosition =
      id === "" ? 0 : elementPosition + startPosition - headerOffset;

    const distance = finalPosition - startPosition;
    const duration = 800;
    let start: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);

      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-3"
          : "py-5"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl transition-all duration-500 ${
          scrolled
            ? "bg-white/90 dark:bg-dark-900/90 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-black/20 border border-white/50 dark:border-white/10"
            : "bg-white/5 backdrop-blur-sm border border-white/10"
        }`}>
          <a
            href="#"
            className="flex items-center gap-3 group"
            onClick={(e) => smoothScroll(e, "#")}
            data-testid="link-logo"
          >
            <div className={`font-display text-xl font-extrabold tracking-tight transition-colors duration-300 ${
              scrolled ? "text-dark-900 dark:text-white" : "text-white"
            }`}>
              VIRALL
              <span className="text-gradient">.</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => smoothScroll(e, link.href)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${
                  scrolled 
                    ? "text-slate-600 dark:text-slate-300 hover:text-dark-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10" 
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                data-testid={`link-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/api/login"
              className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg ${
                scrolled 
                  ? "text-slate-600 dark:text-slate-300 hover:text-dark-900 dark:hover:text-white" 
                  : "text-slate-300 hover:text-white"
              }`}
              data-testid="link-login"
              onClick={() => trackButtonClick("login", "navbar")}
            >
              Login
            </a>
            <Button
              size="sm"
              className="bg-urgency-500 text-white border-urgency-border text-on-color tracking-wide"
              onClick={(e) => smoothScroll(e as unknown as React.MouseEvent, "#")}
              data-testid="button-nav-cta"
            >
              Garantir Vaga
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-dark-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10" : "text-white hover:bg-white/10"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-1 animate-slide-down shadow-xl border border-white/50 dark:border-white/10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => smoothScroll(e, link.href)}
                className="text-dark-900 dark:text-white font-medium py-3 px-4 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                data-testid={`link-nav-mobile-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.name}
              </a>
            ))}
            <div className="h-px bg-slate-200 dark:bg-white/10 my-2"></div>
            <a
              href="/api/login"
              className="text-center py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
              onClick={() => {
                setMobileMenuOpen(false);
                trackButtonClick("login", "navbar-mobile");
              }}
              data-testid="link-login-mobile"
            >
              Login
            </a>
            <Button
              className="mt-2 bg-urgency-500 text-white border-urgency-border w-full text-on-color"
              onClick={(e) => smoothScroll(e as unknown as React.MouseEvent, "#")}
              data-testid="button-nav-cta-mobile"
            >
              Garantir Vaga
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  const { toast } = useToast();
  
  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });

  const { data: waitlistData, isLoading: isLoadingCount } = useQuery({
    queryKey: ["/api/waitlist/count"],
  });

  const joinMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/waitlist", { email });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bem-vindo(a) à lista!",
        description: `Você é o #${data.count} na lista. Entraremos em contato em breve!`,
      });
      trackWaitlistSignup("hero");
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/count"] });
      form.reset();
    },
    onError: (error: Error) => {
      if (error.message?.includes("409") || error.message?.includes("already")) {
        toast({
          title: "Você já está na lista!",
          description: "Este e-mail já está cadastrado na nossa lista de espera.",
        });
      } else {
        toast({
          title: "Erro ao entrar na lista",
          description: "Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: WaitlistFormData) => {
    trackButtonClick("waitlist_submit", "hero");
    joinMutation.mutate(data.email);
  };

  const count = (waitlistData as { count?: number })?.count ?? 0;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-900 text-white noise-overlay">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      <div className="absolute inset-0 grid-pattern"></div>

      <div className="container mx-auto px-4 relative z-10 pt-28 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="reveal-up stagger-1 flex justify-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-full glass border border-white/20 text-xs md:text-sm font-medium">
              <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-success-500"></span>
              </span>
              <span className="text-slate-300">Metodologia CANER</span>
              <span className="h-3 md:h-4 w-px bg-white/20"></span>
              <span className="text-brand-300 font-semibold">318.842 posts</span>
            </div>
          </div>

          <h1 className="reveal-up stagger-2 text-center mb-4 md:mb-6">
            <span className="hero-title block md:inline">
              Você está{" "}
            </span>
            <span className="hero-title text-shimmer block md:inline mt-1 md:mt-0">
              invisível{" "}
            </span>
            <span className="hero-title block md:inline mt-1 md:mt-0">
              no LinkedIn.
            </span>
          </h1>

          <p className="reveal-up stagger-3 text-center hero-subtitle text-slate-300 mt-6 md:mt-8 mb-3 md:mb-4 max-w-md md:max-w-2xl mx-auto">
            E seus concorrentes agradecem.
          </p>

          <div className="reveal-up stagger-4 mx-auto text-center mb-8 md:mb-12">
            <p className="hero-body text-slate-400 mx-auto">
              Enquanto você gasta 3 horas criando um post que ninguém vai ver, o top 1% domina{" "}
              <span className="text-white font-semibold">63% do alcance total</span>{" "}
              usando um processo de 10 minutos.
            </p>
          </div>

          <div className="reveal-up stagger-5 max-w-xl mx-auto mb-10">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="relative flex flex-col sm:flex-row items-center glass rounded-2xl p-2 gap-2 glow-brand"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full sm:w-auto">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Seu melhor e-mail..."
                          className="bg-transparent border-0 text-white placeholder:text-slate-400 text-center sm:text-left focus-visible:ring-0 h-14 text-base"
                          data-testid="input-email-hero"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto gap-2 bg-urgency-500 text-white border-urgency-border h-14 px-8 text-on-color text-base tracking-wide"
                  disabled={joinMutation.isPending}
                  data-testid="button-waitlist-hero"
                >
                  {joinMutation.isPending ? "Entrando..." : "Garantir Vaga"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </form>
            </Form>
          </div>

          <div className="reveal-up stagger-6 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
              </div>
              <span className="font-semibold text-white">
                {isLoadingCount ? "..." : `${count}`}
              </span>
              <span>na fila</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success-400" />
              </div>
              <span className="font-semibold text-white">100</span>
              <span>vagas de early access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-urgency-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-urgency-400" />
              </div>
              <span>Lotes enchem em 4-6 semanas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-slate-500" />
      </div>
    </section>
  );
}

function PainPoints() {
  const painPoints = [
    {
      icon: MonitorX,
      title: "O Bloqueio de Segunda-Feira",
      description: "Você abre o LinkedIn às 7h. Cursor piscando. Mente em branco. \"Sobre o que eu falo hoje?\"",
      result: "Invisibilidade",
      color: "brand",
    },
    {
      icon: Clock,
      title: "O Tempo que Você Nunca Recupera",
      description: "2-3 horas por post x 12 posts/mês = 24-36 horas no lixo. Isso é quase uma SEMANA de trabalho.",
      result: "Baixo ROI",
      color: "urgency",
    },
    {
      icon: Frown,
      title: "A Frustração Silenciosa",
      description: "Você é bom no que faz. Seus clientes sabem. O LinkedIn não faz ideia. Enquanto isso, concorrentes menos experientes fecham contratos.",
      result: "Perda de Autoridade",
      color: "slate",
    },
  ];

  return (
    <section id="problema" className="py-28 bg-background scroll-mt-20 relative grid-pattern-light dark:grid-pattern">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <span className="inline-block font-display text-sm font-semibold text-brand-600 dark:text-brand-400 tracking-wide uppercase mb-4">
            O Problema
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">
            Se você é consultor, founder ou especialista B2B, provavelmente{" "}
            <span className="text-gradient">reconhece isso</span>:
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {painPoints.map((point, i) => (
            <div 
              key={i}
              className="group relative bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 card-lift"
            >
              <div className={`mb-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                point.color === "brand" ? "bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400" :
                point.color === "urgency" ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" :
                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                <point.icon size={26} strokeWidth={2} />
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-3 tracking-tight">
                {point.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 text-[15px]">
                {point.description}
              </p>
              
              <div className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${
                point.color === "brand" ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" :
                point.color === "urgency" ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" :
                "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  point.color === "brand" ? "bg-brand-500" :
                  point.color === "urgency" ? "bg-orange-500" :
                  "bg-slate-500"
                }`}></span>
                Resultado: {point.result}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-dark-900 text-white p-10 md:p-14 rounded-3xl text-center overflow-hidden noise-overlay">
            <div className="orb orb-1 opacity-30"></div>
            
            <div className="relative z-10">
              <h3 className="font-display text-2xl md:text-4xl font-extrabold mb-6 tracking-tight">
                A verdade brutal:
              </h3>
              <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                Não é sobre talento. É sobre{" "}
                <span className="text-shimmer font-bold">PROCESSO.</span>
              </p>
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3">
                <span className="text-slate-400">O gap entre você e o top 1%:</span>
                <span className="font-display text-2xl font-bold text-white">225x</span>
              </div>
              <p className="mt-8 text-sm uppercase tracking-[0.2em] text-brand-400 font-bold">
                Até agora.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemStory() {
  const failReasons = [
    { title: "Hook genérico", desc: "não para o scroll em 2 segundos (você só tem 2s)." },
    { title: "Estrutura errada", desc: "muito curto pra autoridade, muito longo pra atenção." },
    { title: "Parágrafos densos", desc: "ninguém lê blocos de texto no mobile." },
    { title: "Zero dados concretos", desc: "posts vagos não geram 'esse cara sabe do que fala'." },
    { title: "CTA fraco", desc: "se não incentiva salvar, o algoritmo 2025 te enterra." },
  ];

  return (
    <section className="py-28 bg-card relative">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-3xl p-8 md:p-12 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
              <Flame className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground">Carta aberta</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Para profissionais cansados de serem ignorados</p>
            </div>
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight leading-[1.1]">
            Por que seus posts falham?
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
            (E como 10 minutos podem mudar isso)
          </p>
        </div>

        <div className="prose prose-lg prose-slate dark:prose-invert mx-auto mb-16">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Deixa eu te contar o que descobri depois de analisar{" "}
            <strong className="text-foreground">318.842 posts do LinkedIn</strong> nos últimos 6 meses. 
            Não foi fácil. Mas o resultado me chocou.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="font-display text-2xl font-bold text-foreground mb-8 tracking-tight">
            92% dos posts falham pelos mesmos 5 motivos:
          </h3>

          <div className="space-y-4">
            {failReasons.map((item, i) => (
              <div
                key={i}
                className="flex gap-5 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 card-lift group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center text-on-color text-lg shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <strong className="font-display text-foreground text-lg block mb-1">{item.title}</strong>
                  <span className="text-slate-600 dark:text-slate-300">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mb-16">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-urgency-500 to-brand-500 rounded-full"></div>
          <blockquote className="pl-8 py-4 text-xl italic text-slate-700 dark:text-slate-300 font-medium">
            "Você provavelmente está cometendo 3 ou 4 desses erros AGORA MESMO.
            Não porque você é ruim. Mas porque ninguém te mostrou o processo."
          </blockquote>
        </div>

        <div className="mb-12">
          <h3 className="font-display text-2xl font-bold text-foreground mb-10 tracking-tight text-center">
            A Visão do Futuro{" "}
            <span className="text-slate-400 font-normal">(Imagine isso)</span>
          </h3>

          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-brand-300 via-brand-500 to-success-500"></div>
            
            <div className="space-y-12">
              {[
                { time: "Segunda, 07:00", text: "Você abre o VIRALL. Responde 3 perguntas. O processo te guia em 7 etapas.", color: "brand" },
                { time: "07:10 (10 min depois)", text: "Post completo na tela. Score: 8.4/10. Analytics: \"73% chance top 5%\"", color: "brand" },
                { time: "Domingo, 11:00", text: "847 visualizações (e subindo). 23 comentários relevantes. 4 DMs perguntando sobre serviços.", color: "success" },
              ].map((step, i) => (
                <div key={i} className={`relative flex items-start gap-6 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-white shrink-0 z-10 ${
                    step.color === "success" ? "bg-success-500" : "bg-brand-600"
                  }`}>
                    {i + 1}
                  </div>
                  <div className={`flex-1 p-6 rounded-2xl border max-w-sm ${
                    step.color === "success" 
                      ? "border-success-200 dark:border-success-700 bg-success-50 dark:bg-success-900/30" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  }`}>
                    <p className={`font-display font-bold mb-2 ${
                      step.color === "success" ? "text-success-700 dark:text-success-400" : "text-foreground"
                    }`}>{step.time}</p>
                    <p className={step.color === "success" ? "text-success-700 dark:text-success-400" : "text-slate-600 dark:text-slate-300"}>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xl font-medium text-foreground">
            Você sorri. Porque sabe que não foi sorte.{" "}
            <span className="font-display font-bold text-gradient">Foi o processo.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const steps = [
    { num: 1, title: "Pautas Inteligentes", text: "Processo sugere 3-5 temas baseados no seu perfil. Nunca mais 'sobre o que eu falo hoje?'", icon: Target },
    { num: 2, title: "Estrutura de Copy", text: "6 frameworks validados (PAS, AIDA, Contrarian...). O piloto automático do top 1%.", icon: LayoutTemplate },
    { num: 3, title: "Tipo de Conteúdo", text: "16 tipos testados (How-to, Polêmica, Bastidores...). Escolha o objetivo da semana.", icon: MessageSquare },
    { num: 4, title: "Hooks Magnéticos", text: "3 opções de hooks gerados. 73% de taxa de sucesso em reter atenção.", icon: Zap },
    { num: 5, title: "Corpo Completo", text: "Montado com seu tom de voz. Soa como VOCÊ, não como um robô.", icon: PenTool },
    { num: 6, title: "CTAs que Convertem", text: "Otimizados para salvamento (algoritmo) ou leads (dinheiro).", icon: CheckCircle },
    { num: 7, title: "Score + Validação", text: "Se tiver menos que 8/10, o processo melhora sozinho. Garantido.", icon: BarChart },
  ];

  return (
    <section id="solucao" className="py-28 bg-dark-900 text-white overflow-hidden relative scroll-mt-20 noise-overlay">
      <div className="orb orb-1 opacity-40"></div>
      <div className="orb orb-2 opacity-30"></div>
      
      <div className="absolute inset-0 grid-pattern"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full glass border border-white/20 text-sm font-medium text-brand-300 mb-6">
            <Zap className="w-4 h-4" />
            A Solução
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[0.95]">
            Apresento: <span className="text-shimmer">VIRALL</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-xl mx-auto">
            O processo de 7 etapas que transforma 10 minutos em posts que dominam o feed.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          <div className="relative">
            <h3 className="font-display text-2xl font-bold mb-12 text-white tracking-tight">
              Processo de evolução por Etapas
            </h3>

            <div className="space-y-6 relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-brand-500 via-brand-600/50 to-transparent"></div>

              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-5 group items-start relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-brand-400 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-500 transition-all duration-500 z-10 relative group-hover:scale-110">
                      <step.icon size={22} strokeWidth={2} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-[10px] text-on-color text-white z-20 shadow-lg shadow-brand-500/30">
                      {step.num}
                    </div>
                  </div>

                  <div className="pt-2 flex-1">
                    <h4 className="font-display font-bold text-lg text-white group-hover:text-brand-300 transition-colors mb-1.5 tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-28">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-urgency-500 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative glass rounded-3xl p-8 md:p-10 border border-white/10">
                <h3 className="font-display text-2xl font-bold mb-8 tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success-400" />
                  </div>
                  Resultado Final
                </h3>

                <div className="space-y-5">
                  {[
                    { label: "Tempo Investido", value: "10-15 min", sub: "vs 2-3 horas fazendo sozinho", color: "white" },
                    { label: "Score Garantido", value: "8/10", sub: "em cada post gerado", color: "success" },
                    { label: "Probabilidade Viral", value: "60-85%", sub: "chance de atingir top 5%", color: "brand" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 group">
                      <div className="text-sm text-slate-400 mb-2 font-medium">{stat.label}</div>
                      <div className={`font-display text-3xl font-bold tracking-tight ${
                        stat.color === "success" ? "text-success-400" : 
                        stat.color === "brand" ? "text-brand-300" : "text-white"
                      }`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{stat.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-brand-600/20 to-transparent border border-brand-500/30">
                  <p className="font-display font-bold text-white flex items-center gap-3">
                    <CheckCircle className="text-success-400 w-5 h-5" />
                    Zero bloqueio criativo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bonuses() {
  const bonuses = [
    { title: "The Hook Vault", subtitle: "147 Hooks Testados", value: "R$ 497", desc: "A mesma biblioteca que usei para analisar 318k posts. 73% taxa de sucesso.", icon: Book },
    { title: "CTA Arsenal", subtitle: "100+ CTAs Categorizados", value: "R$ 297", desc: "Nunca mais termine um post sem saber o que pedir. Copie, cole, adapte.", icon: Copy },
    { title: "Framework Vault", subtitle: "6 Estruturas de Copy", value: "R$ 397", desc: "Os mesmos frameworks que geram milhões em faturamento (PAS, AIDA, Story...).", icon: Layout },
    { title: "Content Calendar 2026", subtitle: "Planejamento de 90 Dias", value: "R$ 197", desc: "Seu próximo trimestre de conteúdo resolvido em 1 hora.", icon: Calendar },
    { title: "Jornada do Fundador", subtitle: "90 Páginas de Conteúdo", value: "R$ 1.000", desc: "Manual completo para alavancar seu LinkedIn em 10 dias de execução focada.", icon: Rocket },
    { title: "VIRALL Founders Circle", subtitle: "Comunidade Exclusiva", value: "R$ 997/ano", desc: "Networking com os membros. Calls mensais de Q&A.", icon: Users },
  ];

  return (
    <section className="py-28 bg-gradient-to-b from-background to-brand-50/50 dark:to-brand-900/20 relative">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 text-sm font-bold mb-6">
            <Gift className="w-4 h-4" />
            Early Access Exclusivo
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">
            Os 100 Primeiros Também Recebem:
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {bonuses.map((bonus, i) => (
            <div key={i} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 card-lift flex gap-5 items-start">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-100 dark:from-brand-900/50 to-brand-50 dark:to-brand-900/30 rounded-2xl flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <bonus.icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                  <h3 className="font-display font-bold text-lg text-foreground tracking-tight">
                    BONUS #{i + 1}
                  </h3>
                  <span className="bg-success-100 dark:bg-success-900/50 text-success-700 dark:text-success-400 px-3 py-1 rounded-full text-xs font-bold">
                    {bonus.value}
                  </span>
                </div>
                <p className="font-display font-semibold text-brand-600 dark:text-brand-400 mb-1.5 text-sm">{bonus.subtitle}</p>
                <p className="font-semibold text-foreground mb-1 text-[15px]">{bonus.title}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{bonus.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-dark-900 rounded-3xl p-10 md:p-12 text-center text-white overflow-hidden noise-overlay">
            <div className="orb orb-2 opacity-30"></div>
            <div className="relative z-10">
              <p className="text-slate-400 mb-3 uppercase tracking-[0.2em] text-sm font-medium">
                Valor Total dos Bônus
              </p>
              <div className="font-display text-5xl md:text-6xl font-extrabold text-white mb-6 line-through decoration-urgency-500 decoration-4 tracking-tight">
                R$ 3.385
              </div>
              <div className="inline-flex items-center gap-3 bg-success-500/20 border border-success-500/30 rounded-full px-6 py-3">
                <Gift className="w-5 h-5 text-success-400" />
                <p className="text-lg font-semibold text-success-300">
                  Grátis como early adopter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const comparisons = [
    {
      type: "bad",
      label: "Inviável",
      icon: UserX,
      title: "Fazer Sozinho",
      desc: "O caminho tradicional de agencias ou freelancers.",
      items: ["Custo altíssimo (Tempo ou R$)", "Depende de inspiração diária", "Zero previsibilidade de resultado", "Burnout criativo garantido"],
    },
    {
      type: "worse",
      label: "Amador",
      icon: Bot,
      title: "\"Ferramentas\" de IA",
      desc: "Apenas uma máscara (wrapper) do ChatGPT sem estratégia.",
      items: ["Conteúdo robótico e sem alma", "Você gasta mais tempo editando", "Zero processo, só aleatoriedade", "Sem polimento ou formatação", "Alucinações (fatos inventados)"],
    },
    {
      type: "best",
      label: "A Escolha do Top 1%",
      icon: BrainCircuit,
      title: "VIRALL (Caner)",
      desc: "Metodologia proprietária baseada em engenharia reversa.",
      items: ["318.842 posts reais analisados", "5 critérios de scoring preditivo", "Tom de voz 100% treinado", "Texto polido, pronto para postar", "Processo guiado, não mágica"],
    },
  ];

  return (
    <section id="depoimentos" className="py-28 bg-background scroll-mt-20 relative grid-pattern-light dark:grid-pattern">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20">
          <span className="inline-block font-display text-sm font-semibold text-brand-600 dark:text-brand-400 tracking-wide uppercase mb-4">
            Comparativo
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">
            Por que VIRALL funciona{" "}
            <span className="text-gradient">quando outros falham?</span>
          </h2>
        </div>

        <div className="flex md:grid md:grid-cols-3 gap-5 md:gap-6 mb-20 overflow-x-auto pb-4 md:pb-0 snap-x-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {comparisons.map((comp, i) => (
            <div 
              key={i} 
              className={`flex flex-col relative group min-w-[280px] md:min-w-0 snap-center shrink-0 md:shrink rounded-2xl p-6 md:p-8 transition-all duration-500 ${
                comp.type === "best" 
                  ? "bg-white dark:bg-slate-900 border-2 border-brand-500 shadow-xl shadow-brand-500/10 md:-translate-y-4 z-10" 
                  : comp.type === "worse"
                  ? "bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className={`absolute top-3 right-3 md:top-4 md:right-4 text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                comp.type === "best" ? "bg-brand-600 text-white" :
                comp.type === "worse" ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" :
                "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}>
                {comp.label}
              </div>
              
              <div className={`mb-6 transition-transform duration-300 group-hover:scale-110 ${
                comp.type === "best" ? "text-brand-600" :
                comp.type === "worse" ? "text-red-400" :
                "text-slate-400"
              }`}>
                <comp.icon size={36} strokeWidth={1.5} />
              </div>
              
              <h3 className={`font-display text-xl font-bold mb-2 tracking-tight ${
                comp.type === "best" ? "text-foreground" :
                comp.type === "worse" ? "text-red-900 dark:text-red-400" :
                "text-slate-700 dark:text-slate-300"
              }`}>
                {comp.title}
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${
                comp.type === "worse" ? "text-red-700/80 dark:text-red-400/80" : "text-slate-500 dark:text-slate-400"
              }`}>
                {comp.desc}
              </p>
              
              <div className={`h-px w-full mb-6 ${
                comp.type === "worse" ? "bg-red-100 dark:bg-red-900/50" : "bg-border"
              }`}></div>
              
              <ul className="space-y-3 flex-1">
                {comp.items.map((item, j) => (
                  <li key={j} className={`flex gap-3 text-sm font-medium items-start ${
                    comp.type === "best" ? "text-foreground" :
                    comp.type === "worse" ? "text-red-800 dark:text-red-300" :
                    "text-slate-600 dark:text-slate-400"
                  }`}>
                    {comp.type === "best" ? (
                      <Check className="shrink-0 text-success-500 w-5 h-5 mt-0.5" />
                    ) : (
                      <X className={`shrink-0 w-5 h-5 mt-0.5 ${comp.type === "worse" ? "text-red-400" : "text-slate-400"}`} />
                    )}
                    <span className="leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mb-8 md:hidden">Deslize para ver todas as opções</p>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-dark-900 text-white rounded-3xl p-8 md:p-12 overflow-hidden noise-overlay border border-white/10">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-10 text-center tracking-tight">
              ROI Claro: A Matemática Não Mente
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-5 px-4 text-slate-400 text-sm font-display font-semibold uppercase tracking-wider">Opção</th>
                    <th className="py-5 px-4 text-slate-400 text-sm font-display font-semibold uppercase tracking-wider">Custo Real</th>
                    <th className="py-5 px-4 text-slate-400 text-sm font-display font-semibold uppercase tracking-wider">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="group">
                    <td className="py-5 px-4 font-semibold text-slate-300">Fazer sozinho</td>
                    <td className="py-5 px-4 text-urgency-400 font-medium">R$ 2.400 - 3.600 / mês *</td>
                    <td className="py-5 px-4 text-slate-400">200 views, posts medíocres</td>
                  </tr>
                  <tr className="group">
                    <td className="py-5 px-4 font-semibold text-slate-300">Agência</td>
                    <td className="py-5 px-4 text-urgency-400 font-medium">R$ 3.000 - 8.000 / mês</td>
                    <td className="py-5 px-4 text-slate-400">Genérico, sem sua voz</td>
                  </tr>
                  <tr className="bg-brand-600/20 rounded-xl">
                    <td className="py-5 px-4 font-display font-bold text-white rounded-l-xl">VIRALL</td>
                    <td className="py-5 px-4 font-display text-2xl font-bold text-success-400">R$ 0,00</td>
                    <td className="py-5 px-4 font-bold text-white rounded-r-xl">Score 8/10 Garantido</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-8 text-xs text-slate-500 text-center">
              *Calculado a R$ 100/hora (conservador para B2B)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Guarantee() {
  const guarantees = [
    { icon: ShieldCheck, title: "Teste Total", desc: "Incondicional. Não amou? Basta cancelar o teste. Sem perguntas.", featured: false },
    { icon: RefreshCw, title: "Score 8", desc: "Se o score for menor que 8, continuo otimizando o processo PRA VOCÊ até chegar lá.", featured: false },
    { icon: Trophy, title: "Performance", desc: "Se seu engajamento não aumentar, devolvo 100% do dinheiro + Você fica com os bônus.", featured: true },
  ];

  return (
    <section className="py-28 bg-card relative">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 text-sm font-bold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Risco Zero
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">
            Garantia "LinkedIn Visível"
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-4">
            Garantia Tripla. Você não tem nada a perder.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {guarantees.map((g, i) => (
            <div 
              key={i} 
              className={`group p-8 rounded-2xl text-center transition-all duration-500 ${
                g.featured 
                  ? "bg-gradient-to-b from-brand-50 dark:from-brand-900/30 to-white dark:to-slate-900 border-2 border-brand-200 dark:border-brand-700 shadow-lg shadow-brand-100/50 dark:shadow-brand-900/20" 
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-500 group-hover:scale-110 ${
                g.featured ? "bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                <g.icon size={26} />
              </div>
              <h3 className={`font-display font-bold text-xl mb-3 tracking-tight ${
                g.featured ? "text-brand-700 dark:text-brand-400" : "text-foreground"
              }`}>
                {g.title}
              </h3>
              <p className={`text-sm leading-relaxed ${
                g.featured ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-600 dark:text-slate-300"
              }`}>
                {g.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Scarcity() {
  return (
    <section className="py-28 bg-background relative grid-pattern-light dark:grid-pattern">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-urgency-500 text-white text-sm text-on-color mb-6 animate-pulse">
            <Flame className="w-4 h-4" />
            Urgência Real
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            100 vagas de early access
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap text-2xl md:text-3xl font-medium">
            <span className="line-through decoration-urgency-500 decoration-2 text-slate-400">
              R$ 287/mês
            </span>
            <span className="text-slate-400">por</span>
            <span className="font-display font-extrabold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30 px-4 py-1 rounded-full">
              ZERO
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mt-6">
            Lançamento oficial: Março 2026. Os 100 primeiros entram <strong className="text-foreground">GRÁTIS</strong> e levam R$ 3.385 em bônus.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 mb-16 relative overflow-hidden">
          <div className="space-y-8">
            <div className="relative">
              <div className="flex flex-wrap justify-between text-sm font-bold text-slate-400 mb-3 gap-2">
                <span className="font-display">LOTE 1: Janeiro 2026</span>
                <span className="flex items-center gap-2 text-success-600 dark:text-success-400">
                  <span className="w-2 h-2 rounded-full bg-success-500"></span>
                  100% ESGOTADO
                </span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 dark:bg-slate-600 w-full"></div>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-wrap justify-between text-sm font-bold text-foreground mb-3 gap-2">
                <span className="flex items-center gap-3 flex-wrap font-display">
                  LOTE 2: Fevereiro 2026
                  <span className="bg-urgency-500 text-white text-[10px] px-3 py-1 rounded-full text-on-color animate-pulse">
                    FECHANDO
                  </span>
                </span>
                <span className="text-urgency-600 dark:text-urgency-400">Poucas vagas restantes</span>
              </div>
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 w-[70%] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-progress-stripes"></div>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Últimas 3 preenchidas nas últimas 24h.
              </p>
            </div>

            <div className="opacity-40 grayscale space-y-6">
              <div className="relative">
                <div className="flex flex-wrap justify-between text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 gap-2">
                  <span className="font-display">LOTE 3: Disponível</span>
                  <span>Abre em breve</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"></div>
              </div>
              <div className="relative">
                <div className="flex flex-wrap justify-between text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 gap-2">
                  <span className="font-display">LOTE 4: Março 2026</span>
                  <span>Preço Cheio (R$ 287/mês)</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto bg-brand-50/50 dark:bg-brand-900/20 rounded-2xl p-8 border border-brand-100 dark:border-brand-800">
          <h4 className="font-display font-bold text-xl text-foreground mb-4 tracking-tight">
            Por que de graça?
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Não é caridade. Preciso de{" "}
            <strong className="text-foreground">feedback brutal</strong> e{" "}
            <strong className="text-foreground">casos de sucesso</strong> antes de cobrar R$ 287/mês do
            público geral. Eu te dou o software, você me dá feedback. Win-win.
          </p>
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const { toast } = useToast();
  
  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });

  const joinMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/waitlist", { email });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bem-vindo(a) à lista!",
        description: `Você é o #${data.count} na lista. Entraremos em contato em breve!`,
      });
      trackWaitlistSignup("comparison");
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/count"] });
      form.reset();
    },
    onError: (error: Error) => {
      if (error.message?.includes("409") || error.message?.includes("already")) {
        toast({
          title: "Você já está na lista!",
          description: "Este e-mail já está cadastrado na nossa lista de espera.",
        });
      } else {
        toast({
          title: "Erro ao entrar na lista",
          description: "Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: WaitlistFormData) => {
    trackButtonClick("waitlist_submit", "comparison");
    joinMutation.mutate(data.email);
  };

  return (
    <section className="py-28 bg-dark-900 text-white relative overflow-hidden noise-overlay">
      <div className="orb orb-1 opacity-30"></div>
      <div className="orb orb-3 opacity-30"></div>
      <div className="absolute inset-0 grid-pattern"></div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-20 tracking-tight leading-tight">
          A escolha parece <span className="text-shimmer">óbvia.</span>
        </h2>

        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto mb-20">
          <div className="flex-1 p-8 rounded-3xl glass border border-white/10 opacity-60 hover:opacity-100 transition-all duration-500 group">
            <h3 className="font-display text-xl font-bold mb-6 text-slate-300 tracking-tight">
              Opção A: Continuar Invisível
            </h3>
            <ul className="text-left space-y-4 text-slate-400 text-sm mb-8">
              {["Fecha essa página e volta pro LinkedIn amanhã.", "Cursor piscando. Mente em branco.", "3 horas pra criar um post que ninguém vê.", "Concorrentes continuam dominando."].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="py-5 border-t border-white/10">
              <span className="block text-sm text-slate-500 mb-2">Custo Real</span>
              <strong className="font-display text-lg text-white">R$ 2.400+/mês em tempo perdido</strong>
            </div>
          </div>

          <div className="flex-1 rounded-3xl bg-white dark:bg-slate-900 text-foreground border-2 border-brand-500 shadow-2xl shadow-brand-500/20 relative transform md:-translate-y-6 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-500 to-brand-700 text-white px-6 py-2.5 rounded-full text-sm text-on-color tracking-wider shadow-lg">
              ESCOLHA INTELIGENTE
            </div>
            <div className="p-8">
              <h3 className="font-display text-2xl font-bold mb-6 text-brand-600 dark:text-brand-400 tracking-tight mt-4">
                Opção B: Entrar Pra Lista
              </h3>
              <ul className="text-left space-y-4 text-slate-600 dark:text-slate-300 font-medium text-sm mb-8">
                {["Coloca seu email abaixo em 10 segundos.", "Garante uma das poucas vagas restantes.", "Recebe acesso Antecipado GRÁTIS.", "Score 8/10 garantido em cada post."].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="py-6 bg-brand-50 dark:bg-brand-900/30 px-8 flex flex-col items-center">
              <span className="block text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wide">
                Custo para Fundadores
              </span>
              <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
                <span className="text-slate-400 line-through font-bold text-lg decoration-urgency-500 decoration-2">R$ 287/mês</span>
                <span className="bg-success-100 dark:bg-success-900/50 text-success-700 dark:text-success-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">100% OFF</span>
              </div>
              <strong className="font-display text-success-600 dark:text-success-400 text-4xl font-extrabold tracking-tight">GRÁTIS</strong>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Economia de R$ 3.444/ano</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-8 font-display text-xl font-bold tracking-tight">
            Mas só você pode fazer.
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Seu melhor e-mail..."
                        className="h-14 px-6 bg-white dark:bg-white/10 text-dark-900 dark:text-white rounded-xl text-lg border-0 dark:border dark:border-white/20 focus-visible:ring-4 focus-visible:ring-brand-500/50 placeholder:text-slate-400"
                        data-testid="input-email-comparison"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="h-14 gap-2 bg-urgency-500 text-white border-urgency-border rounded-xl text-on-color"
                disabled={joinMutation.isPending}
                data-testid="button-waitlist-comparison"
              >
                {joinMutation.isPending ? "ENTRANDO..." : "GARANTIR VAGA GRÁTIS"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          </Form>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success-500" />
              Grátis para sempre (Early Access)
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success-500" />
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-urgency-500" />
              Poucas vagas restantes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: "Quando vou receber acesso?",
      answer:
        "Lote 2: Fevereiro 2026. Você entra na lista grátis agora. Quando seu lote abrir, você recebe o convite para entrar GRÁTIS e garantir seu acesso exclusivo de fundador.",
    },
    {
      question: "É realmente grátis?",
      answer: (
        <>
          Sim. O preço oficial da assinatura é{" "}
          <span className="line-through text-slate-400 decoration-red-400">
            R$ 287/mês
          </span>
          , mas para os 100 primeiros fundadores é{" "}
          <strong className="text-success-600 bg-success-50 px-1 rounded">
            100% GRÁTIS
          </strong>
          . Estou liberando o acesso sem custo porque preciso de validação e
          casos de sucesso antes de cobrar o valor cheio.
        </>
      ),
    },
    {
      question: "E se eu não gostar?",
      answer:
        "Garantia Tripla: Você não paga nada para entrar, então o risco financeiro é zero. Se não gostar, basta parar de usar. Simples.",
    },
    {
      question: "VIRALL funciona para o meu nicho?",
      answer:
        "Sim. O processo se adapta a qualquer indústria B2B (consultoria, tech, jurídico, saúde...). O algoritmo do LinkedIn é o mesmo pra todos, a Caner decodifica esse algoritmo.",
    },
    {
      question: "Por que não usar só o ChatGPT?",
      answer:
        "O ChatGPT usa prompts genéricos e não tem validação. O VIRALL usa dados reais de 318.842 posts, tem tom de voz 100% personalizado e te dá um Score Preditivo ANTES de postar.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-28 bg-card scroll-mt-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 text-sm font-bold mb-6">
            <HelpCircle className="w-4 h-4" />
            Dúvidas
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 ${
                openIndex === idx ? "border-brand-200 dark:border-brand-700 shadow-lg shadow-brand-100/50 dark:shadow-brand-900/20" : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <button
                onClick={() => toggle(idx)}
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
                className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 focus:outline-none group"
                data-testid={`button-faq-${idx}`}
              >
                <span className={`font-display font-semibold text-lg transition-colors ${
                  openIndex === idx ? "text-brand-600 dark:text-brand-400" : "text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400"
                }`}>
                  {faq.question}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  openIndex === idx ? "bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 rotate-180" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              <div
                id={`faq-answer-${idx}`}
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === idx ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-20 pb-32 md:pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-3xl p-8 md:p-10 text-slate-700 dark:text-slate-300 space-y-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <strong className="font-display text-brand-700 dark:text-brand-400 block mb-2">P.S.:</strong>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">147 profissionais já estão na lista. 100 vagas de early access.
              Lote 1 esgotou em 8 dias. Se você está lendo isso e ainda não
              entrou, sua vaga está sendo ocupada enquanto você pensa.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success-100 dark:bg-success-900/50 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <strong className="font-display text-brand-700 dark:text-brand-400 block mb-2">P.P.S.:</strong>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">Eu poderia cobrar R$ 287/mês (US$ 49). Escolhi liberar{" "}
              <span className="font-display font-bold text-success-600 dark:text-success-400">GRÁTIS</span>{" "}
              para os primeiros 100 fundadores. Por que? Quero 100 casos de
              sucesso ANTES do lançamento. É estratégia, não caridade. Mas essa
              janela fecha em 4-6 semanas.</p>
            </div>
          </div>
          <div className="bg-brand-50 dark:bg-brand-900/30 rounded-2xl p-6 border border-brand-100 dark:border-brand-800">
            <p className="font-medium text-foreground leading-relaxed">
              Daqui a 90 dias, você vai estar em um desses lugares: 1) Ainda
              invisível, pagando boleto. 2) Gerando leads com posts score 8/10 de
              graça.
            </p>
            <p className="mt-3 font-display font-bold text-lg text-brand-600 dark:text-brand-400">
              A decisão demora 30 segundos.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-border pt-10">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-foreground text-2xl tracking-tighter">VIRALL</span>
            <span className="font-display font-bold text-brand-600 dark:text-brand-400 text-sm">TM</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
            Powered by <span className="font-semibold">Caner</span>
            <br />
            Transformando profissionais invisíveis em autoridades.
          </p>
          <div className="flex gap-6 text-sm font-medium">
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" data-testid="link-termos">Termos</a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" data-testid="link-privacidade">Privacidade</a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" data-testid="link-suporte">Suporte</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 800);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const startPosition = window.scrollY;
    const distance = -startPosition;
    const duration = 800;
    let start: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startPosition + distance * ease);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-md border-t border-border p-4 shadow-2xl z-50 md:hidden animate-slide-up safe-area-bottom">
      <div className="flex items-center justify-between gap-4">
        <div className="leading-tight">
          <span className="font-display font-bold text-foreground text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-urgency-500" />
            Poucas Vagas
          </span>
          <span className="text-success-600 text-xs font-bold">
            100% OFF + R$ 3.385 em Bônus
          </span>
        </div>
        <Button
          className="bg-urgency-500 text-white border-urgency-border whitespace-nowrap min-h-11 text-on-color"
          onClick={scrollToTop}
          data-testid="button-sticky-cta"
        >
          GARANTIR VAGA
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="min-h-screen font-body antialiased text-foreground bg-background">
      <ScrollProgress />
      <Navbar />
      <Hero />
      <PainPoints />
      <ProblemStory />
      <Solution />
      <Bonuses />
      <SocialProof />
      <Guarantee />
      <Scarcity />
      <Comparison />
      <FAQ />
      <Footer />
      <StickyCTA />
    </main>
  );
}
