export interface InputField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'url' | 'file' | 'color'
  required: boolean
}

export interface ResourceRequestData {
  resource_type: 'image' | 'logo' | 'text' | 'url' | 'file' | 'color' | 'font'
  purpose: string
  input_fields: InputField[]
}
