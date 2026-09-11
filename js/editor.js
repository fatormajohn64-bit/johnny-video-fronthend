import {
  getProviders,
  getProviderSettings,
  editVideo,
  createUploadUrl
} from "./api.js";

let selectedEditor = null;
let editorSettings = {};
let videoUrl = null;
let localVideoFile = null;
let localVideoObjectUrl = null;

/*
|--------------------------------------------------------------------------
| Initialize
|--------------------------------------------------------------------------
*/

export async function initEditor() {
  setupBackButton();
  setupVideoPicker();
  setupRenderButton();

  loadGeneratedVideo();

  await loadEditors();
}

/*
|--------------------------------------------------------------------------
| Back
|--------------------------------------------------------------------------
*/

function setupBackButton() {
  document
    .getElementById("back-home")
    ?.addEventListener(
      "click",
      () => {
        window.location.hash =
          "home";
      }
    );
}

/*
|--------------------------------------------------------------------------
| Load generated video
|--------------------------------------------------------------------------
*/

function loadGeneratedVideo() {
  const storedVideo =
    sessionStorage.getItem(
      "johnny-edit-video-url"
    );

  if (!storedVideo) {
    return;
  }

  videoUrl =
    storedVideo;

  showVideoPreview(
    videoUrl
  );
}

/*
|--------------------------------------------------------------------------
| Video picker
|--------------------------------------------------------------------------
*/

function setupVideoPicker() {
  const chooseButton =
    document.getElementById(
      "choose-video"
    );

  const fileInput =
    document.getElementById(
      "video-file"
    );

  chooseButton?.addEventListener(
    "click",
    () => {
      fileInput?.click();
    }
  );

  fileInput?.addEventListener(
    "change",
    handleVideoFile
  );
}

function handleVideoFile(event) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  if (
    !file.type.startsWith(
      "video/"
    )
  ) {
    showStatus(
      "Please choose a video file.",
      "error"
    );

    return;
  }

  localVideoFile =
    file;

  /*
   * Clear an old object URL.
   */
  if (localVideoObjectUrl) {
    URL.revokeObjectURL(
      localVideoObjectUrl
    );
  }

  localVideoObjectUrl =
    URL.createObjectURL(
      file
    );

  /*
   * A local file does not have
   * a provider URL yet.
   *
   * We keep it locally until
   * Render Video is pressed.
   */
  videoUrl = null;

  showVideoPreview(
    localVideoObjectUrl
  );

  showStatus(
    `Selected: ${file.name}`,
    ""
  );
}

/*
|--------------------------------------------------------------------------
| Video preview
|--------------------------------------------------------------------------
*/

function showVideoPreview(
  url
) {
  const video =
    document.getElementById(
      "editor-video-preview"
    );

  const empty =
    document.getElementById(
      "video-source-empty"
    );

  if (!video) {
    return;
  }

  video.src =
    url;

  video.classList.remove(
    "hidden"
  );

  empty?.classList.add(
    "hidden"
  );
}

/*
|--------------------------------------------------------------------------
| Load editors
|--------------------------------------------------------------------------
*/

async function loadEditors() {
  const container =
    document.getElementById(
      "editor-providers"
    );

  if (!container) {
    return;
  }

  try {
    const data =
      await getProviders();

    const editors =
      data.editors || [];

    if (!editors.length) {
      container.innerHTML = `
        <div class="provider-error">
          No video editors are available.
        </div>
      `;

      return;
    }

    container.innerHTML =
      editors
        .map(
          editor => `
            <button
              type="button"
              class="editor-provider"
              data-provider="${escapeHtml(
                editor.id
              )}"
            >

              <span
                class="editor-provider-icon"
              >
                ${getEditorIcon(
                  editor.id
                )}
              </span>

              <span
                class="editor-provider-info"
              >

                <strong>
                  ${escapeHtml(
                    editor.name
                  )}
                </strong>

                <small>
                  ${
                    editor.configured
                      ? "Ready"
                      : "Not configured"
                  }
                </small>

              </span>

              <span
                class="editor-provider-check"
              >
                ✓
              </span>

            </button>
          `
        )
        .join("");

    setupEditorButtons(
      editors
    );

    /*
     * Automatically select the
     * first configured editor.
     */
    const firstReady =
      editors.find(
        editor =>
          editor.configured
      );

    if (firstReady) {
      await selectEditor(
        firstReady.id
      );
    }

  } catch (error) {
    console.error(
      "Failed to load editors:",
      error
    );

    container.innerHTML = `
      <div class="provider-error">
        Unable to load video editors.
      </div>
    `;
  }
}

/*
|--------------------------------------------------------------------------
| Editor buttons
|--------------------------------------------------------------------------
*/

function setupEditorButtons(
  editors
) {
  document
    .querySelectorAll(
      ".editor-provider"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const provider =
            button.dataset.provider;

          const editorInfo =
            editors.find(
              item =>
                item.id ===
                provider
            );

          if (
            editorInfo &&
            !editorInfo.configured
          ) {
            showStatus(
              "This editor is not configured.",
              "error"
            );

            return;
          }

          await selectEditor(
            provider
          );
        }
      );

    });
}

