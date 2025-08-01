export interface SearchData<ResultType> {
  total: number
  count: number
  page: number
  results: ResultType[]
  _links: Record<string, Record<string, string>>
}
