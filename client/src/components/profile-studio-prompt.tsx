import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Check, Clock } from "lucide-react";
import type { ContentProfile } from "@shared/schema";

export function ProfileStudioPrompt() {
  const [, navigate] = useLocation();
  const [showModal, setShowModal] = useState(false);

  const { data: profile } = useQuery<ContentProfile>({
    queryKey: ["/api/profile"],
  });

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem("profile-studio-prompt-seen");
    const isProfileIncomplete = profile?.onboardingCompleted && !profile?.profileStudioCompleted;
    
    if (isProfileIncomplete && !hasSeenPrompt) {
      setShowModal(true);
    }
  }, [profile]);

  const handleComplete = () => {
    localStorage.setItem("profile-studio-prompt-seen", "true");
    setShowModal(false);
    navigate("/profile-studio");
  };

  const handleLater = () => {
    localStorage.setItem("profile-studio-prompt-seen", "true");
    setShowModal(false);
  };

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <DialogTitle>Perfil Criado com Sucesso!</DialogTitle>
            </div>
            <DialogDescription>
              Quer que seus posts soem EXATAMENTE como você?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete seu perfil no Profile Studio:
            </p>
            
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                4 perguntas rápidas sobre seu estilo
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Testes de personalidade (DISC, Big Five)
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Ajuste fino do seu tom de voz
              </li>
            </ul>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Leva ~5 minutos e transforma completamente a qualidade dos seus posts.
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleComplete}
                className="flex-1"
                data-testid="button-complete-profile-now"
              >
                Completar Agora
              </Button>
              <Button
                variant="outline"
                onClick={handleLater}
                data-testid="button-complete-profile-later"
              >
                Depois
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
