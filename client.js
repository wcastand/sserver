/* global EventSource, location */

var es = new EventSource('/sse')
var style = document.createElement('style')
style.id = 'ssestyle'
document.head.appendChild(style)

es.onmessage = function (event) {
  switch (event.lastEventId) {
    case '1':
      location.reload()
      break
    case '2':
      style.innerHTML = event.data
      break
  }
}
