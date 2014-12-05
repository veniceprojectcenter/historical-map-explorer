require.config({
		baseUrl: 'js',
		paths: {
				jquery: 'lib/jquery.min',
				'jquery-ui': 'lib/jquery-ui',
				bootstrap: 'lib/bootstrap.min',
				Firebase: 'lib/firebase',
				FirebaseSimpleLogin: 'lib/firebase-simple-login',
				Leaflet: 'lib/leaflet',
				LeafletDraw: 'lib/leaflet.draw',
				LeafletMiniMap: 'lib/Control.MiniMap',
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
			}
		}
});

require(['init']);