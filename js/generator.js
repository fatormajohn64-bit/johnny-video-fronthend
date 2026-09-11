import {
  getProviders,
  getProviderSettings,
  generateVideo
} from "./api.js";

let selectedGenerator = null;
let providerSettings = {};

/*
|--------------------------------------------------------------------------
| Initialize
|--------------------------------------------------------------------------
*/

export async function initGenerator() {
  setupBackButton();
  setupGenerateButton();

  await loadGenerators();
}

/*
|--------------------------------------------------------------------------
| Back
|--------------------------------------------------------------------------
*/

function setupBackButton() {
  document
    .getElementById("back-home")
    ?.addEventListener("click", () => {
      window.location.hash = "home";
    });
}

/*
|--------------------------------------------------------------------------
| Generate button
|--------------------------------------------------------------------------
*/

function setupGenerateButton() {
  document
    .getElementById(
      "generate-video-button"
    )
    ?.addEventListener(
      "click",
      handleGenerate
    );
}

/*
|--------------------------------------------------------------------------
| Load available generators
|--------------------------------------------------------------------------
*/

async function loadGenerators() {
  const container =
    document.getElementById(
      "generator-providers"
    );

  if (!container) {
    return;
  }

  try {
    const data =
      await getProviders();

    const generators =
      data.generators || [];

    if (!generators.length) {
      container.innerHTML = `
        <div class="provider-error">
          No video generators are available.
        </div>
      `;

      return;
    }

    container.innerHTML =
      generators
        .map(provider => `
          <button
            type="button"
            class="generator-provider"
            data-provider="${escapeHtml(
              provider.id
            )}"
          >

            <span class="generator-provider-icon">
              ${getProviderIcon(
                provider.id
              )}
            </span>

            <span class="generator-provider-info">

              <strong>
                ${escapeHtml(
                  provider.name
                )}
              </strong>

              <small>
                ${
                  provider.configured
                    ? "Ready"
                    : "Not configured"
                }
              </small>

            </span>

            <span class="generator-provider-check">
              ✓
            </span>

          </button>
        `)
        .join("");

    setupProviderButtons(
      generators
    );

    /*
     * Automatically select
     * the first configured provider.
     */
    const firstReady =
      generators.find(
        provider =>
          provider.configured
      );

    if (firstReady) {
      await selectGenerator(
        firstReady.id
      );
    }

  } catch (error) {
    console.error(
      "Failed to load generators:",
      error
    );

    container.innerHTML = `
      <div class="provider-error">
        Unable to load generators.
      </div>
    `;
  }
}

/*
|--------------------------------------------------------------------------
| Provider buttons
|--------------------------------------------------------------------------
*/

function setupProviderButtons(
  generators
) {
  document
    .querySelectorAll(
      ".generator-provider"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const provider =
            button.dataset.provider;

          const providerInfo =
            generators.find(
              item =>
                item.id ===
                provider
            );

          if (
            providerInfo &&
            !providerInfo.configured
          ) {
            showStatus(
              "This provider is not configured.",
              "error"
            );

            return;
          }

          await selectGenerator(
            provider
          );
        }
      );

    });
}

/*
|--------------------------------------------------------------------------
| Select generator
|--------------------------------------------------------------------------
*/

async function selectGenerator(
  provider
) {
  selectedGenerator =
    provider;

  document
    .querySelectorAll(
      ".generator-provider"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.provider ===
          provider
      );

    });

  await loadProviderSettings(
    provider
  );
}

/*
|--------------------------------------------------------------------------
| Provider settings
|--------------------------------------------------------------------------
*/

