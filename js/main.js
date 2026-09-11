const mainScreen =
  document.getElementById("main-screen");

const pages = {
  home: {
    html: "./pages/home.html",
    css: "./css/home.css",
    js: "./js/home.js"
  },

  generator: {
    html: "./pages/generator.html",
    css: "./css/generator.css",
    js: "./js/generator.js"
  },

  result: {
    html: "./pages/result.html",
    css: "./css/result.css",
    js: "./js/result.js"
  }
};

let currentPage = null;

/*
|--------------------------------------------------------------------------
| Load page
|--------------------------------------------------------------------------
*/

async function loadPage(pageName) {
  const page =
    pages[pageName] || pages.home;

  const actualPageName =
    pages[pageName]
      ? pageName
      : "home";

  try {
    /*
     * Remove previous page CSS
     */
    removePageCss();

    /*
     * Load current page CSS
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
        `Failed to load ${page.html}`
      );
    }

    const html =
      await response.text();

    mainScreen.innerHTML =
      html;

    /*
     * Load page JavaScript
     */
    await loadScript(
      page.js
    );

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

      </section>
    `;

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
  }
}

/*
|--------------------------------------------------------------------------
| Load page CSS
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
| Remove page CSS
|--------------------------------------------------------------------------
*/

function removePageCss() {
  document
    .querySelectorAll(
      'link[data-page-css="true"]'
    )
    .forEach(link => {
      link.remove();
    });
}

/*
|--------------------------------------------------------------------------
| Load page JavaScript
|--------------------------------------------------------------------------
*/

async function loadScript(path) {
  const module =
    await import(
      `${path}?t=${Date.now()}`
    );

  /*
   * Home
   */
  if (
    typeof module.initHome ===
    "function"
  ) {
    await module.initHome();
  }

  /*
   * Generator
   */
  if (
    typeof module.initGenerator ===
    "function"
  ) {
    await module.initGenerator();
  }

  /*
   * Result
   */
  if (
    typeof module.initResult ===
    "function"
  ) {
    await module.initResult();
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
   * Don't reload the same page
   */
  if (
    page === currentPage
  ) {
    return;
  }

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

/*
|--------------------------------------------------------------------------
| HTML escaping
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
