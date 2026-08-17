import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import type { Bindings } from './bindings'

export type Sql = NeonQueryFunction<false, false>

export function createSql(env: Bindings): Sql {
  if (!env.DATABASE_URL) throw new Error('Missing DATABASE_URL')
  return neon(env.DATABASE_URL)
}
