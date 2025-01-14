import { initAll } from 'govuk-frontend'
import { eventTracking, virtualPageview } from 'gaap-analytics'
import initAutocomplete from '@root/client-side/autocomplete'
import initMultiSelects from '@root/client-side/multi-select'
import initDateTimePicker from '@root/client-side/datetime-picker'
import initCookieBanner from '@root/client-side/cookie-banner'
import initReferenceSearchPanCheck from '@root/client-side/reference-search-pan-check'
import initCopyText from '@root/client-side/copy-text'
import initConfirmInput from '@root/client-side/input-confirm'
import initTargetToShow from '@root/client-side/target-to-show'
import initPrintButton from '@root/client-side/print-button'
import initNiceUrl from '@root/client-side/nice-url'
import addServiceSpinner from '@root/client-side/add-service-spinner'
import requestTestAccountSpinner from '@root/client-side/request-test-account-spinner'
import newContractTermsBanner from '@root/client-side/new-contract-terms-banner'
import awaitJQuery from '@utils/client-side/await-jquery'

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
initCopyText()
initConfirmInput()
initTargetToShow()
initPrintButton()
initNiceUrl()
newContractTermsBanner()
addServiceSpinner()
requestTestAccountSpinner()
