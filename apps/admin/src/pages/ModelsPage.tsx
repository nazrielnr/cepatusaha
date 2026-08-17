import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { AdminDataTable } from '@/components/AdminDataTable'
import { ModelFormDialog } from '@/components/ModelFormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import adminApi from '@/api/admin-client'

interface AIModel {
  id: string
  provider: string
  model_name: string
  model_identifier: string
  priority: number
  is_active: boolean
  capabilities?: any
  created_at: string
  updated_at: string
}

interface ModelHealth {
  provider: string
  model: string
  available: boolean
  response_time_ms?: number
  last_checked: string
}

export function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [health, setHealth] = useState<ModelHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<AIModel | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch models and health data
      const [modelsResponse, healthResponse] = await Promise.all([
        adminApi.models.list(),
        adminApi.models.health()
      ])
      
      const modelsData = (modelsResponse as any)?.data?.models || (modelsResponse as any)?.data
      const healthData = (healthResponse as any)?.data?.health || (healthResponse as any)?.data
      setModels(Array.isArray(modelsData) ? modelsData : [])
      setHealth(Array.isArray(healthData) ? healthData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
      console.error('Error loading models:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getHealthForModel = (provider: string, modelIdentifier: string) => {
    return health.find(h => 
      h.provider === provider && h.model === modelIdentifier
    )
  }

  const handleEdit = (model: AIModel) => {
    setSelectedModel(model)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedModel(null)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    loadData()
  }

  const handleDelete = (model: AIModel) => {
    setModelToDelete(model)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!modelToDelete?.id) return

    try {
      setDeleting(true)
      await adminApi.models.delete(modelToDelete.id)
      setDeleteDialogOpen(false)
      setModelToDelete(null)
      loadData()
    } catch (err) {
      console.error('Error deleting model:', err)
      alert('Failed to delete model. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (model: AIModel) => {
    try {
      await adminApi.models.update(model.id, {
        ...model,
        is_active: !model.is_active
      })
      loadData()
    } catch (err) {
      console.error('Error toggling model:', err)
      alert('Failed to toggle model status. Please try again.')
    }
  }

  const columns = [
    {
      header: 'Provider',
      accessor: (model: AIModel) => (
        <div className="flex items-center gap-2">
          <span className="font-medium capitalize">
            OpenAI Compatible
          </span>
        </div>
      ),
    },
    {
      header: 'Model Name',
      accessor: (model: AIModel) => (
        <div>
          <div className="font-medium">{model.model_name}</div>
          <div className="text-sm text-gray-500">{model.model_identifier}</div>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: (model: AIModel) => (
        <Badge variant="outline">{model.priority}</Badge>
      ),
    },
    {
      header: 'Enabled',
      accessor: (model: AIModel) => (
        <Switch
          checked={model.is_active}
          onCheckedChange={() => handleToggleActive(model)}
        />
      ),
    },
    {
      header: 'Status',
      accessor: (model: AIModel) => {
        const modelHealth = getHealthForModel(model.provider, model.model_identifier)
        
        if (!model.is_active) {
          return <Badge variant="secondary">Inactive</Badge>
        }
        
        if (!modelHealth) {
          return <Badge variant="outline">Unknown</Badge>
        }
        
        return modelHealth.available ? (
          <Badge className="bg-accent0 hover:bg-accent">
            Active
          </Badge>
        ) : (
          <Badge variant="destructive">Unavailable</Badge>
        )
      },
    },
    {
      header: 'Response Time',
      accessor: (model: AIModel) => {
        const modelHealth = getHealthForModel(model.provider, model.model_identifier)
        
        if (!modelHealth || !modelHealth.response_time_ms) {
          return <span className="text-gray-400">-</span>
        }
        
        const time = modelHealth.response_time_ms
        const color = time < 500 ? 'text-accent' : time < 1000 ? 'text-secondary' : 'text-destructive'
        
        return <span className={color}>{time}ms</span>
      },
    },
    {
      header: 'Actions',
      accessor: (model: AIModel) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(model)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(model)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-destructive dark:bg-destructive/20 border border-destructive dark:border-destructive rounded-lg p-4">
          <h3 className="text-destructive dark:text-destructive font-semibold mb-2">Error Loading Models</h3>
          <p className="text-destructive dark:text-destructive">{error}</p>
          <Button 
            onClick={loadData} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Models Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI model configurations and monitor their health
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadData} 
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-lg border">
        <AdminDataTable
          data={models}
          columns={columns}
          emptyMessage="No AI models configured"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Total Models</div>
          <div className="text-2xl font-bold mt-1">{models.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Active Models</div>
          <div className="text-2xl font-bold mt-1">
            {models.filter(m => m.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Available Models</div>
          <div className="text-2xl font-bold mt-1">
            {health.filter(h => h.available).length}
          </div>
        </div>
      </div>

      {/* Model Form Dialog */}
      <ModelFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={selectedModel}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete AI Model"
        description={`Are you sure you want to delete "${modelToDelete?.model_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
