'use strict';
/*global L, instgrm, twttr, cartodb, jQuery */
// NOTE
// cartodb.js is bundled with its own internal Leaflet (@v0.7.3)
// do not add another Leaflet or it will break!
// It is also bundled with its own jQuery! (@v1.7.2)
(function () {
  var VIZ_2014 = 'https://lou.cartodb.com/api/v2/viz/d00a8afc-752e-11e4-8ec0-0e018d66dc29/viz.json'
  var VIZ_2015 = 'https://lou.cartodb.com/api/v2/viz/c9440e96-8fb3-11e5-861b-0ea31932ec1d/viz.json'

  function resizeMapWindow () {
    var aboutBoxHeight = document.getElementById('about').offsetHeight
    document.getElementById('map').style.top = Math.floor(aboutBoxHeight).toString() + 'px'
  }

  function checkForInfowindowData () {
    var data = document.querySelector('#data-container').dataset

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
    document.querySelector('#infowindow-loader').style.display = 'none'
    panViewportIfNeeded()
  }

  function panViewportIfNeeded () {
    var buffer = 24
    var popupEl = document.querySelector('#embedded-content')
    var mapEl = document.querySelector('#map')

    var popupRect = popupEl.getBoundingClientRect()
    var mapRect = mapEl.getBoundingClientRect()

    var mustPanTop = (popupRect.top <= mapRect.top)
    var mustPanLeft = (popupRect.right >= mapRect.width)
    var topDiff = mapRect.top - popupRect.top
    var leftDiff = popupRect.right - mapRect.width

    if (mustPanTop && mustPanLeft) {
      map.panBy([leftDiff + buffer, -(topDiff + buffer)])
    } else if (mustPanTop) {
      map.panBy([0, -(topDiff + buffer)])
    } else {
      map.panBy([leftDiff + buffer, 0])
    }
  }

  function modifyAnchorTargets () {
    var anchors = document.querySelectorAll('a')
    for (var i = 0, j = anchors.length; i < j; i++) {
      anchors[i].target = '_top'
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
  // We are going to make our own Leaflet map so we can
  // set the tile layer and have control over stuff
  var map = L.map('map', {
    scrollWheelZoom: (window.self === window.top),
    center: [38.92522904714054, -97.646484375],
    zoom: 4
  })

  // Fit to USA
  // Bounds, center and zoom are borrowed from vizjson
  // Update this if our view changes on the CartoDB map
  var bounds = [
    [
      15.453680224345835,
      -155.56640625
    ],
    [
      56.607885465009254,
      -39.63867187499999
    ]
  ]
  map.fitBounds(bounds)

  var basemapUrl = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
  if (window.devicePixelRatio >= 2) {
    basemapUrl = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png'
  }

  var layer = L.tileLayer(basemapUrl, {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map)

  var geocoder = L.control.geocoder('search-c0qrIOY', {
    pointIcon: false,
    polygonIcon: false,
    bounds: bounds,
    latlng: true,
    expanded: true,
    position: 'topright'
  }).addTo(map)

  cartodb.createLayer(map, VIZ_2015)
    .addTo(map)
    .on('done', function (layer) {
      if (window.self !== window.top) {
        modifyAnchorTargets()
      }

      layer
        .on('featureClick', function (e, latlng, pos, data) {
          checkForInfowindowData()
        })
        .on('error', function (err) {
          console.log('[CartoDB] error: ' + err)
        })
    })
    .on('error', function (err) {
      console.log('[CartoDB] some error occurred: ' + err)
    })

}())
