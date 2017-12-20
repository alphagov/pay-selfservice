'use strict'

const path = require('path')
const envfile = require('envfile')
const session = require('client-sessions')

const TEST_ENV = envfile.parseFileSync(path.join(__dirname, '../pay-scripts/services/selfservice.env'))

for (let property in TEST_ENV) {
  process.env[property] = TEST_ENV[property]
}

const CONFIG = require('./config/cookie').gatewayAccount
let COOKIE = 'seen_cookie_message=yes; _ga=GA1.2.1926786636.1510741903; gateway_account=Z3hLlsOcN5LlNWTZ67CFcQ.ewXShEhu8icjSj4LMl_07WZ5xXbAI2xnGbHZ5Go6vsC8RQ64hFNlp-eQSnfFfg1xnz8m92El0kSSCoD9sKHWEA.1512487579793.2592000000.6b8XWFv2RtjeKhkd0H-1F2Az0uOtk7_U2ipayD47TaE; session=mik3NGQsL9KchpL7UpLD5w._3DRDkvNG1KWmEUSm_GK94QvVlhCKZVgxkQfUI42c2hNnhc2kronFhhD79McPVqupePhVcw-Jt187FlzSa-KwAiPhW7hHFdouzhzbasU2Pm6aPpz2LFqDPOCE92uz1vkcbrFSg0tI6xD6tni3hnuH2-hpjF-m5E2v666vpGfElmXmeitPlKr-mMO1wuJ1m0ef977wUPJorIg26vGlKwvOFuxVbqUf4TU6EmFamGkXoY.1513768252978.10800000.LIK9qkq4RDmNJMxjeD08U4ijJud0A4zOs9p3OUX6yZA'


COOKIE = COOKIE
  .split(';')
  .map(cookie => cookie.split('=').map(item => item.trim()))
  .find(cookie => cookie[0] === CONFIG.cookieName)
console.log(COOKIE, CONFIG.cookieName)
console.log(session.util.decode(CONFIG, COOKIE))
