# Mapty
Mapty is a front-end web application developed using JavaScript, HTML and CSS. The website allows the user to create, mark and store data about their workouts like cycling or running on a Map that displays their current location in the browser.

## Tech stack used:
HTML, CSS, JavaScript, OOPS, Leaflet.js, Web APIs like Geolocation and localStorage.

## Key Functionalities:
- Geolocation API gets the current location of the user.
-	Customized Map is displayed using Leaflet.js external library, when the user grants permission to access his/her location to the browser.
-	Mark a workout on the Map and a form is displayed to fill the details about the workout.
-	Data validation is implemented while filling out form.
-	List of workouts entered is displayed.
-	Workouts are stored in the localStorage using API so that the data is not lost on reload or closing the browser.
-	When the user clicks on a workout displayed on the list, the map is centered to the corresponding workout.
-	Sort and DeleteAll workouts functionalities are also implemented using JavaScript.


## User Guide:
When the user opens the website on a browser, a pop-up is displayed requesting access to the user's location.As the user gives access to his/her location, the map is displayed on the browser.So now the user can use to mark,create and store thier workouts in the browser itself without losing data on reload/closing the browser.
