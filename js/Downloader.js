define(function() {
	
	/* Holds functions related to downloading images from the map
	 */
	function Downloader () {
		/* Creates a canvase element from the the map
		 */
		function getCanvasFromMap() {
			var c = document.createElement("canvas");
			c.width = $("#map").width();
			c.height = $("#map").height();
			var canvas = c.getContext("2d");
	
			var imgs = $(".leaflet-tile-container.leaflet-zoom-animated").children();
	
			for (var i = 0; i < imgs.length; ++i) {
				var img = imgs[i];
				var rect = img.getBoundingClientRect();
	
				canvas.drawImage(img, rect.left, rect.top);
			}
	
			return c;
		}
	
		/* Returns an image URL from data on the map
		 */
		this.getData = function () {
			var c = getCanvasFromMap();
	
			var img_url = c.toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			return img_url;
	
		};
	
		/* Downloads a portion of the map specified by the arguments
		 */
		this.downloadSection = function (x, y, width, height) {
			var canvas = getCanvasFromMap();
			var ctx = canvas.getContext('2d');
	
			var selection = ctx.getImageData(x, y, width, height);
			canvas.width = width;
			canvas.height = height;
			ctx.putImageData(selection, 0, 0);
	
			var link = document.createElement("a");
			link.href = canvas.toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			link.download = "explorer.png";
			var theEvent = document.createEvent("MouseEvent");
			theEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			link.dispatchEvent(theEvent);
		};
	
	}
	
	return Downloader;
});