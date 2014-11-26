'use strict';
(function ($) {

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

        pointLayer
          .on('featureClick', function (e, latlng, pos, data) {
            setTimeout(function () {
              var template = $('#infowindow_template').html()
              pointLayer.infowindow.set('template', template)

              var source = $('#data-container').data('source')
              var identifier = $('#data-container').data('identifier')
              var username = $('#data-container').data('username')

              if (source === 'twitter') {
                $('#embedded-content').html("<blockquote class='twitter-tweet' lang='en'><a href='https://twitter.com/"+username+"/status/"+identifier+"'></a></blockquote>").show()
                twttr.widgets.load()
                twttr.events.bind(
                  'rendered',
                  function (event) {
                    console.log("Created widget", event.target.id)
                    $('#infowindow-loader').hide()
                    // Pan window to fit the thing
                  }
                )
              }
            }, 100)
          })
          .on('error', function (err) {
            console.log('[CartoDB] error: ' + err)
          })

      }).on('error', function (err) {
        console.log('[CartoDB] some error occurred: ' + err)
      })

  })

}(jQuery))
