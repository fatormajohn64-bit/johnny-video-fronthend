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
  },

  generator: {
    html: "./pages/generator.html",
    css: "./css/generator.css",
    js: "./generator.js"
  },

  result: {
    html: "./pages/result.html",
    css: "./css/result.css",
    js: "./result.js"
  },

  editor: {
    html: "./pages/editor.html",
    css: "./css/editor.css",
    js: "./editor.js"
  }
};


let currentPage = null;
let isLoadingPage = false;


/*
|--------------------------------------------------------------------------
| Load Page
|--------------------------------------------------------------------------
*/

async function loadPage(pageName) {

  if (!mainScreen) {
    console.error(
      "Main screen element #main-screen was not found."
    );

    return;
  }


  const page =
    pages[pageName] || pages.home;


  const actualPageName =
    pages[pageName]
      ? pageName
      : "home";


  /*
   * Prevent multiple page loads
   */
  if (isLoadingPage) {
    return;
  }


  isLoadingPage = true;


  try {

    /*
     * Remove old page CSS
     */
    removePageCss();


    /*
     * Load new page CSS
     */
    await loadPageCss(
      page.css
    );


    /*
     * Load page HTML
     */
    const response =
      await fetch(page.html);


    if (!response.ok) {

      throw new Error(
        `Failed to load ${page.html} (${response.status})`
      );

    }


    const html =
      await response.text();


    /*
     * Put HTML into main screen
     */
    mainScreen.innerHTML =
      html;


    /*
     * Load page JavaScript
     */
    await loadScript(
      page.js
    );


    /*
     * Page successfully loaded
     */
    currentPage =
      actualPageName;


  } catch (error) {

    console.error(
      "Page loading error:",
      error
    );


    removePageCss();


    mainScreen.innerHTML = `
      <section class="app-error">

        <div class="error-icon">
          ⚠️
        </div>

        <h1>
          Page failed to load
        </h1>

        <p>
          ${escapeHtml(
            error.message
          )}
        </p>

        <button
          id="retry-button"
          type="button"
        >
          Try Again
        </button>

        <button
          id="home-button"
          type="button"
        >
          Go Home
        </button>

      </section>
    `;


    /*
     * Retry
     */
    document
      .getElementById(
        "retry-button"
      )
      ?.addEventListener(
        "click",
        () => {

          currentPage = null;

          loadPage(
            actualPageName
          );

        }
      );


    /*
     * Go home
     */
    document
      .getElementById(
        "home-button"
      )
      ?.addEventListener(
        "click",
        () => {

          currentPage = null;

          window.location.hash =
            "home";

        }
      );


  } finally {

    isLoadingPage = false;

  }
}


/*
|--------------------------------------------------------------------------
| Load Page CSS
|--------------------------------------------------------------------------
*/

function loadPageCss(path) {

  return new Promise(
    (resolve, reject) => {

      const link =
        document.createElement(
          "link"
        );


      link.rel =
        "stylesheet";


      link.href =
        path;


      link.dataset.pageCss =
        "true";


      link.onload = () => {
        resolve();
      };


      link.onerror = () => {

        reject(
          new Error(
            `Failed to load ${path}`
          )
        );

      };


      document.head.appendChild(
        link
      );

    }
  );

}


/*
|--------------------------------------------------------------------------
| Remove Page CSS
|--------------------------------------------------------------------------
*/

function removePageCss() {

  document
    .querySelectorAll(
      'link[data-page-css="true"]'
    )
    .forEach(
      link => {
        link.remove();
      }
    );

}


/*
|--------------------------------------------------------------------------
| Load Page JavaScript
|--------------------------------------------------------------------------
*/

async function loadScript(path) {

  /*
   * main.js is already inside /js/
   *
   * So these paths are correct:
   *
   * ./home.js
   * ./generator.js
   * ./result.js
   * ./editor.js
   */


  const module =
    await import(
      `${path}?t=${Date.now()}`
    );


  /*
   * HOME
   */

  if (
    typeof module.initHome ===
    "function"
  ) {

    await module.initHome();

  }


  /*
   * GENERATOR
   */

  if (
    typeof module.initGenerator ===
    "function"
  ) {

    await module.initGenerator();

  }


  /*
   * RESULT
   */

  if (
    typeof module.initResult ===
    "function"
  ) {

    await module.initResult();

  }


  /*
   * EDITOR
   */

  if (
    typeof module.initEditor ===
    "function"
  ) {

    await module.initEditor();

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


  /*
   * Ignore invalid navigation
   *
   * loadPage() will automatically
   * fall back to home.
   */

  if (
    page === currentPage
  ) {

    return;

  }


  await loadPage(
    page
  );

}


/*
|--------------------------------------------------------------------------
| Hash Navigation
|--------------------------------------------------------------------------
*/

window.addEventListener(
  "hashchange",
  router
);


/*
|--------------------------------------------------------------------------
| Start Application
|--------------------------------------------------------------------------
*/

router();


/*
|--------------------------------------------------------------------------
| HTML Escaping
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}
