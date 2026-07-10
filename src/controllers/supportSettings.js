import PlatformSettings from '../models/PlatformSettings.js'

const DEFAULT_KEY = 'support'

export async function getOrCreateSupportSettings() {
  let settings = await PlatformSettings.findOne({ key: DEFAULT_KEY })
  if (!settings) settings = await PlatformSettings.create({ key: DEFAULT_KEY })
  return settings
}

export const editableFields = ['companyName', 'email', 'phone', 'whatsapp', 'hours', 'description']
