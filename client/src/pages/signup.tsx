import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Sparkles } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Crie sua conta no Virall
          </CardTitle>
          <CardDescription className="text-base">
            Você foi convidado para criar conteúdo viral no LinkedIn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            asChild
            className="w-full"
            size="lg"
            data-testid="button-signup-create"
          >
            <a href="/api/signup">
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Minha Conta
            </a>
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </CardContent>
      </Card>
      
      <a 
        href="/"
        className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="link-back-home"
      >
        Voltar para a página inicial
      </a>
    </div>
  );
}
