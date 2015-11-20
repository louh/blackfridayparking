'use strict';
/*global instgrm, twttr, cartodb, jQuery */
(function ($) {
  var MAP // global reference to the Leaflet map object

  var VIZ_2014 = 'https://lou.cartodb.com/api/v2/viz/d00a8afc-752e-11e4-8ec0-0e018d66dc29/viz.json'
  var VIZ_2015 = 'https://lou.cartodb.com/api/v2/viz/c9440e96-8fb3-11e5-861b-0ea31932ec1d/viz.json'

  function resizeMapWindow () {
    var aboutBoxHeight = document.getElementById('about').offsetHeight
    document.getElementById('map').style.top = Math.floor(aboutBoxHeight).toString() + 'px'
  }

  function checkForInfowindowData () {
    var data = $('#data-container').data()

    if (data.source === 'twitter') {
      renderTwitter(data, afterInfowindowRender)
    } else if (data.source === 'instagram') {
      renderInstagram(data, afterInfowindowRender)
    } else {
      setTimeout(checkForInfowindowData, 200)
    }
  }

  function renderInstagram (data, callback) {
    var url = data.url

    // Replace http:// links with https
    url = url.replace(/^http:/, 'https:')

    if (typeof instgrm === 'undefined') {
      renderInfowindowError('Unable to connect to Instagram.')
      return
    }

    $.ajax({
      url: 'https://api.instagram.com/oembed?url=' + url + '&beta=true&omitscript=true',
      dataType: 'jsonp',
      cache: false,
      success: function (response) {
        var embedEl = document.getElementById('embedded-content')

        if (response.html) {
          embedEl.innerHTML = response.html
          instgrm.Embeds.process()
        } else {
          embedEl.innerHTML = '<div class="error">Could not embed the instagram</div>'
        }

        if (typeof callback === 'function') callback()
      },
      error: function () {
        console.log('Could not process the instagram url')
        renderInfowindowError('Unable to connect to Instagram.')
      }
    })
  }

  function renderTwitter (data, callback) {
    var username = data.username
    var identifier = data.identifier

    var embedEl = document.getElementById('embedded-content')

    if (typeof twttr === 'undefined') {
      renderInfowindowError('Unable to connect to Twitter.')
      return
    }

    // Set the bare minimum HTML required for Twitter to render a widget
    embedEl.innerHTML = '<blockquote class="twitter-tweet" lang="en"><a href="https://twitter.com/' + username + '/status/' + identifier + '"></a></blockquote>'
    embedEl.style.display = 'block'

    // Tell twitter to do its job
    twttr.widgets.load(embedEl)
    twttr.events.bind('rendered', function (event) {
      if (typeof callback === 'function') callback()
    })
  }

  function renderInfowindowError (message) {
    var embedEl = document.getElementById('embedded-content')

    if (!message) message = 'There was an error loading this, please try again.'

    embedEl.innerHTML = '<div class="error">' + message + '</div>'
    afterInfowindowRender()
  }

  function afterInfowindowRender () {
    $('#infowindow-loader').hide()
    // TODO: Pan window to fit the thing
    panViewportIfNeeded()
  }

  function panViewportIfNeeded () {
    var infowindowOffset = $('#embedded-content').offset()
    var infowindowWidth = $('#embedded-content').width()
    var viewportOffset = $('#map').offset()

    var mustPanTop = (infowindowOffset.top <= viewportOffset.top)
    var mustPanLeft = ((infowindowOffset.left + infowindowWidth) >= viewportOffset.width)
    var topDiff = viewportOffset.top - infowindowOffset.top
    var leftDiff = (infowindowOffset.left + infowindowWidth) - viewportOffset.width

    if (mustPanTop && mustPanLeft) {
      MAP.panBy([leftDiff + 20, -(topDiff + 20)])
    } else if (mustPanTop) {
      MAP.panBy([0, -(topDiff + 20)])
    } else {
      MAP.panBy([leftDiff + 20, 0])
    }
  }

  if (window.self === window.top) {
    // Show the about box if we're not in an iframe
    document.getElementById('about').style.display = 'block'

    // Resize the map to fit
    resizeMapWindow()
    window.addEventListener('resize', resizeMapWindow)
  }

  // Map time
  cartodb.createVis('map', VIZ_2015)
    .on('done', function (viz, layers) {
      var pointLayer = layers[1]

      MAP = viz.getNativeMap()

      if (window.self !== window.top) {
        MAP.scrollWheelZoom.disable()
      }

      pointLayer
        .on('featureClick', function (e, latlng, pos, data) {
          checkForInfowindowData()
        })
        .on('error', function (err) {
          console.log('[CartoDB] error: ' + err)
        })

    }).on('error', function (err) {
      console.log('[CartoDB] some error occurred: ' + err)
    })

}(jQuery))
