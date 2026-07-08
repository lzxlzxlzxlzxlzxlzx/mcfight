export interface ConfigFieldDef {
  key: string
  label: string
  unit?: string
  hint?: string
  step?: number
  min?: number
}

export interface ConfigGroupDef {
  title: string
  fields: ConfigFieldDef[]
}
