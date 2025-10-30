import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RotateCcw, Loader2 } from "lucide-react";

interface DLQManagerProps { adminUrl: string; }

export const DLQManager = ({ adminUrl }: DLQManagerProps) => {
  const [queueName, setQueueName] = useState("");
  const [count, setCount] = useState("10");
  const [isLoading, setIsLoading] = useState(false);

  const handleReplay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${adminUrl}/dlq/replay?queue=${encodeURIComponent(queueName)}&count=${count}`, { method: "POST" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to replay messages");
      }
      const data = await response.json();
      toast.success("Mensagens reenviadas com sucesso!", { description: `${data.replayed} mensagens de ${data.from} para ${data.to}` });
      setQueueName(""); setCount("10");
    } catch (error) {
      toast.error("Erro ao reenviar mensagens", { description: error instanceof Error ? error.message : "Erro desconhecido" });
    } finally { setIsLoading(false); }
  };

  return (
    <Card className="bg-gradient-card shadow-card border-border/50">
      <h2 className="text-2xl font-bold mb-6 text-accent">Gerenciar Dead Letter Queue</h2>
      <form onSubmit={handleReplay} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="queueName">Nome da Fila (_error)</Label>
          <Input id="queueName" value={queueName} onChange={(e) => setQueueName(e.target.value)} placeholder="billing-ordercreated_error" required className="bg-background/50 border-border" />
          <p className="text-xs text-muted-foreground">A fila deve terminar com _error</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="count">Quantidade de Mensagens</Label>
          <Input id="count" type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} required className="bg-background/50 border-border" />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reenviando...</>) : (<><RotateCcw className="mr-2 h-4 w-4" />Reenviar Mensagens</>)}
        </Button>
      </form>
    </Card>
  );
};