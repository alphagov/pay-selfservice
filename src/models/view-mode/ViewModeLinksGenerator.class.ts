import { ViewMode } from '@models/view-mode/ViewMode.class'
import paths from '@root/paths'
import formatPathFor from '@utils/replace-params-in-path'

export class ViewModeLinksGenerator {
  readonly viewMode: ViewMode
  readonly allServiceTransactions: AllServiceTransactionsLinks

  constructor(viewMode: ViewMode) {
    this.viewMode = viewMode
    this.allServiceTransactions = new AllServiceTransactionsLinks(viewMode)
  }
}

class AllServiceTransactionsLinks {
  readonly viewMode: ViewMode

  constructor(viewMode: ViewMode) {
    this.viewMode = viewMode
  }

  get timeout() {
    return formatPathFor(paths.allServiceTransactions.simplifiedAccount.timeout, this.viewMode.modeName)
  }
}
