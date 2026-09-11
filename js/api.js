/* ========================================
   Johnny Tec OS
   API Client
======================================== */

const API_BASE_URL =
  "https://j-tec-video-production-backend.onrender.com";


/*
|--------------------------------------------------------------------------
| Generic API request
|--------------------------------------------------------------------------
*/

async function request(
  endpoint,
  options = {}
) {

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );


  const contentType =
    response.headers.get("content-type") || "";


  const data =
    contentType.includes("application/json")
      ? await response.json()
      : await response.text();


  if (!response.ok) {

    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed: ${response.status}`
    );

  }


  return data;

}


/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

export async function checkHealth() {

  return request(
    "/api/health"
  );

}


/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
*/

export async function getProviders() {

  return request(
    "/api/providers"
  );

}


/*
|--------------------------------------------------------------------------
| Generate video
|--------------------------------------------------------------------------
*/

export async function generateVideo({
  generator,
  prompt,
  input = {}
}) {

  return request(
    "/api/video/generate",
    {
      method: "POST",

      body: JSON.stringify({
        generator,
        prompt,
        input
      })
    }
  );

}


/*
|--------------------------------------------------------------------------
| Edit video
|--------------------------------------------------------------------------
*/

export async function editVideo({
  editor,
  videoUrl,
  settings = {}
}) {

  return request(
    "/api/video/edit",
    {
      method: "POST",

      body: JSON.stringify({
        editor,
        videoUrl,
        settings
      })
    }
  );

}


/*
|--------------------------------------------------------------------------
| Generate and edit
|--------------------------------------------------------------------------
*/

export async function generateAndEditVideo({
  generator,
  editor,
  prompt,
  generationInput = {},
  edit = {}
}) {

  return request(
    "/api/video/generate-and-edit",
    {
      method: "POST",

      body: JSON.stringify({
        generator,
        editor,
        prompt,
        generationInput,
        edit
      })
    }
  );

}


/*
|--------------------------------------------------------------------------
| Provider settings
|--------------------------------------------------------------------------
*/

export async function getProviderSettings(
  provider
) {

  return request(
    `/api/settings/${encodeURIComponent(provider)}`
  );

}


/*
|--------------------------------------------------------------------------
| Upload URL
|--------------------------------------------------------------------------
*/

export async function createUploadUrl({
  provider,
  name,
  contentType,
  size
}) {

  return request(
    "/api/upload/url",
    {
      method: "POST",

      body: JSON.stringify({
        provider,
        name,
        contentType,
        size
      })
    }
  );

}


/*
|--------------------------------------------------------------------------
| Shotstack upload status
|--------------------------------------------------------------------------
*/

export async function getShotstackUploadStatus(
  id
) {

  return request(
    `/api/upload/shotstack/${encodeURIComponent(id)}`
  );

}


/*
|--------------------------------------------------------------------------
| JSON2Video render status
|--------------------------------------------------------------------------
*/

export async function getJson2VideoRender(
  projectId
) {

  return request(
    `/api/editors/json2video/render/${encodeURIComponent(projectId)}`
  );

}


/*
|--------------------------------------------------------------------------
| Shotstack render status
|--------------------------------------------------------------------------
*/

export async function getShotstackRender(
  renderId
) {

  return request(
    `/api/editors/shotstack/render/${encodeURIComponent(renderId)}`
  );

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export {
  API_BASE_URL
};
