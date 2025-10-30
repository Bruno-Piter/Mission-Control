import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface OrderFormProps {
  apiUrl: string;
}

export const OrderForm = ({ apiUrl }: OrderFormProps) => {
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || undefined,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const data = await response.json();
      toast.success("Pedido criado com sucesso!", {
        description: `Order ID: ${data.orderId}`,
      });

      setCustomerId("");
      setAmount("");
    } catch (error) {
      toast.error("Erro ao criar pedido", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
        Criar Novo Pedido
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerId">Customer ID</Label>
          <Input
            id="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="customer-123 (opcional)"
            className="bg-background/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (Amount)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="99.99"
            required
            className="bg-background/50 border-border"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Criar Pedido
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
