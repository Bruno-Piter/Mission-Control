import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface QueueMonitorProps {
  adminUrl: string;
}

type QueueInfo = {
  name: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
};

export const QueueMonitor = ({ adminUrl }: QueueMonitorProps) => {
  const query = useQuery({
    queryKey: ["queues", adminUrl],
    queryFn: async () => {
      const r = await fetch(`${adminUrl}/queues`);
      if (!r.ok) throw new Error("Falha ao consultar /queues");
      return (await r.json()) as QueueInfo[];
    },
    refetchInterval: 5000,
  });

  const queues = query.data ?? [];
  const dlqs = queues.filter(q => q.name.endsWith("_error"));
  const normals = queues.filter(q => !q.name.endsWith("_error"));

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Filas (RabbitMQ)</h2>
        <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm uppercase text-muted-foreground mb-2">Ativas</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {normals.map((q) => (
              <div key={q.name} className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{q.name}</span>
                  <Badge variant="secondary">{q.messages} msgs</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  ready: {q.messages_ready} • unacked: {q.messages_unacknowledged}
                </div>
              </div>
            ))}
            {normals.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhuma fila ativa encontrada.</div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm uppercase text-muted-foreground mb-2">Dead Letter Queues</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {dlqs.map((q) => (
              <div key={q.name} className="p-4 rounded-lg border border-destructive/40 bg-destructive/10">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{q.name}</span>
                  <Badge variant="destructive">{q.messages} na DLQ</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  ready: {q.messages_ready} • unacked: {q.messages_unacknowledged}
                </div>
              </div>
            ))}
            {dlqs.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhuma DLQ pendente.</div>
            )}
          </div>
        </section>
      </div>
    </Card>
  );
};
