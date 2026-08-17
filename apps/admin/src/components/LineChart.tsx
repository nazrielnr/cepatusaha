import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

interface LineChartProps {
  data: Array<{ date: string; value: number }>
  title?: string
  color?: string
  dataKey?: string
  xAxisKey?: string
}

export function LineChart({
  data,
  title,
  color = '#3b82f6',
  dataKey = 'value',
  xAxisKey = 'date',
}: LineChartProps) {
  const chartConfig: ChartConfig = {
    [dataKey]: {
      label: title || 'Value',
      color: color,
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ChartContainer>
  )
}
