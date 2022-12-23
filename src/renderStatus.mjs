export default ({ groups }) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossorigin="anonymous">
    <title>Sonos status</title>
  </head>
  <body>
    <div class="container">
      <h3>Sonos status</h3>
      ${groups.map(renderGroup).join('')}
      ${renderButton('Preset - normal', '/preset/normal')}
      ${renderButton('Downstairs', '/notify/downstairs/bedroom')}
    </div>
    <script>
function doAction(btn,href) {
  const spinner = document.createElement('span')
  spinner.className = 'spinner-border spinner-border-sm'
  btn.insertBefore(spinner, btn.firstChild)
  btn.disabled = true
  fetch(href, { method: 'POST' })
    .then(res => {
      if (res.ok) {
        location.reload()
      } else {
        document.write('Error when trying to POST to ' + href)
      }
    })
}
    </script>
  </body>
</html>
`

const renderGroup = ({ state, members }) => {
  const playing = state === 'playing'
  return `
    ${members.map(member => renderMember({ playing, member })).join('')}
    <hr/>
  `
}

const renderMember = ({ playing, member }) => {
  const cls = playing ? 'success' : 'secondary'
  return `
  <div class="row">
  <span class="text-secondary">
    ${member.name}
    <span class="badge bg-${cls}">
      ${member.volume}
    </span>
  </span>
  </div>
  `
}

const renderButton = (label, action) => `
<div class="row my-2">
  <div class="col">
    <button class="btn btn-primary" type="Submit" onclick="doAction(this,'${action}')">
      ${label}
    </button>
  </div>
</div>
`