async function loadProviderSettings(
  provider
) {
  const container =
    document.getElementById(
      "generator-settings"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="provider-error">
      Loading ${escapeHtml(
        provider
      )} settings...
    </div>
  `;

  try {
    const data =
      await getProviderSettings(
        provider
      );

    providerSettings =
      data.settings || {};

    renderSettings(
      providerSettings
    );

  } catch (error) {
    console.error(
      "Failed to load provider settings:",
      error
    );

    container.innerHTML = `
      <div class="provider-error">
        Unable to load provider settings.
      </div>
    `;
  }
}

/*
|--------------------------------------------------------------------------
| Render settings
|--------------------------------------------------------------------------
*/

function renderSettings(
  settings
) {
  const container =
    document.getElementById(
      "generator-settings"
    );

  if (!container) {
    return;
  }

  const entries =
    Object.entries(settings);

  if (!entries.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML =
    entries
      .map(
        ([key, config]) =>
          createSettingField(
            key,
            config
          )
      )
      .join("");
}

/*
|--------------------------------------------------------------------------
| Create setting field
|--------------------------------------------------------------------------
*/

function createSettingField(
  key,
  config
) {
  const label =
    formatLabel(key);

  if (
    config.type ===
    "select"
  ) {
    return `
      <div class="provider-setting">

        <label
          for="setting-${escapeHtml(
            key
          )}"
        >
          ${escapeHtml(label)}
        </label>

        <select
          id="setting-${escapeHtml(
            key
          )}"
          data-setting="${escapeHtml(
            key
          )}"
        >

          ${(
            config.options ||
            []
          )
            .map(
              option => `
                <option
                  value="${escapeHtml(
                    option
                  )}"
                  ${
                    option ===
                    config.default
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    option
                  )}
                </option>
              `
            )
            .join("")}

        </select>

      </div>
    `;
  }

  if (
    config.type ===
    "number"
  ) {
    return `
      <div class="provider-setting">

        <label
          for="setting-${escapeHtml(
            key
          )}"
        >
          ${escapeHtml(label)}
        </label>

        <input
          id="setting-${escapeHtml(
            key
          )}"
          data-setting="${escapeHtml(
            key
          )}"
          type="number"
          value="${
            config.default ??
            ""
          }"
          ${
            config.min !==
            undefined
              ? `min="${config.min}"`
              : ""
          }
          ${
            config.max !==
            undefined
              ? `max="${config.max}"`
              : ""
          }
        >

      </div>
    `;
  }

  if (
    config.type ===
    "boolean"
  ) {
    return `
      <div class="provider-setting">

        <label>
          ${escapeHtml(label)}
        </label>

        <input
          data-setting="${escapeHtml(
            key
          )}"
          type="checkbox"
          ${
            config.default
              ? "checked"
              : ""
          }
        >

      </div>
    `;
  }

  return `
    <div class="provider-setting">

      <label
        for="setting-${escapeHtml(
          key
        )}"
      >
        ${escapeHtml(label)}
      </label>

      <input
        id="setting-${escapeHtml(
          key
        )}"
        data-setting="${escapeHtml(
          key
        )}"
        type="${
          config.type ===
          "url"
            ? "url"
            : "text"
        }"
        ${
          config.default
            ? `value="${escapeHtml(
                config.default
              )}"`
            : ""
        }
        ${
          config.required
            ? "required"
            : ""
        }
      >

    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| Generate video
|--------------------------------------------------------------------------
*/

async function handleGenerate() {
  const promptInput =
    document.getElementById(
      "video-prompt"
    );

  const button =
    document.getElementById(
      "generate-video-button"
    );

  const prompt =
    promptInput?.value.trim();

  if (!selectedGenerator) {
    showStatus(
      "Choose a video generator first.",
      "error"
    );

    return;
  }

  if (!prompt) {
    showStatus(
      "Describe the video you want to create.",
      "error"
    );

    promptInput?.focus();

    return;
  }

  const input =
    collectSettings();

  button.disabled = true;

  showStatus(
    "Generating your video...",
    ""
  );

  try {

    const response =
      await generateVideo({
        generator:
          selectedGenerator,

        prompt,

        input
      });

    console.log(
      "Generation response:",
      response
    );

    /*
     * Save the complete response
     * for the result page.
     */
    const videoUrl =
      extractVideoUrl(
        response
      );

    if (!videoUrl) {
      throw new Error(
        "Generation completed, but no usable video URL was returned."
      );
    }

    sessionStorage.setItem(
      "johnny-generated-video",
      JSON.stringify({
        generator:
          selectedGenerator,

        status:
          "Completed",

        videoUrl,

        result:
          response
      })
    );

    /*
     * Open result page.
     */
    window.location.hash =
      "result";

  } catch (error) {

    console.error(
      "Generation failed:",
      error
    );

    showStatus(
      error.message ||
        "Video generation failed.",
      "error"
    );

  } finally {
    button.disabled = false;
  }
}

/*
|--------------------------------------------------------------------------
| Collect settings
|--------------------------------------------------------------------------
*/

function collectSettings() {
  const input = {};

  document
    .querySelectorAll(
      "[data-setting]"
    )
    .forEach(field => {

      const key =
        field.dataset.setting;

      if (
        field.type ===
        "checkbox"
      ) {
        input[key] =
          field.checked;

        return;
      }

      if (
        field.type ===
        "number"
      ) {
        if (
          field.value !== ""
        ) {
          input[key] =
            Number(
              field.value
            );
        }

        return;
      }

      if (
        field.value !== ""
      ) {
        input[key] =
          field.value;
      }

    });

  return input;
}

/*
|--------------------------------------------------------------------------
| Extract video URL
|--------------------------------------------------------------------------
*/

function extractVideoUrl(
  response
) {
  return (
    response?.result?.data?.video?.url ||

    response?.result?.data?.video_url ||

    response?.result?.video?.url ||

    response?.result?.video_url ||

    response?.data?.video?.url ||

    response?.data?.video_url ||

    response?.video?.url ||

    response?.video_url ||

    null
  );
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

function showStatus(
  message,
  type
) {
  const status =
    document.getElementById(
      "generation-status"
    );

  if (!status) {
    return;
  }

  status.className =
    "generation-status";

  if (type) {
    status.classList.add(
      type
    );
  }

  status.textContent =
    message;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatLabel(
  value
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /\b\w/g,
      char =>
        char.toUpperCase()
    );
}

function getProviderIcon(
  provider
) {
  switch (provider) {

    case "kling":
      return "🎥";

    case "huggingface":
      return "🤗";

    default:
      return "🎬";
  }
}

function escapeHtml(
  value
) {
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
