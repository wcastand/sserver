const fs = require('fs')
const { resolve } = require('path')
const micro = require('micro')
const SSE = require('sse')
const ch = require('create-html')
const browserify = require('browserify')
const postcss = require('postcss')

const b = browserify('examples/index.js', { transform: ['es2020'] })
const ci = () => {
  const clientcode = fs.readFileSync(resolve(__dirname, 'client.js'), 'utf-8')
  return ch({
    lang: 'fr',
    script: 'bundle.js',
    body: `<script>${clientcode}</script>`
  })
}

const srv = micro(async function (req, res) {
  switch (req.url) {
    case '/':
      res.writeHead(200)
      res.end(ci())
      break
    case '/bundle.js':
      return await b.bundle().pipe(res)
  }
})
srv.listen(3000, () => {
  const sse = new SSE(srv)
  sse.on('connection', function (client) {
    sendCss(client)
    fs.watch(
      resolve(__dirname, 'examples'),
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
  .process(
    fs.readFileSync('examples/main.css', 'utf-8'),
    { from: 'examples/main.css', to: 'app.css' }
  )
  .then(result =>
    client.send({ event: 'message', data: result.css, id: 2 })
  )
}
