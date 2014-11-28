'use strict';
(function ($) {

  var MAP // global reference to the Leaflet map object

  function resizeMapWindow () {
    var aboutBoxHeight = $('#about').outerHeight()
    $('#map').css('top', Math.floor(aboutBoxHeight))
  }

  function inIframe () {
    try {
      return window.self !== window.top
    } catch (e) {
      return true
    }
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

    if (typeof instgrm === 'undefined') {
      renderInfowindowError('Unable to connect to Instagram.')
      return
    }

    $.ajax({
      url: 'http://api.instagram.com/oembed?url='+url+'&beta=true&omitscript=true',
      dataType: "jsonp",
      cache: false,
      success: function (response) {
        if (response.html) {
          $('#embedded-content').html(response.html)
          instgrm.Embeds.process()
        } else {
          $('#embedded-content').html('<div class="error">Could not embed the instagram</div>')
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
    var username   = data.username,
        identifier = data.identifier

    if (typeof twttr === 'undefined') {
      renderInfowindowError('Unable to connect to Twitter.')
      return
    }

    // Set the bare minimum HTML required for Twitter to render a widget
    $('#embedded-content').html("<blockquote class='twitter-tweet' lang='en'><a href='https://twitter.com/"+username+"/status/"+identifier+"'></a></blockquote>").show()

    // Tell twitter to do its job
    twttr.widgets.load(document.getElementById('embedded-content'))
    twttr.events.bind('rendered', function (event) {
      if (typeof callback === 'function') callback()
    })
  }

  function renderInfowindowError (message) {
    if (!message) message = 'There was an error loading this, please try again.'
    $('#embedded-content').html('<div class="error">'+message+'</div>')
    afterInfowindowRender()
  }

  function afterInfowindowRender () {
    $('#infowindow-loader').hide()
    // TODO: Pan window to fit the thing
    panViewportIfNeeded()
  }

  function panViewportIfNeeded () {
    var infowindowOffset = $('#embedded-content').offset(),
        infowindowWidth  = $('#embedded-content').width(),
        viewportOffset   = $('#map').offset(),
        viewportWidth    = $('#map').width()

    var mustPanTop  = (infowindowOffset.top <= viewportOffset.top) ? true : false
    var mustPanLeft = ((infowindowOffset.left + infowindowWidth) >= viewportOffset.width) ? true : false
    var topDiff     = viewportOffset.top - infowindowOffset.top
    var leftDiff    = (infowindowOffset.left + infowindowWidth) - viewportOffset.width

    if (mustPanTop && mustPanLeft) {
      MAP.panBy([leftDiff + 20, -(topDiff + 20)])
    } else if (mustPanTop) {
      MAP.panBy([0, -(topDiff + 20)])
    } else {
      MAP.panBy([leftDiff + 20, 0])
    }
  }

  $(document).ready(function () {

    if (inIframe()) {
      // Hide the about box if we're inside an iframe
      $('#about').hide()
    } else {
      resizeMapWindow()
      $(window).on('resize', resizeMapWindow)
    }

    // Map time
    cartodb.createVis('map', 'http://lou.cartodb.com/api/v2/viz/d00a8afc-752e-11e4-8ec0-0e018d66dc29/viz.json')
      .on('done', function (viz, layers) {
        var pointLayer = layers[1]

        MAP = viz.getNativeMap()

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

  })

}(jQuery))
