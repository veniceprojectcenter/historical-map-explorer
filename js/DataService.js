define(['Firebase'], function(Firebase) {
	
	function DataService(fb, defaultMapId) {
		var data = [];
		var currentMapId = defaultMapId;
		
		this.push = data.push.bind(data);
		
		this.get = function(path, callback) {
			fb.child(path).on('child_added', callback, console.error.bind(console, 'Firebase error:'));
		};
		
		this.all = function() {
			return data;
		};
		
		this.setMap = function(map) {
			currentMapId = map;
		};
		
		this.getFeaturesForLayer = function(layer, callback) {
			var featuresCache = {};
			var geometriesCache = {};
			
			// Get features
			this.get('features', function(snapshot) {
				var featureKey = snapshot.name();
				if (geometriesCache[featureKey]) {
					// Handle case where this feature's geometry was already loaded
					var feature = snapshot.val();
					feature.geometry = geometriesCache[featureKey];
					feature.id = featureKey;
					callback(feature);
				} else {
					// Handle case where the geometry isn't loaded yet
					featuresCache[featureKey] = snapshot.val();
				}
			});
			
			// Get geometries
			this.get('geometries/'+currentMapId, function(snapshot) {
				var geometryKey = snapshot.name();
				if (featuresCache[geometryKey]) {
					// Handle case where this feature was already loaded
					var feature = featuresCache[geometryKey];
					feature.geometry = snapshot.val();
					feature.id = geometryKey;
					callback(feature);
				} else {
					// Handle case where the feature isn't loaded yet
					geometriesCache[geometryKey] = snapshot.val();
				}
			});
		};
		
		/* Searches the given data of landmarks for one with the given name.
		 * This will return the first valid result found, or null if nothing has
		 * been found.
		 */
		this.findData = function (val) {
			var i,
				len = data.length;

			for (i = 0; i < len; i++) {
				if (data[i].properties && data[i].properties.name === val) {
					return data[i];
				}
			}

			return null;
		};

		/* Searches the given data of landmarks for ones with the given type.
		 * This will return a data of results
		 */
		this.findDataByType = function (type) {
			var results = [],
				i;

			for (i = 0; i < data.length; i++) {
				if (data[i].properties && data[i].properties.type === type) {
					results.push(data[i]);
				}
			}

			return results;
		};

		/* Converts the coordinates from the database
		 * to a form that Leaflet understands 
		 */
		this.geoJSONToLeaflet = function (points) {
			return points.map(function (e) {
				return [e[1], e[0]];
			});
		};
	}
	
	return DataService;
});