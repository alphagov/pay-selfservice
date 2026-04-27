import { Settings } from 'luxon'

interface GlobalTimeOptions {
  defaultLocale?: string
  defaultZone?: string
}

// Sets the luxon DateTime to be in GB/London time
// All times should be displayed in UK time (GMT or BST)
function setGlobalTimeDefaults(options: GlobalTimeOptions = {}) {
  Settings.defaultLocale = options.defaultLocale ?? 'en-GB'
  Settings.defaultZone = options.defaultZone ?? 'Europe/London'
}

export { setGlobalTimeDefaults }
