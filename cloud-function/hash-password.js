'use strict'

const crypto = require('node:crypto')

let password = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => { password += chunk })
process.stdin.on('end', () => {
  password = password.replace(/[\r\n]+$/, '')
  if (password.length < 10) {
    console.error('Пароль должен содержать не менее 10 символов')
    process.exitCode = 1
    return
  }
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  process.stdout.write(`scrypt$${salt}$${hash}\n`)
})

if (process.stdin.isTTY) {
  console.error('Передайте пароль через stdin. Пример команды приведён в README.MD.')
  process.exit(1)
}
