import { Settings } from 'luxon'

// Sets the luxon DateTime to be in GB/London time
// All times should be displayed in UK time (GMT or BST)
const setGlobalLocale = () => {
  Settings.defaultLocale = 'en-GB'
  Settings.defaultZone = 'Europe/London'
}

export { setGlobalLocale }
