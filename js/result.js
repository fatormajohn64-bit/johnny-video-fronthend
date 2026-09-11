let resultData = null;

export async function initResult() {
  setupBackButton();
  setupActions();

  loadResult();
}

/*
|--------------------------------------------------------------------------
| Load result
|--------------------------------------------------------------------------
*/

function loadResult() {
  const stored =
    sessionStorage.getItem(
      "johnny-generated-video"
    );

  if (!stored) {
    showMessage(
      "No generated video was found.",
      true
    );

    return;
  }

  try {
    resultData =
      JSON.parse(stored);

    const videoUrl =
      extractVideoUrl(
        resultData
      );

    if (!videoUrl) {
      showMessage(
        "The generator did not return a usable video URL.",
        true
      );

      return;
    }

    const video =
      document.getElementById(
        "generated-video"
      );

    video.src =
      videoUrl;

    document.getElementById(
      "result-generator"
    ).textContent =
      resultData.generator ||
      "Unknown";

    document.getElementById(
      "result-status"
    ).textContent =
      resultData.status ||
      "Completed";

  } catch (error) {
    console.error(
      "Failed to load result:",
      error
    );

    showMessage(
      "Unable to load the generated video.",
      true
    );
  }
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
      "edit-generated-video"
    )
    ?.addEventListener(
      "click",
      () => {
        const videoUrl =
          extractVideoUrl(
            resultData
          );

        if (!videoUrl) {
          showMessage(
            "No video URL is available.",
            true
          );

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
}

/*
|--------------------------------------------------------------------------
| Download
|--------------------------------------------------------------------------
*/

function downloadVideo() {
  const videoUrl =
    extractVideoUrl(
      resultData
    );

  if (!videoUrl) {
    showMessage(
      "No video URL is available.",
      true
    );

    return;
  }

  const link =
    document.createElement(
      "a"
    );

  link.href =
    videoUrl;

  link.download =
    "johnny-tec-os-video.mp4";

  link.target =
    "_blank";

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();
}

/*
|--------------------------------------------------------------------------
| Back
|--------------------------------------------------------------------------
*/

function setupBackButton() {
  document
    .getElementById(
      "back-generator"
    )
    ?.addEventListener(
      "click",
      () => {
        window.location.hash =
          "generator";
      }
    );
}

/*
|--------------------------------------------------------------------------
| Extract video URL
|--------------------------------------------------------------------------
*/

function extractVideoUrl(
  data
) {
  return (
    data?.result?.sourceVideo?.url ||
    data?.result?.generated?.data?.video?.url ||
    data?.result?.generated?.video?.url ||
    data?.result?.generated?.video_url ||
    data?.result?.video?.url ||
    data?.result?.video_url ||
    data?.videoUrl ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Message
|--------------------------------------------------------------------------
*/

function showMessage(
  message,
  error = false
) {
  const element =
    document.getElementById(
      "result-message"
    );

  if (!element) {
    return;
  }

  element.classList.remove(
    "hidden",
    "error"
  );

  if (error) {
    element.classList.add(
      "error"
    );
  }

  element.textContent =
    message;
}
