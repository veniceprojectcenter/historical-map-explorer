define(function() {
	/* Holds code for drawing new polygon features on the map
	 */
	function PolyDrawer() {
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
	
	      $('#new-feature-name').val(selectedData.properties.name);
	      $('#new-feature-type').val(selectedData.properties.type);
	      $('#new-feature-link').val(selectedData.properties.link);
	
	      $('#new-feature').modal('show');
	      $('#drawmode').removeClass('active');
	      return;
	    }
	
	    // XXX HACK ALERT
	    // Check if a feature is selected. This will unselect it.
	    var layerCount = Object.keys(map._layers).length;
	    map.closePopup();
	    var newLayerCount = Object.keys(map._layers).length;
	    var objectSelected = layerCount > newLayerCount;
	
	    if(objectSelected) { // If an object is selected, edit it
	      // selectedPoly in the poly click handler
	      polyLayer = selectedPoly;
	      editor = new L.Edit.Poly(selectedPoly);
	      editor.enable();
	      state = "edit";
	    }
	
	    else { // Draw a new polygon
	      map.once('draw:created', function (e) {
	        polyLayer = e.layer;
	        $('#new-feature').modal('show');
	        $('#drawmode').removeClass('active');
	        state = "start";
	      });
	
	      // Start the Leaflet.Draw plugin
	      var circleIcon = new L.Icon({
	        iconUrl: "img/circle.png",
	        iconSize: [8,8]
	      });
	      new L.Draw.Polygon(map, {icon: circleIcon}).enable();
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
	
	    // XXX fix name
	    if (!name) return;
	
	    // If the feature already exists, update it
	    var feature;
	    if (state === "editend") {
	      feature = selectedData;
	      state = "start";
	    }
	    else {
	      feature = dataUtilities.findData(DATA, name);
	    }
	    if (feature) {
	      feature.properties.name = name;
	      feature.geometry = polyLayer.toGeoJSON().geometry;
	      feature.properties.type = type;
	      feature.properties.link = link;
	      fb.child('vpc/features').set(DATA);
	    }
	    else {
	      var newFeature = {
	        type: "Feature",
	        geometry: polyLayer.toGeoJSON().geometry,
	        properties: {
	          name: name,
	          type: type,
	          link: link,
	          zoom: map.getZoom(),
	          center: {
	            lat: polyLayer.getBounds().getCenter().lat,
	            lng: polyLayer.getBounds().getCenter().lng
	          }
	        }
	      };
	      fb.child('vpc/features').push(newFeature);
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