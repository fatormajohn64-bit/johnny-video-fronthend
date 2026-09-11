/* ========================================
   Johnny Tec OS
   Video Result Page
======================================== */

import {
  getJson2VideoRender,
  getShotstackRender
} from "./api.js";


let resultData = null;
let pollTimer = null;
let pollCount = 0;


/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const POLL_INTERVAL = 5000;
const MAX_POLLS = 120;


/*
|--------------------------------------------------------------------------
| Initialize
|--------------------------------------------------------------------------
*/

export async function initResult() {

  clearPolling();

  setupBackButton();
  setupActions();
  setupRetry();

  loadResultData();

}


/*
|--------------------------------------------------------------------------
| Load Result Data
|--------------------------------------------------------------------------
*/

function loadResultData() {

  const stored =
    sessionStorage.getItem(
      "johnny-editor-result"
    );


  if (!stored) {

    showError(
      "No video render was found."
    );

    return;

  }


  try {

    resultData =
      JSON.parse(stored);

  } catch (error) {

    console.error(
      "Invalid result data:",
      error
    );

    showError(
      "The saved render information is invalid."
    );

    return;

  }


  const editor =
    resultData.editor;


  if (!editor) {

    showError(
      "No video editor was specified."
    );

    return;

  }


  setProviderName(editor);

  setStatus("Processing...");

  startPolling();

}


/*
|--------------------------------------------------------------------------
| Start Polling
|--------------------------------------------------------------------------
*/

function startPolling() {

  clearPolling();

  pollCount = 0;

  pollRender();

}


/*
|--------------------------------------------------------------------------
| Poll Render
|--------------------------------------------------------------------------
*/

async function pollRender() {

  if (!resultData) {
    return;
  }


  if (pollCount >= MAX_POLLS) {

    showError(
      "The video is taking too long to render. Please try again later."
    );

    return;

  }


  pollCount++;


  try {

    const response =
      await getRenderStatus();


    console.log(
      "Render status:",
      response
    );


    const normalized =
      normalizeRenderResponse(
        response
      );


    if (normalized.error) {

      showError(
        normalized.error
      );

      return;

    }


    /*
     * Finished
     */

    if (normalized.videoUrl) {

      handleCompletedRender(
        normalized
      );

      return;

    }


    /*
     * Failed
     */

    if (normalized.failed) {

      showError(
        normalized.message ||
        "The video render failed."
      );

      return;

    }


    /*
     * Still processing
     */

    setStatus(
      normalized.status ||
      "Processing video..."
    );


    pollTimer =
      setTimeout(
        pollRender,
        POLL_INTERVAL
      );


  } catch (error) {

    console.error(
      "Render polling error:",
      error
    );


    /*
     * Temporary network/provider
     * error — keep polling.
     */

    setStatus(
      "Checking video status..."
    );


    pollTimer =
      setTimeout(
        pollRender,
        POLL_INTERVAL
      );

  }

}


/*
|--------------------------------------------------------------------------
| Get Render Status
|--------------------------------------------------------------------------
*/

async function getRenderStatus() {

  const editor =
    resultData.editor;


  const result =
    resultData.result;


  const id =
    findRenderId(result);


  if (!id) {

    throw new Error(
      "Render ID was not returned by the editor."
    );

  }


  if (editor === "json2video") {

    return getJson2VideoRender(
      id
    );

  }


  if (editor === "shotstack") {

    return getShotstackRender(
      id
    );

  }


  throw new Error(
    `Unsupported editor: ${editor}`
  );

}


/*
|--------------------------------------------------------------------------
| Find Render ID
|--------------------------------------------------------------------------
*/

function findRenderId(value) {

  if (!value) {
    return null;
  }


  if (typeof value === "string") {
    return value;
  }


  if (typeof value !== "object") {
    return null;
  }


  return (
    value.projectId ||
    value.project_id ||
    value.renderId ||
    value.render_id ||
    value.id ||
    value.data?.projectId ||
    value.data?.project_id ||
    value.data?.renderId ||
    value.data?.render_id ||
    value.data?.id ||
    value.result?.projectId ||
    value.result?.project_id ||
    value.result?.renderId ||
    value.result?.render_id ||
    value.result?.id ||
    null
  );

}


