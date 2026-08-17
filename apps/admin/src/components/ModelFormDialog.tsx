import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import adminApi from '@/api/admin-client'

interface AIModel {
  id?: string
  provider: string
  model_name: string
  model_identifier: string
  api_endpoint?: string
  api_key?: string
  priority: number
  is_active: boolean
  capabilities?: {
    streaming: boolean
    functionCalling: boolean
    maxTokens: number
    supportedLanguages: string[]
  }
}

interface ModelFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: AIModel | null
  onSuccess: () => void
}

const DEFAULT_CAPABILITIES = {
  streaming: true,
  functionCalling: true,
  maxTokens: 8192,
  supportedLanguages: ['en', 'id'],
}

const emptyModel = (): AIModel => ({
  provider: 'openai_compatible',
  model_name: '',
  model_identifier: '',
  api_endpoint: '',
  api_key: '',
  priority: 5,
  is_active: true,
  capabilities: DEFAULT_CAPABILITIES,
})

export function ModelFormDialog({ open, onOpenChange, model, onSuccess }: ModelFormDialogProps) {
  const [formData, setFormData] = useState<AIModel>(emptyModel())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormData(model ? { ...model, provider: 'openai_compatible', capabilities: model.capabilities || DEFAULT_CAPABILITIES } : emptyModel())
    setError(null)
  }, [open, model])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.model_name.trim()) return setError('Model name is required')
    if (!formData.model_identifier.trim()) return setError('Model identifier is required')

    try {
      setLoading(true)
      setError(null)
      const payload = { ...formData, provider: 'openai_compatible', capabilities: formData.capabilities || DEFAULT_CAPABILITIES }
      if (model?.id) await adminApi.models.update(model.id, payload)
      else await adminApi.models.create(payload)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save model')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{model ? 'Edit AI Model' : 'Add AI Model'}</DialogTitle>
            <DialogDescription>Model IDs are sent to the single OpenAI-compatible API configured in Workers env.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Input value="OpenAI Compatible" disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model_name">Model Name *</Label>
              <Input id="model_name" placeholder="GPT-4o Mini" value={formData.model_name} onChange={(e) => setFormData({ ...formData, model_name: e.target.value })} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model_identifier">Model Identifier *</Label>
              <Input id="model_identifier" placeholder="gpt-4o-mini" value={formData.model_identifier} onChange={(e) => setFormData({ ...formData, model_identifier: e.target.value })} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" min="0" max="100" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value, 10) || 0 })} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input id="maxTokens" type="number" min="1" value={formData.capabilities?.maxTokens || 8192} onChange={(e) => setFormData({ ...formData, capabilities: { ...(formData.capabilities || DEFAULT_CAPABILITIES), maxTokens: Number.parseInt(e.target.value, 10) || 8192 } })} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : model ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
