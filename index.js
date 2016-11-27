const fs = require('fs')
const { resolve } = require('path')
const http = require('http')
const SSE = require('sse')
const ch = require('create-html')
const browserify = require('browserify')
const postcss = require('postcss')

const b = browserify('src/index.js')
const ci = () => {
  const clientcode = fs.readFileSync(resolve(__dirname, 'client.js'), 'utf-8')
  return ch({
    lang: 'fr',
    script: 'bundle.js',
    body: `<script>${clientcode}</script>`
  })
}

const server = http.createServer((req, res) => {
  switch (req.url) {
    case '/':
      res.writeHead(200)
      res.end(ci())
      break
    case '/bundle.js':
      return b.bundle().pipe(res)
  }
})
server.listen(3000, () => {
  const sse = new SSE(server)
  sse.on('connection', function (client) {
    sendCss(client)
    fs.watch(
      resolve(__dirname, 'src'),
      { recursive: true },
      (event, path) =>
        path.includes('.js')
        ? client.send({ event: 'message', data: 'reload', id: 1 })
        : sendCss(client)
    )
  })
})

function sendCss (client) {
  postcss()
  .process(fs.readFileSync('src/main.css', 'utf-8'))
  .then(result =>
    client.send({ event: 'message', data: result.css, id: 2 })
  )
}
