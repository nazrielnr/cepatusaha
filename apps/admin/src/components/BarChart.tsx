import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

interface BarChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  color?: string
  dataKey?: string
  xAxisKey?: string
}

export function BarChart({
  data,
  title,
  color = '#3b82f6',
  dataKey = 'value',
  xAxisKey = 'name',
}: BarChartProps) {
  const chartConfig: ChartConfig = {
    [dataKey]: {
      label: title || 'Value',
      color: color,
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ChartContainer>
  )
}
