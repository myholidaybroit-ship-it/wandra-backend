import { crudFactory } from '../crudFactory.js'
import Destination from '../../models/Destination.js'
import Hotel from '../../models/Hotel.js'
import Cab from '../../models/Cab.js'
import ServiceLocation from '../../models/ServiceLocation.js'
import Activity from '../../models/Activity.js'

/** Straight tenant-scoped CRUD for the five master-data resources.
 *  `uploadFields` pushes any data-URL image/gallery values to S3 server-side. */
export const destinations = crudFactory(Destination, { searchable: ['name', 'location', 'features'], filters: ['type'], uploadFields: ['image', 'gallery'], uploadFolder: 'destinations' })
export const hotels = crudFactory(Hotel, { searchable: ['name', 'city', 'roomTypes'], uploadFields: ['image'], uploadFolder: 'hotels' })
export const cabs = crudFactory(Cab, { searchable: ['name', 'type'], filters: ['status'], uploadFields: ['image'], uploadFolder: 'cabs' })
export const services = crudFactory(ServiceLocation, { searchable: ['name', 'serviceType', 'city'], uploadFields: ['image'], uploadFolder: 'services' })
export const activities = crudFactory(Activity, { searchable: ['name', 'category', 'city'], uploadFields: ['image'], uploadFolder: 'activities' })
