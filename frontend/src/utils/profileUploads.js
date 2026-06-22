import { apiFetch } from "../api/api";

async function uploadProfileFile(userEmail, file, endpoint, responseKey) {
  const formData = new FormData();
  formData.append("file", file);

  const { response, data } = await apiFetch(`/auth/user/${userEmail}/${endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(data?.detail || "Could not upload file.");
  }

  return data[responseKey];
}

export function uploadProfileLogo(userEmail, file) {
  return uploadProfileFile(userEmail, file, "upload-logo", "logo_url");
}

export function uploadProfileCover(userEmail, file) {
  return uploadProfileFile(userEmail, file, "upload-cover", "cover_image_url");
}

export async function uploadProfileGallery(userEmail, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { response, data } = await apiFetch(`/auth/user/${userEmail}/upload-gallery`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(data?.detail || "Could not upload gallery.");
  }

  return data.gallery_images || [];
}
