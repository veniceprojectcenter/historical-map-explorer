require.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery.min',
    'jquery-ui': 'lib/jquery-ui',
    bootstrap: 'lib/bootstrap',
    Firebase: 'lib/firebase',
    FirebaseSimpleLogin: 'lib/firebase-simple-login',
    Leaflet: 'lib/leaflet',
    LeafletDraw: 'lib/leaflet.draw',
    LeafletMiniMap: 'lib/Control.MiniMap',
    lodash: 'http://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash'
  },
  shim: {
    Firebase: {
      exports: 'Firebase'
    },
    FirebaseSimpleLogin: {
      deps: ['Firebase'],
      exports: 'FirebaseSimpleLogin'
    },
    Leaflet: {
      exports: 'L',
    },
    LeafletDraw: {
      deps: ['Leaflet'],
      exports: 'L'
    },
    LeafletMiniMap: {
      deps: ['Leaflet'],
      exports: 'L'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: '$'
    }
  }
});

require(['cartography-main']);