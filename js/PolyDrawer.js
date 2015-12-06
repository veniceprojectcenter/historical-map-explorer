define(['jquery', 'Leaflet', 'LeafletDraw'], function($, L) {
	"use strict";
	
	/* Holds code for drawing new polygon features on the map
	 */
	function PolyDrawer(mapManager, layerManager, dataService) {
		var points = [],
				markers = [],
				newPoly = null,
				state = "start",
				editor,
				polyLayer;
	
		/* Starts the polygon drawing mode
		 * Initializes the needed components on the map
		 */
		this.startPolyMode = function () { // XXX misleading function name
			if (state === "draw") return;
	
			// End edit mode
			if (state === "edit") {
				editor.disable();
				state = "editend";
				
				var selectedData = layerManager.selectedData();
	
				$('#new-feature-name').val(selectedData.properties.name);
				$('#new-feature-type').val(selectedData.properties.type);
				$('#new-feature-link').val(selectedData.properties.link);
	
				$('#new-feature').modal('show');
				$('.layers-select').val( layerManager.mostRecentlyEnabled() );
				$('.features-select').trigger('change');
				$('#drawmode').removeClass('active');
				return;
			}
	
			// XXX HACK ALERT
			// Check if a feature is selected. This will unselect it.
			var layerCount = Object.keys(mapManager.map._layers).length;
			mapManager.map.closePopup();
			var newLayerCount = Object.keys(mapManager.map._layers).length;
			var objectSelected = layerCount > newLayerCount;
	
			if(objectSelected) { // If an object is selected, edit it
				// selectedPoly in the poly click handler
				polyLayer = layerManager.selectedPoly();
				editor = new L.Edit.Poly(polyLayer);
				editor.enable();
				state = "edit";
			} else { // Draw a new polygon
				mapManager.map.once('draw:created', function (e) {
					polyLayer = e.layer;
					$('#new-feature').modal('show');
					$('.layers-select').val( layerManager.mostRecentlyEnabled() );
					$('.features-select').trigger('change');
					$('#drawmode').removeClass('active');
					state = "start";
				});
	
				// Start the Leaflet.Draw plugin
				var circleIcon = new L.Icon({
					iconUrl: "img/circle.png",
					iconSize: [8,8]
				});
				new L.Draw.Polygon(mapManager.map, {icon: circleIcon}).enable();
				state = "draw";
			}
	
			// Update button style
			$('#drawmode').addClass('active');
		};
	
		/* When the feautre is ready to be submitted,
		 * call this, and we pull information from the modal
		 * and use it to populate the database.
		 */
		this.submitFeature = function () {
			var name = $('#new-feature-name').val();
			var type = $('#new-feature-type').val();
			var link = $('#new-feature-link').val();
	
			// If the feature already exists, update it			
			var feature;
			var geometry;
			if (state === "editend") {
				feature = layerManager.selectedData();
				state = "start";
			} else {
				feature = dataService.findData(name);
			}
			
			// First, check whether the user is adding a whole new feature
			// or just new coordinates
			// NOTE: PolyLayer is an object-global variable
			if ($('#create-coordinates').hasClass('active')) {
				var featureId = $('#old-feature').val();
				feature = dataService.featureById(featureId);
				if (feature.properties.maps.indexOf(dataService.currentMap()) === -1) {
					feature.properties.maps.push(dataService.currentMap());
				} 
				// Add the new geometry
				dataService.fb.child('geometries')
					.child(dataService.currentMap())
					.child(featureId)
					.set(polyLayer.toGeoJSON().geometry);
				// Add the map to the array
				dataService.fb.child('features')
					.child(featureId)
					.child('properties/maps')
					.set(feature.properties.maps, function(error){
					  if (error) return alert("Error: " + error);
    		    dataService.updateItem(feature);
    		    try {
        		  layerManager.disableLayer($('#feature-filter').val());
        		} catch(err) {
        		  
        		};
        		layerManager.enableLayer($('#feature-filter').val());
					});
			} else if (feature) {
				// XXX fix name
				if (!name) return;
				feature.properties.name = name;
				geometry = polyLayer.toGeoJSON().geometry;
				feature.properties.type = type;
				feature.properties.link = link;
				dataService.fb.child('features')
				  .child(feature.id)
				  .set(feature);
				dataService.fb.child('geometries')
				  .child(dataService.currentMap())
				  .child(feature.id)
				  .set(geometry, function(error){
					  if (error) return alert("Error: " + error);
    		    dataService.updateItem(feature);
    		    try {
        		  layerManager.disableLayer(type);
        		} catch(err) {
        		  
        		};
        		layerManager.enableLayer(type);
					});
			} else {
				// XXX fix name
				if (!name) return;
				var newFeature = {
					type: "Feature",
					properties: {
						name: name,
						type: type,
						link: link,
						zoom: mapManager.map.getZoom(),
						maps: [dataService.currentMap()],
						center: {
							lat: polyLayer.getBounds().getCenter().lat,
							lng: polyLayer.getBounds().getCenter().lng
						}
					}
				};
				geometry = polyLayer.toGeoJSON().geometry;
				dataService.fb.child('features')
				  .push(newFeature)
				  .once('value', function(featureSnap) {
					dataService.fb.child('geometries')
					  .child(dataService.currentMap())
					  .child(featureSnap.key()).set(geometry, function(error){
  					  if (error) return alert("Error: " + error);
  					  newFeature.id = featureSnap.key();
  					  dataService.push(newFeature);
      		    dataService.updateItem(newFeature);
          		try {
          		  layerManager.disableLayer(type);
          		} catch(err) {
          		  
          		};
          		layerManager.enableLayer(type);
  					});
				});
			}
	
			$('#new-feature').modal('hide');
		};
	
		/* If the user chooses to discard the feature,
		 * we remove it from the database if it exists
		 */
		this.discardFeature = function () {
			if (state === "editend") { // If data exists (editing), delete it
				DATA.splice(DATA.indexOf(selectedData), 1);
				fb.child('vpc/features').set(DATA);
			}
	
			$('#new-feature').modal('hide');
		};
	}
	
	return PolyDrawer;
});