/*
|--------------------------------------------------------------------------
| Select editor
|--------------------------------------------------------------------------
*/

async function selectEditor(
  provider
) {
  selectedEditor =
    provider;

  document
    .querySelectorAll(
      ".editor-provider"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.provider ===
          provider
      );

    });

  await loadEditorSettings(
    provider
  );
}

/*
|--------------------------------------------------------------------------
| Load editor settings
|--------------------------------------------------------------------------
*/

async function loadEditorSettings(
  provider
) {
  const container =
    document.getElementById(
      "editor-settings"
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

    editorSettings =
      data.settings || {};

    renderSettings(
      editorSettings
    );

  } catch (error) {
    console.error(
      "Failed to load editor settings:",
      error
    );

    container.innerHTML = `
      <div class="provider-error">
        Unable to load editor settings.
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
      "editor-settings"
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

          ${(config.options || [])
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

  if (
    config.type ===
    "url"
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
          type="url"
          placeholder="https://..."
          ${
            config.required
              ? "required"
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
        type="text"
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
| Render video
|--------------------------------------------------------------------------
*/

function setupRenderButton() {
  document
    .getElementById(
      "render-video-button"
    )
    ?.addEventListener(
      "click",
      handleRender
    );
}

async function handleRender() {
  const button =
    document.getElementById(
      "render-video-button"
    );

  if (!selectedEditor) {
    showStatus(
      "Choose a video editor first.",
      "error"
    );

    return;
  }

  /*
   * If the user selected a
   * local video, upload it first.
   */
  if (
    !videoUrl &&
    localVideoFile
  ) {
    button.disabled = true;

    showStatus(
      "Preparing video for the editor...",
      ""
    );

    try {
      videoUrl =
        await uploadVideo(
          localVideoFile,
          selectedEditor
        );

    } catch (error) {
      console.error(
        "Video upload failed:",
        error
      );

      showStatus(
        error.message ||
          "Unable to upload video.",
        "error"
      );

      button.disabled = false;

      return;
    }
  }

  if (!videoUrl) {
    showStatus(
      "Choose a video before rendering.",
      "error"
    );

    return;
  }

  const settings =
    collectSettings();

  button.disabled = true;

  showStatus(
    `Sending video to ${selectedEditor}...`,
    ""
  );

  try {
    const response =
      await editVideo({
        editor:
          selectedEditor,

        videoUrl,

        settings
      });

    console.log(
      "Editor response:",
      response
    );

    sessionStorage.setItem(
      "johnny-editor-result",
      JSON.stringify({
        editor:
          selectedEditor,

        videoUrl,

        settings,

        result:
          response
      })
    );

    showStatus(
      "Video render started successfully.",
      "success"
    );

  } catch (error) {
    console.error(
      "Render failed:",
      error
    );

    showStatus(
      error.message ||
        "Video rendering failed.",
      "error"
    );

  } finally {
    button.disabled = false;
  }
}

/*
|--------------------------------------------------------------------------
| Upload local video
|--------------------------------------------------------------------------
*/

async function uploadVideo(
  file,
  provider
) {
  const upload =
    await createUploadUrl({
      provider,

      name:
        file.name,

      contentType:
        file.type,

      size:
        file.size
    });

  if (
    !upload?.uploadUrl
  ) {
    throw new Error(
      "The backend did not return an upload URL."
    );
  }

  /*
   * Upload directly to the
   * provider's signed URL.
   *
   * The video does NOT get
   * stored on your backend.
   */
  const response =
    await fetch(
      upload.uploadUrl,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            file.type
        },

        body: file
      }
    );

  if (!response.ok) {
    throw new Error(
      `Video upload failed: ${response.status}`
    );
  }

  return (
    upload.fileUrl ||
    upload.url ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Collect settings
|--------------------------------------------------------------------------
*/

function collectSettings() {
  const settings = {};

  document
    .querySelectorAll(
      "#editor-settings [data-setting]"
    )
    .forEach(field => {

      const key =
        field.dataset.setting;

      if (
        field.type ===
        "checkbox"
      ) {
        settings[key] =
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
          settings[key] =
            Number(
              field.value
            );
        }

        return;
      }

      if (
        field.value !== ""
      ) {
        settings[key] =
          field.value;
      }

    });

  return settings;
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

function getEditorIcon(
  provider
) {
  switch (provider) {

    case "json2video":
      return "🎞️";

    case "shotstack":
      return "🎬";

    default:
      return "✂️";
  }
}

function showStatus(
  message,
  type
) {
  const status =
    document.getElementById(
      "editor-status"
    );

  if (!status) {
    return;
  }

  status.className =
    "editor-status";

  if (type) {
    status.classList.add(
      type
    );
  }

  status.classList.remove(
    "hidden"
  );

  status.textContent =
    message;
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
