define([], function() {
  function UrlMap(){
    /// CONSTANTS
  	var DEFAULT_MAP = 'debarbari';
  	
    var urlMapEl = {}
    urlMapEl.getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };
  
    urlMapEl.map     = urlMapEl.getUrlParameter('map');
    urlMapEl.layer   = urlMapEl.getUrlParameter('layer');
    urlMapEl.feature = urlMapEl.getUrlParameter('feature');

    urlMapEl.parseParameters = function(){
      if (urlMapEl.feature) {
        console.log("Switch to feature " + urlMapEl.feature);
        if (!urlMapEl.layer) urlMapEl.layer = 'island';
        if (!urlMapEl.map  ) urlMapEl.map   = DEFAULT_MAP; //'debarbari-map';
    
      } else if (urlMapEl.layer) {
        console.log("Switch to layer " + urlMapEl.layer);
        if (!urlMapEl.map  ) urlMapEl.map   = DEFAULT_MAP; //'debarbari-map';
    
      } else if (urlMapEl.map) {
        console.log("Switch to map " + urlMapEl.map);
        // var selectedData = layerManager.selectedData();
    		// mapManager.map.closePopup();
    		// mapManager.switchMap(map, selectedData.id);
    		// mapManager.switchMap( map );
      } else {
        console.log("NO API CALLED");
        urlMapEl.map   = DEFAULT_MAP;
      }
    };
  
    urlMapEl.parseParameters();
    
    return urlMapEl;
  }
  
  return UrlMap;
});