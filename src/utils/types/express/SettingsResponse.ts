export default interface SettingsResponse extends Express.Response {
    locals?: {
        flash?: {
            messages?: { type: string, message: string }[]
        }
    }
}
