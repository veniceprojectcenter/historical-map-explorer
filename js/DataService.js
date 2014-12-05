define(['Firebase'], function(Firebase) {
	
	function DataService(fb, defaultMapId) {
		var data = [];
		var dataById = {};
		var currentMapId = defaultMapId;
		
		this.push = function(item) {
			data.push(item);
			dataById[item.id] = item;
		};
		
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
			this.findDataByType(layer).forEach(function(feature) {
				fb.child('geometries')
					.child(currentMapId)
					.child(feature.id)
					.once('value', function (snapshot) {
						var geometryKey = snapshot.name();
						
						feature.geometry = snapshot.val();

						callback(feature);
				});
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
		 * This will return a list of results
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