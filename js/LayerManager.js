define([], function() {
  "use strict";
  
	// Handle things related to the overlays
	function LayerManager(dataService) {
    var self = this;
		var polyState = {},
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
      
              if (loggedIn) {
                $('#new-layer-menu').before(newGroup);
              }
              else {
                $('.layers-menu').append(newGroup);
              }
            }
            $('#'+strippedParentName+'-menu').append(newOption);
          }
          else {
            if (loggedIn) {
              $('#new-layer-menu').before(newOption);
            }
            else {
              $('.layers-menu').append(newOption);
            }
          }
      
          $('#' + data.id + '-layer').click(self.toggleLayer.bind(this, data.id, data.color));
          $('.layers-select').append('<option value="'+data.id+'">'+data.name+'</option>');
        });
      });
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
			fb.child('vpc/layers').push({name: name, id: id, color: color, parent: parent});
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
			map.closePopup();
		};
	
		/* Turns a overlay layer on or off.
		 * When layers are enabled, only the enalbed layers' features
		 * appear in the search.
		 */
		this.toggleLayer = function (type, color) {
			var i,
					points,
					newPoly;
	
			if (!polyState[type]) {
        // If the layer is not visible, create it
				polyState[type] = [];
				dataService.getFeaturesForLayer(type, function(feature) {
					if (feature.properties.type == type && feature.geometry) {
						points = dataService.geoJSONToLeaflet(feature.geometry.coordinates[0]);
						newPoly = L.polygon(points, {color: color, weight: 2});
	
						// Clicking on a polygon will bring up a pop up
						newPoly.on('click', function() {
							var content = '<b class="popup">'+feature.properties.name+'</b>';
							if (feature.properties.link) {
								content = '<a href="' + feature.properties.link + '" target="blank_">' + content + '</a>';
							}
							if (loggedIn) {
								content += '<br /><a class="clone" href="#" onclick="layerManager.cloneModal()">Clone</a>';
							}
							L.popup().setLatLng(feature.properties.center).setContent(content).openOn(map);
							selectedPoly = newPoly;
							selectedData = feature;
						});
	
						// Double clicking a polygon will center the landmark
						// XXX Doesn't work?
						newPoly.on('dblclick', function() {
							map.setView(feature.properties.center).setZoom(8);
						});
            
            newPoly.featureId = feature.id;
						newPoly.addTo(map);
						polyState[type].push(newPoly);
            
            activeLandmarksObj[feature.id] = feature;
					}
				});
	
				$('#'+type+'-layer').css('font-weight', 600);
			} else {
        // If the layer is visible, remove it
				for (i = 0; i < polyState[type].length; ++i) {
					map.removeLayer(polyState[type][i]);
          delete activeLandmarksObj[ polyState[type][i].featureId ];
				}
	
				$('#'+type+'-layer').css('font-weight', 400);
	
				delete polyState[type];
			}
	
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