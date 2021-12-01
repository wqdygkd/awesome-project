
import readline from 'node:readline'
import fs from 'node:fs'
import got from 'got'
import dayjs from 'dayjs'

fs.copyFile('./README.md', './temp', async error => {
  if (error) return
  const input = fs.createReadStream('./temp')
  const output = fs.createWriteStream('./README.md')

  const rl = readline.createInterface({ input })

  for await (const line of rl) {
    console.log(line)
    const match = line.match(/^-\s*\[(.*)]\((.*)\)\s*(.*)\/(\S*)\s+-\s*(.*)/)
    if (!match) {
      output.write(line + '\n')
    } else {
      const [, name, url, number1, number2, info] = match
      const [github, npm] = await Promise.all([getGithub(url), getNpm(name)])
      output.write(`- [${name}](${url}) - ${github}/${npm} - ${info}\n`)
    }
  }
})

async function getGithub (url) {
  try {
    const urlObject = new URL(url)
    const { body } = await got(`https://api.github.com/repos${urlObject.pathname}`, { responseType: 'json' })
    return formatNumber(body.stargazers_count)
  } catch {
    return '-'
  }
}

async function getNpm (value) {
  const start = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
  const end = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  try {
    const { body } = await got(`https://api.npmjs.org/downloads/point/${start}:${end}/${value}`, { responseType: 'json' })
    return formatNumber(body.downloads)
  } catch {
    return '-'
  }
}

function formatNumber (number) {
  let unit
  const units = ['b', 'k', 'm', 'g']
  while ((unit = units.shift()) && number > 1000) {
    number = number / 1000
  }
  return unit === 'b' ? number : (Number(number.toFixed(1)) + unit)
}
