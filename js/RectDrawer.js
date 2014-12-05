define(function() {
	/* Code for handling drawing the rectangle when downloading a segment of
	 * the map
	 */
	function RectDrawer () {
		var rectX, rectY,
				latlngStart, latlngEnd;
	
		/* Called when the rectangle is finished being drawn,
		 * ie. when the user stops holding the mouse button
		 */
		this.endRect = function (callback, event) {
			var x = $(".rect").css("left").slice(0, -2);
			var y = $(".rect").css("top").slice(0, -2);
			var width = $(".rect").css("width").slice(0, -2);
			var height = $(".rect").css("height").slice(0, -2);
	
			$(".rect").remove();
			$(".rect-canvas").remove();
	
			$('#select').removeClass('active');
			callback(x, y, width, height);
		};
	
		/* Called when the user begins drawing the rectangle,
		 * ie. when the left mouse button is depressed.
		 */
		this.startRect = function (event) {
			$(".rect-canvas").append('<div class="rect"></div>');
			rectX = event.clientX;
			rectY = event.clientY;
			$(".rect").css({ top: rectY, left: rectX });
			$(".rect-canvas").mousemove(this.updateRect);
		};
	
		/* Initialize the rectangle drawer
		 * This takes a callback saying what should be called when the user
		 * has finished drawing the rectangle
		 */
		this.initialize = function (callback) {
			$("body").append('<div class="rect-canvas"></div>');
			$(".rect-canvas").mousedown(this.startRect.bind(this));
			$(".rect-canvas").mouseup(this.endRect.bind(this, callback));
			$('#select').addClass('active');
		};
	
		/* Called as the mouse is being dragged, this updates the visible rectangle
		 * that appears on the map
		 */
		this.updateRect = function (event) {
			var xDiff = event.clientX - rectX,
					yDiff = event.clientY - rectY,
					newX, newY, newWidth, newHeight;
	
			// Rectangles need to be specified with an (x,y) top left
			// coordinate, and a width and lenfth. If the user move to the right or
			// down, the width and height are increased respectively. If we move
			// left or up _past_ the current top left (x,y) location. We must move
			// that location up or back.
	
			if (xDiff < 0) {
				newWidth = Math.abs(xDiff);
				newX = rectX - newWidth;
			}
			else {
				newX = rectX;
				newWidth = xDiff;
			}
	
			if (yDiff < 0) {
				newHeight = Math.abs(yDiff);
				newY = rectY - newHeight;
			}
			else {
				newY = rectY;
				newHeight = yDiff;
			}
	
			// Update the DOM object
			$(".rect").css({
				left: newX+"px",
				top: newY+"px",
				width: newWidth+"px",
				height: newHeight+"px"});
		};
	}
	
	return RectDrawer;
});