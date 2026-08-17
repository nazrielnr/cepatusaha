import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

interface PieChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  colors?: string[]
  showLegend?: boolean
}

// Neutral color palette as specified in requirements
const DEFAULT_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c026d3']

export function PieChart({
  data,
  title,
  colors = DEFAULT_COLORS,
  showLegend = true,
}: PieChartProps) {
  // Build chart config from data
  const chartConfig: ChartConfig = data.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: colors[index % colors.length],
    }
    return config
  }, {} as ChartConfig)

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  )
}
