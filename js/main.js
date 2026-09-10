/* ========================================
   Johnny Tec OS
   Main Application
======================================== */

import {
  checkHealth,
  getProviders
} from "./api.js";

/*
|--------------------------------------------------------------------------
| Application
|--------------------------------------------------------------------------
*/

async function startApp() {
  const mainScreen =
    document.getElementById("main-screen");

  if (!mainScreen) {
    console.error(
      "Main screen element not found."
    );

    return;
  }

  mainScreen.innerHTML = `
    <section class="app-loading">
      <div class="loading-spinner"></div>

      <p>
        Starting Johnny Tec OS...
      </p>
    </section>
  `;

  try {
    const health =
      await checkHealth();

    console.log(
      "Backend:",
      health
    );

    const providers =
      await getProviders();

    console.log(
      "Providers:",
      providers
    );

    await loadHome();

  } catch (error) {
    console.error(
      "Application startup failed:",
      error
    );

    mainScreen.innerHTML = `
      <section class="app-error">

        <div class="error-icon">
          ⚠️
        </div>

        <h1>
          Backend unavailable
        </h1>

        <p>
          Johnny Tec OS could not connect
          to the video backend.
        </p>

        <button
          id="retry-button"
          type="button"
        >
          Try Again
        </button>

      </section>
    `;

    document
      .getElementById("retry-button")
      ?.addEventListener(
        "click",
        startApp
      );
  }
}

/*
|--------------------------------------------------------------------------
| Home
|--------------------------------------------------------------------------
*/

async function loadHome() {
  const mainScreen =
    document.getElementById("main-screen");

  if (!mainScreen) {
    return;
  }

  mainScreen.innerHTML = `
    <section class="home-placeholder">

      <h1>
        Johnny Tec OS
      </h1>

      <p>
        Video Studio
      </p>

      <div class="home-status">
        Backend connected ✓
      </div>

    </section>
  `;
}

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

startApp();
