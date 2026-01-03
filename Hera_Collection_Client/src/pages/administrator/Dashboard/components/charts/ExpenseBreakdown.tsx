import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ExpenseBreakdownProps {
  data: any[];
}

const COLORS = ['#7C3AED', '#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

export const ExpenseBreakdown = ({ data }: ExpenseBreakdownProps) => {
  return (
    <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Expense Distribution</CardTitle>
        <CardDescription>Breakdown of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
