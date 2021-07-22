'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const btnDeleteAll = document.getElementById('reset');
const btnSort = document.getElementById('sort');

////////////////////////////////////////////////////////////////////////////////
// Workout Data : Classes
class Workout {
  // id and date are fields.
  date = new Date();
  id = (Date.now() + '').slice(-10); // Date.now() gives the Timestamp of current moment.
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // km
    this.duration = duration; // min
  }

  // Set the Description for each running /cycling object created.
  _setDescription(workout) {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    // super() function should be called first , because it sets "this" keyword.
    super(coords, distance, duration);
    this.cadence = cadence; // steps/min

    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // Pace is the inverse of speed i.e "min/km"
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    // super() function should be called first , because it sets "this" keyword.
    super(coords, distance, duration);
    this.elevationGain = elevationGain; // meters
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed; // speed in km/hr.
  }
}

////////////////////////////////////////////////////////////////////////////////
// 5. Refactoring for Project Architecture :
// - Designing a big App class for the entire Application:
class App {
  // Instance private properties/fields :
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  #sortedState = false;

  // We have a method that is called as soon as the page loads,i.e app object is created , that is constructor() method is automatically called.
  constructor() {
    //Get Current Location.
    this._getPosition();

    // Get workouts data from local storage:
    this._getLocalStorage();

    // Event Listeners
    // 4. Rendering workout input form:
    form.addEventListener('submit', this._newWorkout.bind(this));

    // Handling <select> input element : "change" event
    inputType.addEventListener('change', this._toggleElevationField);
    //Here we dont need "this" keyword binded.

    //Moving the Map to the workout clicked :
    // Callback function should be binded with "this" :
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // Delete Workouts :
    btnDeleteAll.addEventListener('click', this.reset);
    btnSort.addEventListener('click', this._sortWorkoutsOnList.bind(this));

    //
  }

  // 1. Geolocation API:
  _getPosition() {
    if (navigator.geolocation) {
      // - Here getCurrentPosition() is calling the callback and treated as a regular function call , so "this" keyword will be undefined.
      // - We need to bind the "this" keyword manually.
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not access current location!`);
        }
      );
    }
  }

  // 2. Leaflet library :
  _loadMap(position) {
    console.log(position);
    const { latitude, longitude } = position.coords;
    //console.log(`https://www.google.co.in/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];

    //console.log(this); // Instance of the class App i.e app object.
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // 3. Displaying Map Marker :
    // - Handling click on the map : using "on" i.e eventListener on Leaflet library .
    // event listener : "this" keyword will be set to the object to which eventListener is attached.
    this.#map.on('click', this._showForm.bind(this));

    // Loading workouts from localStorage and display them on the map after the map is actually loaded : ASYNC
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');

    inputDistance.focus(); // This will be nice user-experience to automatically focus an input field.
  }

  _hideForm() {
    // Clear the input fields:
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value =
    inputElevation.value = '';

    // It should appear as if the form is replaced by the workout created.
    // For that we make the form disappear immediately after submitting the form.
    form.style.display = 'none';
    form.classList.add('hidden'); // This alone takes time and performs that transform in hidden class.
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    // closest('selector') method is just the inverse of querySelector which needs a selector of the class/id and not just the name.
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Preventing default behavior of the "submit" form i.e Reloading the page.
    e.preventDefault();

    // Helper functions :
    // rest parameter forms an array that can take any number of arguments:
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Get Data from the form
    let workout;
    const type = inputType.value; // This gives "value" attribute of <option> element in HTML.
    const distance = +inputDistance.value; // Converting String to Number.
    const duration = +inputDuration.value;

    //console.log(this.#mapEvent);
    const { lat, lng } = this.#mapEvent.latlng;

    // Create Running object , for type "running":
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Guard Clause : If the input is NOT valid then it returns immediately.
      // Check if the data is valid
      if (
        //!Number.isFinite(distance) ||
        //!Number.isFinite(duration) ||
        //!Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // Create Cycling Object , for type "cycling" :
    if (type === 'cycling') {
      const elevation = +inputElevation.value; // elevation can be negative, for example while cycling down the hill.

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // Add new object created to workouts array:
    this.#workouts.push(workout);

    // Render workout on map as Marker
    this._renderWorkoutMarker(workout); // "this" keyword will still be the current object.
    //console.log(workout);

    // Render workout on list
    this._renderWorkoutOnList(workout);

    // Hide the form +
    //Clear the input fields of the form:
    this._hideForm();

    // Store workouts in the localStorage API provided by the browser.
    this._setLocalStorage();
  }

  // Rendering workout in the sidebar in the User Interface:
  _renderWorkoutOnList(workout) {
    // Generate HTML for the workout.
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
        </div>
      </li>`;
    }

    // Insert generated element into the DOM :
    form.insertAdjacentHTML('afterend', html);
    // 'afterend' will add the workout as sibling element to the form.
  }

  // hideworkoutsOnList
  _hideWorkoutsOnList() {
    document.querySelectorAll('.workout').forEach(work => {
      work.style.display = 'none';
    });
  }

  _sortWorkoutsOnList() {
    this._hideWorkoutsOnList();
    // If they are already sorted :
    if (this.#sortedState) {
      this.#workouts.forEach(work => this._renderWorkoutOnList(work));
    }

    //If they are not sorted , then sort them based on distance:
    if (!this.#sortedState) {
      const works = this.#workouts
        .slice()
        .sort((a, b) => a.distance - b.distance);
      console.log(works);
      works.forEach(work => {
        this._renderWorkoutOnList(work);
      });
    }

    this.#sortedState = !this.#sortedState;
  }

  // Exporting Display marker functionality into its own function:
  _renderWorkoutMarker(workout) {
    // These methods on L are chainable because they return "this" i.e. the map object itself.
    // Making the Popup dynamic based on inputType : i.e running or Cycling
    L.marker(workout.coords, { riseOnHover: true })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  /////// Moving the map on clicking workout:
  // - This is callback function which is called by event listener on containerWorkouts .
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return; //Guard clause
    //console.log(workoutEl);

    // Get workout data from "workouts" array using "data-id" attribute.
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    // setView(coordsArr,zoomLevel , optionsObject) to center the map to the coords passed.
    // The optionsObject passed , moves the map smoothly according to the properties.
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the Public Interface of classes.
    // Disabling the functionality of counting clicks:
    // we cannot use this method because , the prototype chain is gone.
    //workout.click();
    console.log(workout);
    //
  }

  // Set local Storage:
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // Get local Storage:
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    // Check if there is some data valid in localStorage :
    // - Guard clause for if there is no data in localStorage:
    if (!data) return;

    this.#workouts = data;
    console.log(data);
    this.#workouts.forEach(work => {
      this._renderWorkoutOnList(work);
      // we are trying to add this marker to the map, right after the page is loaded.
      //this._renderWorkoutMarker(work);  If we do this here , by that time the map is not yet loaded from Leaflet library.
    });
  }

  // Pubic interface of the "App" class:
  // Delete and reset localStorage :
  // location.reload() - This reloads the page programatically
  reset() {
    localStorage.removeItem('workouts');
    location.reload(); // Reloads the page after deleting the 'workouts' from localStorage.
  }
}

const app = new App();

//console.log(firstName);

// IMPORTANT :
// - When we converted objects to string in localStorage and then string back to Objects , we lost the prototype chain.
// -So the new objects that we recovered from localStorage are just regular objects.
// - they are not the objects that are created from Cycling/Running classes or neither Workout class . So therefore they will not be able to inherit any of their methods.