/*
|--------------------------------------------------------------------------
| Normalize Render Response
|--------------------------------------------------------------------------
*/

function normalizeRenderResponse(
  response
) {

  const videoUrl =
    findVideoUrl(
      response
    );


  const status =
    findStatus(
      response
    );


  const failed =
    isFailedStatus(
      status
    );


  const error =
    response?.error ||
    response?.message?.error ||
    response?.data?.error ||
    null;


  return {

    videoUrl,

    status,

    failed,

    error,

    message:
      response?.message ||
      response?.data?.message ||
      null

  };

}


/*
|--------------------------------------------------------------------------
| Find Video URL
|--------------------------------------------------------------------------
*/

function findVideoUrl(value) {

  if (!value) {
    return null;
  }


  if (typeof value === "string") {

    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {

      return value;

    }

    return null;

  }


  if (typeof value !== "object") {
    return null;
  }


  const possibleUrl =
    value.url ||
    value.videoUrl ||
    value.video_url ||
    value.downloadUrl ||
    value.download_url ||
    value.data?.url ||
    value.data?.videoUrl ||
    value.data?.video_url ||
    value.data?.downloadUrl ||
    value.data?.download_url ||
    value.result?.url ||
    value.result?.videoUrl ||
    value.result?.video_url ||
    value.result?.downloadUrl ||
    value.result?.download_url ||
    value.data?.video?.url ||
    value.data?.video?.src ||
    value.data?.output?.url ||
    value.data?.response?.url ||
    value.result?.video?.url ||
    value.result?.output?.url;


  if (
    typeof possibleUrl === "string" &&
    (
      possibleUrl.startsWith("http://") ||
      possibleUrl.startsWith("https://")
    )
  ) {

    return possibleUrl;

  }


  return null;

}


/*
|--------------------------------------------------------------------------
| Find Status
|--------------------------------------------------------------------------
*/

function findStatus(value) {

  if (!value) {
    return null;
  }


  if (typeof value === "string") {

    return value.toLowerCase();

  }


  return (
    value.status ||
    value.state ||
    value.data?.status ||
    value.data?.state ||
    value.result?.status ||
    value.result?.state ||
    null
  )?.toLowerCase();

}


/*
|--------------------------------------------------------------------------
| Failed Status
|--------------------------------------------------------------------------
*/

function isFailedStatus(status) {

  if (!status) {
    return false;
  }


  return [
    "failed",
    "failure",
    "error",
    "cancelled",
    "canceled"
  ].includes(
    status.toLowerCase()
  );

}


/*
|--------------------------------------------------------------------------
| Completed Render
|--------------------------------------------------------------------------
*/

function handleCompletedRender(
  normalized
) {

  clearPolling();


  const videoUrl =
    normalized.videoUrl;


  sessionStorage.setItem(
    "johnny-result-video-url",
    videoUrl
  );


  setStatus(
    "Video ready"
  );


  showVideo(
    videoUrl
  );


  showInfo();


  showActions();

}


/*
|--------------------------------------------------------------------------
| Show Video
|--------------------------------------------------------------------------
*/

function showVideo(
  videoUrl
) {

  const video =
    document.getElementById(
      "result-video"
    );


  const loading =
    document.getElementById(
      "result-loading"
    );


  if (!video) {
    return;
  }


  video.src =
    videoUrl;


  video.classList.remove(
    "hidden"
  );


  loading?.classList.add(
    "hidden"
  );


  video.load();

}


/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

function setProviderName(
  provider
) {

  const element =
    document.getElementById(
      "result-provider"
    );


  if (!element) {
    return;
  }


  const names = {

    json2video:
      "JSON2Video",

    shotstack:
      "Shotstack"

  };


  element.textContent =
    names[provider] ||
    provider;

}


/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

function setStatus(
  status
) {

  const statusText =
    document.getElementById(
      "result-status-text"
    );


  const state =
    document.getElementById(
      "result-state"
    );


  if (statusText) {

    statusText.textContent =
      status;

  }


  if (state) {

    state.textContent =
      status;

  }

}


