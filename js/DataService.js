if (!Array.prototype.findIndex) {
	Array.prototype.findIndex = function(predicate) {
		if (this === null) {
			throw new TypeError('Array.prototype.find called on null or undefined');
		}
		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}
		var list = Object(this);
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		var value;

		for (var i = 0; i < length; i++) {
			value = list[i];
			if (predicate.call(thisArg, value, i, list)) {
				return i;
			}
		}
		return -1;
	};
}

define(['Firebase', 'lodash'], function(Firebase, _) {
	
	function DataService(fb, fbAuth, defaultMapId) {
		var data = [];
		var dataById = {};
		var currentMapId = defaultMapId;
		// Array of data needed to cancel geometry requests
		var geometryRequests = [];
		
		this.fb = fb;
		this.auth = fbAuth;
		
		// TODO: data and dataById are populated in initializeSearch in init.js,
		// which is completely the wrong place
		
		this.push = function(item) {
			// Make sure array has no holes
			item.properties.maps = Object.keys(item.properties.maps||[]).map(function(k) {
				return item.properties.maps[k];
			});
			data.push(item);
			dataById[item.id] = item;
		};
		
		this.updateItem = function(item){
		  // console.log("Data", data);
		  var i = data.findIndex(function(d) {
  			return d.id === item.id;
  		});
  		// console.log("Indice", i, data[i]);
  		data[i]['properties'].name = item.properties.name;
  		data[i]['properties'].type = item.properties.type;
  		data[i]['properties'].link = item.properties.link;
  		dataById[item.id] = data[i];
		};
		
		this.deleteItem = function(item){
		  // console.log("Data", data);
		  var i = data.findIndex(function(d) {
  			return d.id === item.id;
  		});
  		// console.log("Indice", i, data[i]);
  		// delete data[i];
  		// delete dataById[item.id];
  		data[i]['properties'].type = 'nonenone';
  		dataById[item.id] = data[i];
		};
		
		this.featureById = function(id) {
			return dataById[id];
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
		
		this.currentMap = function() {
			return currentMapId;
		};
		
		this.removeFeature = function (feature) {
			// Remove coordinates
			fb.child('coordinates').child(currentMapId).child(feature.id).remove();
			
			//! TEMP
			feature.properties.maps = feature.properties.maps || ['debarbari'];
			
			// Remove the current map from the feature
			var i = feature.properties.maps.indexOf(currentMapId);
			feature.properties.maps.splice(i, 1);
			
			if (feature.properties.maps.length === 0) {
				// Remove from data array
				i = data.findIndex(function(f) {
					return f.id === feature.id;
				});
				console.assert(i > -1, "The polygon to be deleted was found in the data array");
				data.splice(i, 1);
				
				// Remove from dataById obj
				delete dataById[feature.id];
				
				fb.child('features').child(feature.id).remove();
			} else {
				// Perpetuate the change to feature.properties.maps
				fb.child('features').child(feature.id).child('properties/maps').set(feature.properties.maps);
			}
		};
		
		// This function iterates over all the features (already loaded),
		// and for each of them it gets the geometry on the current map, 
		// merges it in, and calls the callback with the result
		this.getFeaturesForLayer = function(layer, callback, chosenMapId) {
			chosenMapId = chosenMapId || currentMapId;
			
			var data = this.findDataByType(layer);
			
			data.forEach(function(feature) {
				var ref = fb.child('geometries').child(chosenMapId).child(feature.id);
				var requestInfo = {
					'ref': ref,
					'layer': feature.properties.type
				};
				var getGeometry = function(geometrySnap) {
					// If there isn't a geometry, wait until there is one
					// (by returning instead of continuing and canceling the request)
					if (geometrySnap.val() === null) return;
					
					feature.geometry = geometrySnap.val();
					callback(feature);
					
					// Remove the requestInfo because it is no longer needed
					geometryRequests.splice(geometryRequests.indexOf(requestInfo), 1);
					// Has to be canceled manually because 'on' was used instead of 'once'
					ref.off('value');
				};
				
				// Use 'on' instead of 'once' because 'once' is uncancelable
				ref.on('value', getGeometry);
				geometryRequests.push(requestInfo);
			});
		};
		
		this.cancelGeometryRequests = function(whichLayer) {
			geometryRequests = geometryRequests.filter(function(obj) {
				if (!whichLayer || obj.layer === whichLayer) {
					obj.ref.off('value');
					return false; // Don't keep in the array
				} else {
					return true; // Do keep in the array
				}
			});
		};
		
		this.removeGeometries = function() {
			data.forEach(function(feature) {
				delete feature.geometry;
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
		
		return;
		var self = this;
		console.log("Looking for dupes");
		this.get('maps', function(mapSnap) {
			var mapId = mapSnap.key();
			console.log("Got map", mapId);
			
			var featuresByCoordinates = {};
			
			self.get('features', function(featureSnap) {
				
				var feature = featureSnap.val();
				feature.id = featureSnap.key();
				
				fb.child('geometries')
					.child(mapId)
					.child(feature.id)
					.once('value', function (snapshot) {
						feature.geometry = snapshot.val();
						
						if (!feature.geometry) {
							console.log("Found invisible feature:", feature.properties.name);
							//self.removeFeature(feature);
						} else {
							coords = JSON.stringify(feature.geometry.coordinates) + feature.properties.type;
							
							if (featuresByCoordinates[ coords ]) {
								console.log("Found dupe:", feature.properties.name);
								self.removeFeature(feature);
							} else {
								featuresByCoordinates[ coords ] = feature;
							}
						}
				});
				
			});
		});
	}
	
	return DataService;
});