import { crudFactory } from '../crudFactory.js'
import PackageTemplate from '../../models/PackageTemplate.js'

/** Package templates — tenant-scoped CRUD (cloning is handled by packages/from-template). */
export const templates = crudFactory(PackageTemplate, {
  sort: '-usedCount',
  searchable: ['name', 'destination', 'tag'],
})
