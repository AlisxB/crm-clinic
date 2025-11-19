import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

export default function Finances() {
  const recentTransactions = [
    { id: 1, patient: "Sarah Johnson", amount: 250, type: "Payment", date: "2024-09-25", method: "Credit Card" },
    { id: 2, patient: "Michael Chen", amount: 180, type: "Payment", date: "2024-09-24", method: "Insurance" },
    { id: 3, patient: "Emily Davis", amount: 450, type: "Payment", date: "2024-09-23", method: "Cash" },
    { id: 4, patient: "James Wilson", amount: 320, type: "Payment", date: "2024-09-22", method: "Credit Card" },
    { id: 5, patient: "Lisa Anderson", amount: 200, type: "Payment", date: "2024-09-21", method: "Debit Card" },
  ];

  const revenueData = [
    { month: "Jan", revenue: 4000 },
    { month: "Fev", revenue: 3000 },
    { month: "Mar", revenue: 5000 },
    { month: "Abr", revenue: 4500 },
    { month: "Mai", revenue: 6000 },
    { month: "Jun", revenue: 5500 },
  ];

  const chartConfig = {
    revenue: {
      label: "Receita",
      color: "#2563eb",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Gestão Financeira</h1>
            <p className="mt-1 text-primary-foreground/80">Acompanhe receitas, despesas e relatórios financeiros</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Financial Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <StatCard
            title="Receita Total"
            value="R$45,890"
            icon={DollarSign}
            trend={{ value: "18% do último mês", positive: true }}
          />
          <StatCard
            title="Esta Semana"
            value="R$8,450"
            icon={TrendingUp}
            trend={{ value: "12% da última semana", positive: true }}
          />
          <StatCard
            title="Pagamentos Pendentes"
            value="R$3,240"
            icon={CreditCard}
          />
          <StatCard
            title="Despesas"
            value="R$12,340"
            icon={TrendingDown}
            trend={{ value: "5% do último mês", positive: false }}
          />
        </div>

        {/* Charts Placeholder */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Visão Geral da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <ResponsiveContainer>
                  <BarChart data={revenueData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border">
                <div className="text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">O gráfico de distribuição de pagamentos estará disponível em breve</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mt-8 animate-slide-up">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{transaction.patient}</p>
                      <p className="text-sm text-muted-foreground">{transaction.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">R${transaction.amount}</p>
                    <p className="text-sm text-muted-foreground">{transaction.method}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
