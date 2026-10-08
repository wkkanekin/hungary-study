(() => {
  "use strict";
  async function loadImages() {
    try {
      const response = await fetch("basics-hungary.images.json", {cache:"no-store"});
      if (!response.ok) return;
      const data = await response.json();
      const images = data.images || {};
      document.querySelectorAll("[data-basic-image]").forEach(img => {
        const entry = images[img.dataset.basicImage];
        if (!entry) return;
        if (typeof entry.url === "string" && entry.url) img.src = entry.url;
        if (typeof entry.alt === "string" && entry.alt) img.alt = entry.alt;
      });
    } catch (_) {
      // The HTML already includes the existing image paths and descriptions.
    }
  }
  loadImages();
})();