import { useState } from "react";
import { OrderForm } from "@/components/OrderForm";
import { QueueMonitor } from "@/components/QueueMonitor";
import { DLQManager } from "@/components/DLQManager";
import { HealthStatus } from "@/components/HealthStatus";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Snowflake } from "lucide-react";

const Index = () => {
  const [orderApiUrl, setOrderApiUrl] = useState(
    localStorage.getItem("orderApiUrl") || "http://localhost:5000"
  );
  const [adminApiUrl, setAdminApiUrl] = useState(
    localStorage.getItem("adminApiUrl") || "http://localhost:5080"
  );

  const handleUrlsChange = (orderUrl: string, adminUrl: string) => {
    setOrderApiUrl(orderUrl);
    setAdminApiUrl(adminUrl);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Snowflake className="h-12 w-12 text-primary" aria-hidden="true" />
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mission Control
            </h1>
            <Snowflake className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Dashboard de gerenciamento de integração de microserviços
          </p>
        </header>

        {/* Health Status */}
        <HealthStatus orderApiUrl={orderApiUrl} adminApiUrl={adminApiUrl} />

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <OrderForm apiUrl={orderApiUrl} />
            <DLQManager adminUrl={adminApiUrl} />
          </div>

          {/* Right Column */}
          <div>
            <QueueMonitor adminUrl={adminApiUrl} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8">
          <p>Mission-Control • RabbitMQ • MassTransit • OpenTelemetry</p>
        </footer>
      </div>

      {/* Settings */}
      <SettingsPanel onUrlsChange={handleUrlsChange} />
    </div>
  );
};

export default Index;
