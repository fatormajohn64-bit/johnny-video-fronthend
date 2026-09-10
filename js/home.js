/* ========================================
   Johnny Tec OS
   Home Controller
======================================== */

import {
  getProviders
} from "./api.js";

/*
|--------------------------------------------------------------------------
| Initialize Home
|--------------------------------------------------------------------------
*/

export async function initHome() {
  setupButtons();
  await loadProviders();
}

/*
|--------------------------------------------------------------------------
| Buttons
|--------------------------------------------------------------------------
*/

function setupButtons() {
  const generateButton =
    document.getElementById(
      "generate-button"
    );

  const editButton =
    document.getElementById(
      "edit-button"
    );

  const liveButton =
    document.getElementById(
      "live-button"
    );

  const settingsButton =
    document.getElementById(
      "settings-button"
    );


  generateButton?.addEventListener(
    "click",
    () => {
      window.location.hash =
        "generator";
    }
  );


  editButton?.addEventListener(
    "click",
    () => {
      window.location.hash =
        "editor";
    }
  );


  liveButton?.addEventListener(
    "click",
    () => {
      window.location.hash =
        "live";
    }
  );


  settingsButton?.addEventListener(
    "click",
    () => {
      window.location.hash =
        "settings";
    }
  );
}

/*
|--------------------------------------------------------------------------
| Load providers
|--------------------------------------------------------------------------
*/

async function loadProviders() {
  const providerList =
    document.getElementById(
      "provider-list"
    );

  const providerStatus =
    document.getElementById(
      "provider-status"
    );

  if (!providerList) {
    return;
  }

  try {
    const data =
      await getProviders();

    const generators =
      data.generators || [];

    const editors =
      data.editors || [];

    const providers = [
      ...generators,
      ...editors
    ];

    providerList.innerHTML =
      providers
        .map(provider => {
          const status =
            provider.configured
              ? "Ready"
              : "Not configured";

          return `
            <div class="provider-item">

              <div class="provider-info">

                <strong>
                  ${escapeHtml(
                    provider.name
                  )}
                </strong>

                <small>
                  ${escapeHtml(
                    provider.type
                  )}
                </small>

              </div>

              <span
                class="provider-status ${
                  provider.configured
                    ? "ready"
                    : "unavailable"
                }"
              >
                ${status}
              </span>

            </div>
          `;
        })
        .join("");

    providerStatus.textContent =
      `${providers.length} providers`;

  } catch (error) {
    console.error(
      "Failed to load providers:",
      error
    );

    providerStatus.textContent =
      "Unavailable";

    providerList.innerHTML = `
      <div class="provider-error">
        Unable to load providers.
      </div>
    `;
  }
}

/*
|--------------------------------------------------------------------------
| Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
