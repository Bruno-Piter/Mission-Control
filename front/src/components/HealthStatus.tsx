import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Zap } from "lucide-react";

interface HealthStatusProps {
  orderApiUrl: string;
  adminApiUrl: string;
}

export const HealthStatus = ({ orderApiUrl, adminApiUrl }: HealthStatusProps) => {
  const { data: orderApiHealth, isLoading: orderLoading } = useQuery({
    queryKey: ["orderApiHealth", orderApiUrl],
    queryFn: async () => {
      const response = await fetch(`${orderApiUrl}/`);
      if (!response.ok) throw new Error("Order API unavailable");
      return response.json();
    },
    refetchInterval: 10000,
    retry: 1,
  });

  const { data: adminApiHealth, isLoading: adminLoading } = useQuery({
    queryKey: ["adminApiHealth", adminApiUrl],
    queryFn: async () => {
      const response = await fetch(`${adminApiUrl}/health`);
      if (!response.ok) throw new Error("Admin API unavailable");
      return response.json();
    },
    refetchInterval: 10000,
    retry: 1,
  });

  const { data: queuesData, isLoading: queuesLoading } = useQuery({
    queryKey: ["queues", adminApiUrl],
    queryFn: async () => {
      const response = await fetch(`${adminApiUrl}/queues`);
      if (!response.ok) throw new Error("RabbitMQ queues unavailable");
      return response.json() as Promise<
        { name: string; messages: number; messages_ready: number; messages_unacknowledged: number }[]
      >;
    },
    refetchInterval: 10000,
    retry: 1,
  });

  const rabbitOk = !!queuesData && Array.isArray(queuesData);

  const services = [
    { name: "Order API", status: orderApiHealth?.status === "ok", loading: orderLoading, icon: Server },
    { name: "Admin API", status: adminApiHealth?.status === "ok", loading: adminLoading, icon: Database },
    { name: "RabbitMQ",  status: rabbitOk,                       loading: queuesLoading, icon: Zap },
  ];

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Status dos Serviços</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.name}
              className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{service.name}</span>
                </div>
                {service.loading ? (
                  <Badge variant="secondary">Checking...</Badge>
                ) : service.status ? (
                  <Badge className="bg-gradient-success border-0">Online</Badge>
                ) : (
                  <Badge variant="destructive">Offline</Badge>
                )}
              </div>
              <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    service.status ? "bg-gradient-success w-full" : "bg-destructive w-0"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