/*
|--------------------------------------------------------------------------
| Show Information
|--------------------------------------------------------------------------
*/

function showInfo() {

  document
    .getElementById(
      "result-info"
    )
    ?.classList.remove(
      "hidden"
    );

}


/*
|--------------------------------------------------------------------------
| Show Actions
|--------------------------------------------------------------------------
*/

function showActions() {

  document
    .getElementById(
      "result-actions"
    )
    ?.classList.remove(
      "hidden"
    );

}


/*
|--------------------------------------------------------------------------
| Back Button
|--------------------------------------------------------------------------
*/

function setupBackButton() {

  document
    .getElementById(
      "back-home"
    )
    ?.addEventListener(
      "click",
      () => {

        clearPolling();

        window.location.hash =
          "home";

      }
    );

}


/*
|--------------------------------------------------------------------------
| Actions
|--------------------------------------------------------------------------
*/

function setupActions() {

  document
    .getElementById(
      "download-video"
    )
    ?.addEventListener(
      "click",
      downloadVideo
    );


  document
    .getElementById(
      "edit-result"
    )
    ?.addEventListener(
      "click",
      () => {

        const videoUrl =
          sessionStorage.getItem(
            "johnny-result-video-url"
          );


        if (!videoUrl) {
          return;
        }


        sessionStorage.setItem(
          "johnny-edit-video-url",
          videoUrl
        );


        window.location.hash =
          "editor";

      }
    );


  document
    .getElementById(
      "generate-another"
    )
    ?.addEventListener(
      "click",
      () => {

        clearPolling();

        sessionStorage.removeItem(
          "johnny-editor-result"
        );

        sessionStorage.removeItem(
          "johnny-result-video-url"
        );

        window.location.hash =
          "generator";

      }
    );

}


/*
|--------------------------------------------------------------------------
| Download Video
|--------------------------------------------------------------------------
*/

async function downloadVideo() {

  const videoUrl =
    sessionStorage.getItem(
      "johnny-result-video-url"
    );


  if (!videoUrl) {
    return;
  }


  const button =
    document.getElementById(
      "download-video"
    );


  if (button) {
    button.disabled = true;
  }


  try {

    /*
     * Try direct download first.
     */

    const response =
      await fetch(
        videoUrl
      );


    if (!response.ok) {
      throw new Error(
        "Download request failed."
      );
    }


    const blob =
      await response.blob();


    const blobUrl =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      blobUrl;


    link.download =
      "johnny-tec-os-video.mp4";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      blobUrl
    );


  } catch (error) {

    console.error(
      "Download failed:",
      error
    );


    /*
     * Fallback:
     * open the provider URL.
     */

    window.open(
      videoUrl,
      "_blank",
      "noopener,noreferrer"
    );

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}


/*
|--------------------------------------------------------------------------
| Retry
|--------------------------------------------------------------------------
*/

function setupRetry() {

  document
    .getElementById(
      "retry-result"
    )
    ?.addEventListener(
      "click",
      () => {

        hideError();

        startPolling();

      }
    );

}


/*
|--------------------------------------------------------------------------
| Error
|--------------------------------------------------------------------------
*/

function showError(
  message
) {

  clearPolling();


  const loading =
    document.getElementById(
      "result-loading"
    );


  const errorBox =
    document.getElementById(
      "result-error"
    );


  const errorMessage =
    document.getElementById(
      "result-error-message"
    );


  loading?.classList.add(
    "hidden"
  );


  errorBox?.classList.remove(
    "hidden"
  );


  if (errorMessage) {

    errorMessage.textContent =
      message;

  }

}


/*
|--------------------------------------------------------------------------
| Hide Error
|--------------------------------------------------------------------------
*/

function hideError() {

  document
    .getElementById(
      "result-error"
    )
    ?.classList.add(
      "hidden"
    );


  document
    .getElementById(
      "result-loading"
    )
    ?.classList.remove(
      "hidden"
    );

}


/*
|--------------------------------------------------------------------------
| Clear Polling
|--------------------------------------------------------------------------
*/

function clearPolling() {

  if (pollTimer) {

    clearTimeout(
      pollTimer
    );

    pollTimer = null;

  } 

}
