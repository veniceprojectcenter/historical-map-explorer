define(['FirebaseSimpleLogin'], function(FirebaseSimpleLogin) {
	/* Firebase authentication stuff
	 * Handles logging in and creating account
	 */
	function FirebaseAuth (fb) {
		var auth;
		var fbUser;
		var loggedIn;
		
		this.getUser = function() {
			return fbUser;
		};
	
		/* Called when anything related to the state of the user occurs.
		 * This is called when the user is logged in or out, or if login
		 * fails, or if an error occurs (in which case we assume a logout).
		 */
		this.userCallback = function (error, user) {
			if (error) { /* Error */
				console.log(error);
				loggedIn = false;
				$('#login-text').show();
				$('#loggedin-text').hide();
				$('#login-form').hide();
			}
			else if (user) { /* Logged in */
				fbUser = user;
				loggedIn = true;
				$('#login-form').hide();
				$('#login-text').hide();
				$('#loggedin-username').text(user.email);
				$('#loggedin-text').show();
				$('#drawmode').css('display', 'inline');
				$('.layers-menu').append('<li id="new-layer-menu" role="presentation"><a role="menu-item" href="#" data-toggle="modal" data-target="#new-layer"><em>New Layer</em></a></li>');
				$('.maps-menu').append('<li id="new-map-menu" role="presentation"><a role="menu-item" href="#" data-toggle="modal" data-target="#new-map"><em>New Map</em></a></li>');
			} else { /* Logged out */
				loggedIn = false;
				$('#login-text').show();
				$('#loggedin-text').hide();
				$('#login-form').hide();
				$('#drawmode').css('display', 'none');
				$('#new-layer-menu').remove();
			}
		};
	
		/* Attempts to log in with the given email and password
		 */
		this.login = function (email, password) {
			auth.login('password', {
				email: email,
				password: password,
				rememberMe: true
			}, function(error, user) {
				if (error) {
					console.log(error);
				}
			});
		};
	
		/* Logs the user out
		 */
		this.logout = function () {
			auth.logout();
		};
	
		/* Signup the user using the given email and password
		 * TODO: Actually implement this, and the needed backend code
		 */
		this.signup = function (email, password) {
			// Not implemented for now.
			// Firebase has a very simple easy API for signing up.
	
			// This should probably log the user in after the account
			// is created.
		};
	
		// Create the firebase login object
		auth = new FirebaseSimpleLogin(fb, this.userCallback);
	
		return this;
	}
	
	return FirebaseAuth;
});