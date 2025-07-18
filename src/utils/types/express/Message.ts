type MessageState = 'success' | 'error' | 'info'
type Icon = '&check;' | undefined

export const MessageState = {
  SUCCESS: 'success' as MessageState,
  ERROR: 'error' as MessageState,
  INFO: 'info' as MessageState
}

export const MessageIcon = {
  CHECK: '&check;' as Icon,
  NONE: undefined as Icon
}

export class Message {
  state: MessageState
  icon?: Icon
  heading: string
  body?: string

  constructor(state: MessageState, icon: Icon, heading: string, body?: string) {
    this.state = state
    this.icon = icon
    this.heading = heading
    this.body = body
  }

  static Success (heading: string, body?: string) {
    return new Message(
      MessageState.SUCCESS,
      MessageIcon.CHECK,
      heading,
      body
    )
  }

  static GenericError (body: string) {
    return new Message(
      MessageState.ERROR,
      MessageIcon.NONE,
      'There is a problem',
      body
    )
  }
}
