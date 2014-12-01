define(function() {
	// Handle things related to the overlays
	function LayerManager() {
	  var polyState = {},
	      selectedPoly = null,
	      selectedData = null;
	
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
	        newPoly,
	        activeLandmarks;
	
	    if (!polyState[type]) {
	      polyState[type] = [];
	      for (i = 0; i < DATA.length; ++i) {
	        if (DATA[i].properties.type == type && DATA[i].geometry) {
	          points = dataUtilities.geoJSONToLeaflet(DATA[i].geometry.coordinates[0]);
	          newPoly = L.polygon(points, {color: color, weight: 2});
	
	          // Clicking on a polygon will bring up a pop up
	          newPoly.on('click', (function (data, poly){
	            var content = '<b class="popup">'+data.properties.name+'</b>';
	            if (data.properties.link) {
	              content = '<a href="' + data.properties.link + '" target="blank_">' + content + '</a>';
	            }
	            if (loggedIn) {
	              content += '<br /><a class="clone" href="#" onclick="layerManager.cloneModal()">Clone</a>';
	            }
	            L.popup().setLatLng(data.properties.center).setContent(content).openOn(map);
	            selectedPoly = poly;
	            selectedData = data;
	          }).bind(this, DATA[i], newPoly));
	
	          // Double clicking a polygon will center the landmark
	          // XXX Doesn't work?
	          newPoly.on('dblclick', (function (loc) {
	            map.setView(loc).setZoom(8);
	          }).bind(this, DATA[i].properties.center));
	
	          newPoly.addTo(map);
	          polyState[type].push(newPoly);
	        }
	      }
	
	      $('#'+type+'-layer').css('font-weight', 600);
	    }
	    else {
	      for (i = 0; i < polyState[type].length; ++i) {
	        map.removeLayer(polyState[type][i]);
	      }
	
	      $('#'+type+'-layer').css('font-weight', 400);
	
	      delete polyState[type];
	    }
	
	    // Update autocomplete based on selected layers
	    if (Object.keys(polyState).length === 0) {
	      activeLandmarks = DATA;
	    }
	    else {
	      activeLandmarks = [];
	      for (var activeType in polyState) {
	        activeLandmarks = activeLandmarks.concat(dataUtilities.findDataByType(DATA, activeType));
	      }
	    }
	
	    $('.search').autocomplete({ source: dataUtilities.getAutoCompleteNames([activeLandmarks]) });
	  };
	}
	
	return LayerManager;
});