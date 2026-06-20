import { uploadImage } from "../../_lib/images.js";

export function onRequestPost(context) {
  return uploadImage(context, "products");
}
