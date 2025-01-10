import { initAll } from 'govuk-frontend'
import { eventTracking, virtualPageview } from 'gaap-analytics'
import initAutocomplete from '@root/client-side/autocomplete'
import initMultiSelects from '@root/client-side/multi-select'
import initDateTimePicker from '@root/client-side/datetime-picker'
import initCookieBanner from '@root/client-side/cookie-banner'
import initReferenceSearchPanCheck from '@root/client-side/reference-search-pan-check'
import addServiceSpinner from '@root/client-side/add-service-spinner'
import requestTestAccountSpinner from '@root/client-side/request-test-account-spinner'
import newContractTermsBanner from '@root/client-side/new-contract-terms-banner'
import awaitJQuery from '@utils/await-jquery'

// --- govuk-frontend init ---
initAll()
// ---------------------------
eventTracking.init()
virtualPageview.init()
initCookieBanner()
initAutocomplete()
initMultiSelects()
awaitJQuery(() => {
  initDateTimePicker()
})
initReferenceSearchPanCheck()
newContractTermsBanner()
addServiceSpinner()
requestTestAccountSpinner()
