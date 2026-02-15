import { AnalyticsData } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

const COLORS = ['#1e3a5f', '#d4a853', '#2563eb', '#16a34a', '#dc2626'];

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Trend */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(v) => `Le ${Math.round(v / 1000)}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#d4a853"
                strokeWidth={3}
                dot={{ fill: '#d4a853', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders by Status */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.ordersByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
                nameKey="status"
                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
              >
                {data.ordersByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" width={120} stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="sales" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Category */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tickFormatter={(v) => `Le ${Math.round(v / 1000)}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="revenue" fill="#d4a853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
