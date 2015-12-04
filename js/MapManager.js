define(['jquery', 'Leaflet', 'LeafletMiniMap'], function($, L) {
	
	function MapManager(dataService) {
		var self = this;
		var currentMapGeometries = {};
		var maps = {};
		var switchFunc = function() {};
		
		var mainLayer, miniMap;
		
		function shiftBounds (bounds) {
			return [[bounds[0][0], bounds[0][1] + 360], [bounds[1][0], bounds[1][1] + 360]];
		}
		
		this.mapLabel = function (mapId) {
			return '<b>'+maps[mapId].year+'</b>: '+maps[mapId].name;
		};
		
		this.getMap = function (mapId) {
			return maps[mapId];
		};
		
		this.switchMap = function(newMapId, selectedFeatureId) {
		  console.log("switch to " + newMapId);
			dataService.removeGeometries();
			
			dataService.fb.child('maps').child(newMapId).once('value', function(mapSnap) {
				var mapData = mapSnap.val();
				if (!mapData) {
				  alert("Cannot find map <" + newMapId + ">, chooose anothe one.");
				  return ;
				}
				var tileUrl = mapData.tiles;
				
				if (mainLayer) self.map.removeLayer(mainLayer);
				mainLayer = L.tileLayer(tileUrl+'/{z}/{x}/{y}.png', {
					minZoom: 2, 
					maxZoom: newMapId === 'debarbari' ? 8 : 7, //! HACK -- deBarbari has more zoom levels than the rest 
					tms: true, 
					bounds: mapData.bounds, 
					contonuousWorld: true
				}).addTo(self.map);
				
				if (miniMap) self.map.removeControl(miniMap);
				var tms2 = L.tileLayer(tileUrl+'/{z}/{x}/{y}.png', {
					minZoom: 1, 
					maxZoom: 1, 
					tms: true
				});
				miniMap = new L.Control.MiniMap(tms2, { toggleDisplay: true }).addTo(self.map);
				
				if (mapData.bounds) self.map.fitBounds(shiftBounds(mapData.bounds));
				
				dataService.setMap(newMapId);
				switchFunc(mapSnap.val(), selectedFeatureId);
				
				$('.map-menu-link').css('font-weight', 400);
				$('#'+newMapId+'-map').css('font-weight', 600);
			});
		};
		
		this.onSwitch = function (func) {
			switchFunc = func;
		};
		
		/* Create a menu item for each map
		 */
		this.initMenu = function() {
			dataService.fb.child('maps').orderByChild('year').on('child_added', function (snapshot) {
				var data = snapshot.val();
				maps[snapshot.key()] = data;
					
				$(document).ready(function() {
					var newOption = '<li role="presentation"><a role="menuitem"'+(data.id === dataService.currentMap()  ? ' style="font-weight: 600;"' : '')+' class="map-menu-link" id="'+data.id+'-map" href="#">'+self.mapLabel(data.id)+'</a></li>';
			
					if (data.parent) {
						var strippedParentName = data.parent.replace(/\s/g, '');
						if ($('#'+strippedParentName+'-menu').length === 0) {
							var newGroup = ' <li class="dropdown-submenu"><a href="#">'+data.parent+'</a><ul id="'+strippedParentName+'-menu" class="dropdown-menu"></ul></li>';
							$('#new-map-parent-other').before('<option value="'+data.parent+'">'+data.parent+'</option>');
			
							if ($('#new-map-menu').length > 0) {
								$('#new-map-menu').before(newGroup);
							} else {
								$('.maps-menu').append(newGroup);
							}
						}
						$('#'+strippedParentName+'-menu').append(newOption);
					} else { // If the object has no parent
						if ($('#new-map-menu').length > 0) {
							$('#new-map-menu').before(newOption);
						} else {
							$('.maps-menu').append(newOption);
						}
					}
					
					$('.maps-menu').removeClass('loading');
			
					$('#' + data.id + '-map').click(self.switchMap.bind(this, data.id));
					$('.maps-select').append('<option value="'+data.id+'">'+data.name+'</option>');
				});
			});
		};
		
		this.initMap = function() {
			// Initialize leaflet map
			self.map = L.map('map', { center: [-73, 294], zoom: 3, attributionControl: false });
			window.lmap = self.map;
			
			self.switchMap( dataService.currentMap() );

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

			this.map.addControl(new ViewAllControl());

		};
		
		/* Add a new layer to the map.
		 * Updates the database and the layer menu
		 */
		this.addNewMap = function () {
			// Read values from the form
			var name = $('#new-map-name').val();
			var id = $('#new-map-id').val();
			var year = $('#new-map-year').val();
			var tiles = $('#new-map-tiles').val();

			// Fail silently if fields empty for now
			if (!(name || id || year || tiles)) {
				return;
			} else if (maps[id]) {
				// Fail silently if duplicate
				return;
			}

			dataService.fb.child('maps').child(id).set({
				name: name, 
				id: id, 
				year: year, 
				tiles: tiles, 
				createdBy: dataService.auth.getUser().uid
			});
			$('#new-map').modal('hide');
		};
	}
	
	return MapManager;
});