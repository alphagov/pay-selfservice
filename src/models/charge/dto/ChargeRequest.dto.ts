export default interface ChargeRequestData {
  amount: number
  description: string
  reference: string
  return_url: string
  credential_id?: string
  moto: boolean
}
