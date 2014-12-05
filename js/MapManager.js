define(['jquery'], function($) {
	
	function MapManager(dataService, layerManager) {
		var self = this;
		var currentMapGeometries = {};
		var map;
		
		this.switchMap = function(newMapId) {
			fb.child('geographies').child(currentMapId).on('child_added', function(snapshot) {
				var val = snapshot.val();
				var featureId = snapshot.key();
				
				currentMapGeometries
			});
		};
		
		/* Create a menu item for each map
		 */
		this.initMenu = function() {
			dataService.get('maps', function (snapshot) {
				var data = snapshot.val();
				
				$(document).ready(function() {
					var newOption = '<li role="presentation"><a role="menuitem" id="'+data.id+'-map" href="#">'+data.name+'</a></li>';
			
					if (data.parent) {
						var strippedParentName = data.parent.replace(/\s/g, '');
						if ($('#'+strippedParentName+'-menu').length === 0) {
							var newGroup = ' <li class="dropdown-submenu"><a href="#">'+data.parent+'</a><ul id="'+strippedParentName+'-menu" class="dropdown-menu"></ul></li>';
							$('#new-map-parent-other').before('<option value="'+data.parent+'">'+data.parent+'</option>');
			
							if (loggedIn) {
								$('#new-map-menu').before(newGroup);
							} else {
								$('.maps-menu').append(newGroup);
							}
						}
						$('#'+strippedParentName+'-menu').append(newOption);
					} else { // If the object has no parent
						if (loggedIn) {
							$('#new-map-menu').before(newOption);
						} else {
							$('.maps-menu').append(newOption);
						}
					}
			
					$('#' + data.id + '-map').click(self.switchMap.bind(this, data.id));
					$('.maps-select').append('<option value="'+data.id+'">'+data.name+'</option>');
				});
			});
		};
		
		this.initMap = function() {
			// Initialize leaflet map
			map = L.map('map', { center: [-73, 294/*22973.5*/], zoom: 3, attributionControl: false });
			new L.Control.Attribution({ prefix: false, position: 'bottomleft' }).addAttribution('<a href="http://veniceprojectcenter.org"><img src="img/vpc-small.png"></img></a>').addTo(map);
			L.tileLayer('http://debarbari.veniceprojectcenter.org/tiles2/{z}/{x}/{y}.png', {minZoom: 2, maxZoom: 8, tms: true, /*bounds: [[-84.3, 185.5], [-48.35, 420.7]],*/ errorTileUrl: 'http://placehold.it/256'}).addTo(map);

		//	var tms2 = L.tileLayer('http://debarbari.veniceprojectcenter.org/tiles2/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 1, tms: true, bounds: [[-46, 180], [-100, 432]]});
		//	var miniMap = new L.Control.MiniMap(tms2, { toggleDisplay: true }).addTo(map);

			// Add zoom out button
			var ViewAllControl = L.Control.extend({
				options: {
					position: 'topleft'
				},

				onAdd: function (map) {
					// Create the control container with a particular class name
					var container = L.DomUtil.create('div', 'leaflet-bar');

					var link = L.DomUtil.create('a', '', container);
					link.href = "#";

					// Add a click handler
					$(link).click(function() {
						map.setZoom(1);
					});

					var img = L.DomUtil.create('img', 'fullscreen-link', link);
					img.src = "img/fullscreen.png";
					img.style.width = '14px';
					img.style.height = '14px';

					return container;
				}
			});

			map.addControl(new ViewAllControl());
		
			//! For debugging
			window.map = map;

		};
	}
	
	return MapManager;
});