define(['lodash'], function(_) {
	"use strict";
	
	// Handle things related to the overlays
	function LayerManager(dataService, mapManager) {
		var self = this;
		var polyState = {},
			enabledLayers = [],
			layerColors = {},
			selectedPoly = null,
			selectedData = null,
			activeLandmarksObj = {}; // keyed by feature id
					
		/* Create a menu item for each layer
		*/
		this.initMenu = function () {
			dataService.get('layers', function (snapshot) {
				var data = snapshot.val();
				$(document).ready(function() {
					var newOption = '<li role="presentation"><a role="menuitem" id="'+data.id+'-layer" href="#">'+data.name+'</a></li>';
			
					if (data.parent) {
						var strippedParentName = data.parent.replace(/\s/g, '');
						if ($('#'+strippedParentName+'-menu').length === 0) {
							var newGroup = ' <li class="dropdown-submenu"><a href="#">'+data.parent+'</a><ul id="'+strippedParentName+'-menu" class="dropdown-menu"></ul></li>';
							$('#new-layer-parent-other').before('<option value="'+data.parent+'">'+data.parent+'</option>');
			
							if ($('#new-layer-menu').length > 0) {
								$('#new-layer-menu').before(newGroup);
							} else {
								$('.layers-menu').append(newGroup);
							}
						}
						$('#'+strippedParentName+'-menu').append(newOption);
					} else {
						if ($('#new-layer-menu').length > 0) {
							$('#new-layer-menu').before(newOption);
						} else {
							$('.layers-menu').append(newOption);
						}
					}
					
					$('.layers-menu').removeClass('loading');
			
					$('#' + data.id + '-layer').click(self.toggleLayer.bind(this, data.id, data.color));
					$('.layers-select').append('<option value="'+data.id+'">'+data.name+'</option>');
				});
			});
		};
		
		this.mostRecentlyEnabled = function() {
			return enabledLayers.length ? enabledLayers[enabledLayers.length-1] : null;
		};
		
		this.selectedData = function() {
			return selectedData;
		};
		
		this.selectedPoly = function() {
			return selectedPoly;
		};
		
		/* Add a new layer to the map.
		 * Updates the database and the layer menu
		 */
		this.addNewLayer = function () {
			// Read values from the form
			var name = $('#new-layer-name').val();
			var id = $('#new-layer-id').val();
			var color = $('#new-layer-color').val();
			var parent = $('#new-layer-parent').val();

			if (parent === "Other") {
				parent = $('#new-layer-new-parent').val();
			}

			// Fail silently if fields empty for now
			if (!(name || id || color)) {
				return;
			}

			// TODO generalize for any account
			dataService.fb.child('layers').push({
				name: name, 
				id: id, 
				color: color,
				parent: parent,
				createdBy: dataService.auth.getUser().uid
			});
			$('#new-layer').modal('hide');
		};

		/* Shows the polygon cloning modal
		 */
		this.cloneModal = function () {
			$('#clone-layer').modal('show');
		};

		/* Clones the feature to a new layer
		 */
		this.clonePoly = function () {
			var newData = $.extend(true, {}, selectedData); // clone the data
			newData.properties.type = $('#clone-layer-type').val();
			fb.child('vpc/features').push(newData);

			$('#clone-layer').modal('hide');
			mapManager.map.closePopup();
		};
		
		/* Turns a overlay layer on or off.
		 * When layers are enabled, only the enalbed layers' features
		 * appear in the search.
		 */
		this.toggleLayer = function (type, color) {
			if (!polyState[type]) {
				self.enableLayer(type, color);
			} else {
				self.disableLayer(type);
			}

			self.updateAutocomplete();
		};
		
		this.enableLayer = function(type, color, selectedFeatureId) {
			if (color) {
				layerColors[type] = color;
			} else {
				color = layerColors[type];
			}
			
			// This is used way down in the "visible on x other maps" loop
			var currentMap = dataService.currentMap();
			
			// If the layer is not visible, create it
			polyState[type] = [];
			enabledLayers.push(type);
			dataService.getFeaturesForLayer(type, function(feature) {
				// Detect whether this layer was disabled since this function
				// was called. This should rarely happen because callbacks are canceled.
				if (!polyState[type]) return;
				
				if (feature.properties.type == type && feature.geometry) {
					var points = dataService.geoJSONToLeaflet(feature.geometry.coordinates[0]);
					var newPoly = L.polygon(points, {color: color, weight: 2});

					// Clicking on a polygon will bring up a pop up
					newPoly.on('click', function() {
						var content = '<b class="popup">'+feature.properties.name+'</b>';
						if (feature.properties.link) {
							content = '<a href="' + feature.properties.link + '" target="blank_">' + content + '</a>';
						}
						var numMaps = feature.properties.maps.length - 1; // Subtract one for the current map
						if (numMaps > 0) {
							content += '<details><summary>This feature appears on '+numMaps+' other '+(numMaps === 1 ? 'map' : 'maps')+'</summary>';
							Object.keys(feature.properties.maps).map(function(k) {
								return feature.properties.maps[k];
							}).sort(function(a, b) {
								// Sort by year
								return mapManager.getMap(a).year - mapManager.getMap(b).year;
							}).forEach(function(mapId) {
								if (mapId === currentMap) return;
								content += '<a class="show_other_map" data-map-id="'+mapId+'">'+mapManager.mapLabel(mapId)+'</a>';
							});
							content += '</details>';
						} else {
							content += '<br />';
						}
						if (dataService.auth.getUser()) {
							content += '<a class="clone" href="#">Clone</a> <a class="delete" href="#">Delete</a>';
						}
						L.popup({}, newPoly).setLatLng(newPoly.getBounds().getCenter()).setContent(content).openOn(mapManager.map);
						selectedPoly = newPoly;
						selectedData = feature;
					});

					if (selectedFeatureId === feature.id) {
						newPoly.fire('click');
					}

					// Double clicking a polygon will center the landmark
					// XXX Doesn't work?
					newPoly.on('dblclick', function() {
						mapManager.map.setView(feature.properties.center).setZoom(8);
					});
				
					newPoly.featureId = feature.id;
					newPoly.addTo(mapManager.map);
					polyState[type].push(newPoly);
				
					activeLandmarksObj[feature.id] = feature;
				}
			});

			$('#'+type+'-layer').css('font-weight', 600);
		};
		
		this.disableLayer = function(type) {
			// Cancel pending requests for this layer's geometry
			dataService.cancelGeometryRequests(type);
			
			// If the layer is visible, remove it
			for (var i = 0; i < polyState[type].length; ++i) {
				mapManager.map.removeLayer(polyState[type][i]);
				delete activeLandmarksObj[ polyState[type][i].featureId ];
			}
			
			enabledLayers.splice(enabledLayers.indexOf(type), 1);
			
			$('#'+type+'-layer').css('font-weight', 400);

			delete polyState[type];
		};
		
		this.reload = function(map, selectedFeatureId) {
			dataService.cancelGeometryRequests();
			Object.keys(polyState).forEach(function(layerName) {
				self.disableLayer(layerName);
				self.enableLayer(layerName, undefined, selectedFeatureId);
			});
		};
		
		this.updateAutocomplete = function() {
			// Update autocomplete based on selected layers
			var activeLandmarks; 
			if (Object.keys(polyState).length === 0) {
				activeLandmarks = dataService.all();
			} else {
				activeLandmarks = Object.keys(activeLandmarksObj).map(function(k){ return activeLandmarksObj[k]; });
			}
	
			$('.search').autocomplete({ 
				source: activeLandmarks.map(function(feature) {
					return feature.properties.name;
				})
			});
		};
	}
	
	return LayerManager;
});