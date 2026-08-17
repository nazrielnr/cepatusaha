import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface FunctionExecutionChartProps {
  data: Array<{
    date: string
    executions: number
    successful: number
    failed: number
  }>
}

export function FunctionExecutionChart({ data }: FunctionExecutionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="executions" 
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6' }}
          name="Total Executions"
        />
        <Line 
          type="monotone" 
          dataKey="successful" 
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981' }}
          name="Successful"
        />
        <Line 
          type="monotone" 
          dataKey="failed" 
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444' }}
          name="Failed"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
