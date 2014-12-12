// From: https://github.com/litejs/natural-compare-lite
String.naturalCompare = function(a, b) {
	var i, codeA, codeB = 1, posA = 0, posB = 0, alphabet = String.alphabet;

	function getCode(str, pos, code) {
		if (code) {
			for (i = pos; code = getCode(str, i), code < 76 && code > 65;) ++i;
			return +str.slice(pos - 1, i);
		}
		code = alphabet && alphabet.indexOf(str.charAt(pos));
		return code > -1 ? code + 76 : ((code = str.charCodeAt(pos) || 0), code < 45 || code > 127) ? code
			: code < 46 ? 65               // -
			: code < 48 ? code - 1
			: code < 58 ? code + 18        // 0-9
			: code < 65 ? code - 11
			: code < 91 ? code + 11        // A-Z
			: code < 97 ? code - 37
			: code < 123 ? code + 5        // a-z
			: code - 63;
	}


	if ((a+="") != (b+="")) for (;codeB;) {
		codeA = getCode(a, posA++);
		codeB = getCode(b, posB++);

		if (codeA < 76 && codeB < 76 && codeA > 66 && codeB > 66) {
			codeA = getCode(a, posA, posA);
			codeB = getCode(b, posB, posA = i);
			posB = i;
		}

		if (codeA != codeB) return (codeA < codeB) ? -1 : 1;
	}
	return 0;
};

define(['jquery', 'Firebase', 'FirebaseAuth', 'RectDrawer', 'PolyDrawer', 'DataService', 'LayerManager', 'MapManager', 'Downloader', 'jquery-ui', 'bootstrap'], 
		function($, Firebase, FirebaseAuth, RectDrawer, PolyDrawer, DataService, LayerManager, MapManager, Downloader) {
	"use strict";
	
	/// CONSTANTS
	var DEFAULT_MAP = 'debarbari';
	var FIREBASE_URL = 'https://vpc.firebaseio.com/cartography';
	
	/// EXTERNAL LIBRARIES
	var fb = new Firebase(FIREBASE_URL);
	var fbAuth = new FirebaseAuth(fb);
	
	/// CORE FUNCTIONALITY
	var dataService = new DataService(fb, fbAuth, DEFAULT_MAP);
	var mapManager = new MapManager(dataService);
	var layerManager = new LayerManager(dataService, mapManager);
	mapManager.onSwitch(layerManager.reload.bind(layerManager));

	/// EXTRA FUNCTIONALITY
	var downloader = new Downloader();
	var rectDrawer = new RectDrawer();
	var polyDrawer = new PolyDrawer(mapManager, layerManager, dataService);
	
	
	/* 
	 * Load up the autocomplete bar with all the names
	 */
	function initializeSearch() {
		var autocompleteNames = [];
		
		fb.child('features').on('child_added', function (snapshot) {
			var feature = snapshot.val();
			feature.id = snapshot.key();
			dataService.push(feature);
			autocompleteNames.push(feature.properties.name);
		});
		
		$(document).ready(function(){
			// The autocomplete plugin accesses its source by reference, so when a new
			// value is added to autocompleteNames the plugin will pick it up
			$(".search").autocomplete({ source: autocompleteNames });
			$(".search").on("autocompleteselect", function (event, ui) {
				var landmark = dataService.findData(ui.item.value);
				map.setView(landmark.properties.center, 8 /* LOL IGNORE ZOOM (TODO: why?) */, { animate: true });
			});
		});
	}
	
	/* 
	 * Show the login form
	 */
	function showLoginForm(type) {
		var callback;
		if (type === "login") {
			callback = fbAuth.login;
		}
		else {
			alert("Not working yet. Check back soon!");
			return;
	
			//Uncomment this when it's needed:
			//callback = fbAuth.signup;
		}
	
		$('#password').on('keyup', function(e) {
			if (e.keyCode === 13) {
				console.log("Login attempt started");
				callback($('#email').val(), $('#password').val());
				//$('#password').off('keyup');
			}
		});
	
		$('#login-form').css('display', 'block');
		$('#login-text').hide();
	}
		
	// Kick off the loading
	mapManager.initMenu();
	layerManager.initMenu();
	initializeSearch();

	// jQuery init
	$(document).ready(function() {
		
		mapManager.initMap();
		
		// Register handlers
		$("#dlbutton").click(function () {
			var link = document.createElement("a");
			link.href = downloader.getData();
			link.download = "explorer.png";
			var theEvent = document.createEvent("MouseEvent");

			// Here we create and dispatch a "realistic" event
			// to fool browsers' built-in popup blockers
			theEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			link.dispatchEvent(theEvent);
		});

		$("#select").click(rectDrawer.initialize.bind(rectDrawer, downloader.downloadSection));

		$('#drawmode').click(polyDrawer.startPolyMode);

		$('#login-link').click(function () {
			showLoginForm('login');
		});
		$('#signup-link').click(function () {
			showLoginForm('signup');
		});
		$('#logout-link').click(fbAuth.logout);

		$('#new-layer-button').click(layerManager.addNewLayer);
		$('#new-map-button').click(mapManager.addNewMap);
		$('#new-feature-submit').click(polyDrawer.submitFeature);
		$('#new-feature-discard').click(polyDrawer.discardFeature);
		
		$('#feature-filter').on('change', function() {
			var features = dataService.findDataByType($(this).val()).sort(String.naturalCompare);
			
			var options = features.map(function(feature) {
				return '<option value="'+feature.id+'">'+feature.properties.name+'</option>';
			});
			
			$('.features-select').html(options.join(''));
		});

		$('#clone-button').click(layerManager.clonePoly);
		
		$('#map').on('click', '.clone', function() {
			layerManager.cloneModal();
		}).on('click', '.delete', function() {
			layerManager.deletePoly();
		}).on('click', '.show_other_map', function() {
			var selectedData = layerManager.selectedData();
			mapManager.map.closePopup();
			mapManager.switchMap($(this).attr('data-map-id'), selectedData.id);
		});

		$('#plus-sign').click(function () {
			$('#info-modal').modal('show');
		});

		// Tooltips
		$('#dlbutton').tooltip({ placement: 'bottom' });
		$('#select').tooltip({ placement: 'bottom' });
		$('#drawmode').tooltip({ placement: 'bottom' });
		$('#plus-sign').tooltip({ placement: 'bottom' });
		$('#layers').tooltip({ placement: 'bottom' });
		$('#maps').tooltip({ placement: 'bottom' });
		$('#layer-dropdown').on('show.bs.dropdown', function () {
			try {
				$('#layers').tooltip("hide");
			} catch (e) {
				$('#layers').tooltip("option", "disabled", true);
			}
		});
		$('#map-dropdown').on('show.bs.dropdown', function () {
			try {
				$('#maps').tooltip("hide");
			} catch (e) {
				$('#maps').tooltip("option", "disabled", true);
			}
		});
	});
	
	return true;
});