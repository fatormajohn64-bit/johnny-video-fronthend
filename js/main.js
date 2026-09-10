/* ========================================
   Johnny Tec OS
   Main Application Router
======================================== */

const mainScreen =
  document.getElementById("main-screen");

/*
|--------------------------------------------------------------------------
| Pages
|--------------------------------------------------------------------------
*/

const pages = {
  home: {
    html: "./pages/home.html",
    css: "./css/home.css",
    js: "./home.js"
  }
};

/*
|--------------------------------------------------------------------------
| Load page
|--------------------------------------------------------------------------
*/

async function loadPage(pageName) {
  const page =
    pages[pageName];

  if (!page) {
    return loadPage("home");
  }

  try {
    const response =
      await fetch(page.html);

    if (!response.ok) {
      throw new Error(
        `Failed to load ${page.html}`
      );
    }

    const html =
      await response.text();

    mainScreen.innerHTML = html;

    await loadScript(page.js);

  } catch (error) {
    console.error(
      "Page loading error:",
      error
    );

    mainScreen.innerHTML = `
      <section class="app-error">
        <div class="error-icon">
          ⚠️
        </div>

        <h1>
          Page failed to load
        </h1>

        <p>
          ${error.message}
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
        () => loadPage(pageName)
      );
  }
}

/*
|--------------------------------------------------------------------------
| Load JavaScript module
|--------------------------------------------------------------------------
*/

async function loadScript(path) {
  const module =
    await import(
      `${path}?t=${Date.now()}`
    );

  if (
    typeof module.initHome ===
    "function"
  ) {
    await module.initHome();
  }
}

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
*/

async function router() {
  const hash =
    window.location.hash
      .replace("#", "")
      .trim();

  const page =
    hash || "home";

  await loadPage(page);
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

window.addEventListener(
  "hashchange",
  router
);

/*
|--------------------------------------------------------------------------
| Start application
|--------------------------------------------------------------------------
*/

router();
