
type MessageState = 'success' | 'error' | 'info'

export default interface Message {
  state: MessageState
  icon?: string
  heading: string
  body?: string
}
