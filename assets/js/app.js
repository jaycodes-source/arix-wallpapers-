
/* =========================================================
   ARIX WALLPAPERS — MAIN APPLICATION
   File: assets/js/app.js
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("wallpaper-grid");
  const categoryList = document.getElementById("category-list");
  const searchInput = document.getElementById("wallpaper-search");
  const orientationFilter = document.getElementById("orientation-filter");
  const sortFilter = document.getElementById("sort-filter");
  const resultsCount = document.getElementById("results-count");
  const emptyState = document.getElementById("empty-state");
  const favoritesToggle = document.getElementById("favorites-toggle");
  const mobileFavorites = document.getElementById("mobile-favorites");
  const clearFilters = document.getElementById("clear-filters");

  const dialog = document.getElementById("preview-dialog");
  const closePreview = document.getElementById("close-preview");
  const previewImage = document.getElementById("preview-image");
  const previewTitle = document.getElementById("preview-title");
  const previewCategory = document.getElementById("preview-category");
  const previewResolution = document.getElementById("preview-resolution");
  const previewOrientation = document.getElementById("preview-orientation");
  const downloadButton = document.getElementById("download-wallpaper");
  const previewFavorite = document.getElementById("preview-favorite");
  const toast = document.getElementById("toast");

  if (!gallery || !categoryList || typeof wallpapers === "undefined") {
    console.error("ARIX: Gallery or wallpaper data could not be loaded.");
    return;
  }

  let selectedCategory = "All";
  let favoritesOnly = false;
  let currentWallpaper = null;
  let toastTimer;

  let favorites = [];

  try {
    const savedFavorites = JSON.parse(
      localStorage.getItem("arix-favorites") || "[]"
    );

    if (Array.isArray(savedFavorites)) {
      favorites = savedFavorites;
    }
  } catch {
    favorites = [];
  }

  const getWallpaper = (id) =>
    wallpapers.find((wallpaper) => wallpaper.id === Number(id));

  function showToast(message) {
    if (!toast) return;

    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  function saveFavorites() {
    try {
      localStorage.setItem("arix-favorites", JSON.stringify(favorites));
    } catch {
      showToast("Favorites could not be saved on this device.");
    }
  }

  function isFavorite(id) {
    return favorites.includes(Number(id));
  }

  function toggleFavorite(id) {
    id = Number(id);

    if (isFavorite(id)) {
      favorites = favorites.filter((favoriteId) => favoriteId !== id);
      showToast("Removed from favorites");
    } else {
      favorites.push(id);
      showToast("Added to favorites");
    }

    saveFavorites();
    updateFavoriteButtons();
    renderGallery();

    if (currentWallpaper && currentWallpaper.id === id) {
      updatePreviewFavorite();
    }
  }

  function updateFavoriteButtons() {
    document.querySelectorAll("[data-favorite-id]").forEach((button) => {
      const active = isFavorite(button.dataset.favoriteId);

      button.classList.toggle("is-favorite", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute(
        "aria-label",
        active ? "Remove from favorites" : "Add to favorites"
      );

      button.textContent = active ? "♥" : "♡";
    });

    if (favoritesToggle) {
      favoritesToggle.classList.toggle("is-active", favoritesOnly);
      favoritesToggle.setAttribute("aria-pressed", String(favoritesOnly));
    }

    if (mobileFavorites) {
      mobileFavorites.classList.toggle("is-active", favoritesOnly);
      mobileFavorites.setAttribute("aria-pressed", String(favoritesOnly));
    }
  }

  function renderCategories() {
    const categories = [
      "All",
      ...new Set(wallpapers.map((wallpaper) => wallpaper.category))
    ];

    categoryList.innerHTML = categories
      .map((category) => {
        const active = category === selectedCategory;

        return `
          <button
            type="button"
            class="category-chip ${active ? "is-active" : ""}"
            data-category="${escapeHTML(category)}"
            aria-pressed="${active}"
          >
            ${escapeHTML(category)}
          </button>
        `;
      })
      .join("");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function getFilteredWallpapers() {
    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const orientation = orientationFilter
      ? orientationFilter.value
      : "all";

    let filtered = wallpapers.filter((wallpaper) => {
      const matchesCategory =
        selectedCategory === "All" ||
        wallpaper.category === selectedCategory;

      const matchesSearch =
        wallpaper.title.toLowerCase().includes(query) ||
        wallpaper.category.toLowerCase().includes(query);

      const matchesOrientation =
        !orientation ||
        orientation.toLowerCase() === "all" ||
        wallpaper.orientation.toLowerCase() ===
          orientation.toLowerCase();

      const matchesFavorites =
        !favoritesOnly || isFavorite(wallpaper.id);

      return (
        matchesCategory &&
        matchesSearch &&
        matchesOrientation &&
        matchesFavorites
      );
    });

    const sortMode = sortFilter ? sortFilter.value : "default";

    if (sortMode === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === "title-desc") {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortMode === "favorites") {
      filtered.sort(
        (a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id))
      );
    } else if (sortMode === "featured") {
      filtered.sort(
        (a, b) => Number(b.featured) - Number(a.featured)
      );
    }

    return filtered;
  }

  function createWallpaperCard(wallpaper) {
    const favorite = isFavorite(wallpaper.id);

    return `
      <article class="wallpaper-card" data-wallpaper-id="${wallpaper.id}">
        <div class="wallpaper-image-wrap">
          <img
            class="wallpaper-image"
            src="${escapeHTML(wallpaper.image)}"
            alt="${escapeHTML(wallpaper.title)} wallpaper"
            loading="lazy"
            decoding="async"
          >

          ${
            wallpaper.featured
              ? '<span class="wallpaper-badge">FEATURED</span>'
              : ""
          }

          <button
            type="button"
            class="favorite-button ${favorite ? "is-favorite" : ""}"
            data-favorite-id="${wallpaper.id}"
            aria-label="${favorite ? "Remove from favorites" : "Add to favorites"}"
            aria-pressed="${favorite}"
          >${favorite ? "♥" : "♡"}</button>
        </div>

        <div class="wallpaper-card-content">
          <h3 class="wallpaper-card-title">
            ${escapeHTML(wallpaper.title)}
          </h3>

          <div class="wallpaper-card-meta">
            <span class="wallpaper-card-category">
              ${escapeHTML(wallpaper.category)}
            </span>
            <span class="wallpaper-resolution">
              ${escapeHTML(wallpaper.resolution)}
            </span>
          </div>

          <div class="wallpaper-card-actions">
            <button
              type="button"
              class="card-preview-button"
              data-preview-id="${wallpaper.id}"
            >Preview</button>

            <button
              type="button"
              class="card-download-button"
              data-download-id="${wallpaper.id}"
            >Download ↓</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderGallery() {
    const filtered = getFilteredWallpapers();

    gallery.innerHTML = filtered.map(createWallpaperCard).join("");

    if (resultsCount) {
      resultsCount.textContent =
        `${filtered.length} wallpaper${filtered.length === 1 ? "" : "s"}`;
    }

    if (emptyState) {
      emptyState.hidden = filtered.length > 0;
    }

    updateFavoriteButtons();
  }

  function updatePreviewFavorite() {
    if (!previewFavorite || !currentWallpaper) return;

    const active = isFavorite(currentWallpaper.id);

    previewFavorite.classList.toggle("is-favorite", active);
    previewFavorite.setAttribute("aria-pressed", String(active));
    previewFavorite.textContent = active
      ? "♥ Saved"
      : "♡ Add to favorites";
  }

  function openPreview(id) {
    const wallpaper = getWallpaper(id);
    if (!wallpaper || !dialog) return;

    currentWallpaper = wallpaper;

    if (previewImage) {
      previewImage.src = wallpaper.image;
      previewImage.alt = wallpaper.title;
    }

    if (previewTitle) {
      previewTitle.textContent = wallpaper.title;
    }

    if (previewCategory) {
      previewCategory.textContent = wallpaper.category;
    }

    if (previewResolution) {
      previewResolution.textContent = wallpaper.resolution;
    }

    if (previewOrientation) {
      previewOrientation.textContent = wallpaper.orientation;
    }

    updatePreviewFavorite();

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closePreviewDialog() {
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function downloadWallpaper(id) {
    const wallpaper = getWallpaper(id);
    if (!wallpaper) return;

    const link = document.createElement("a");
    link.href = wallpaper.download;
    link.download = `arix-${wallpaper.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.jpg`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast("Opening wallpaper download...");
  }

  categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    selectedCategory = button.dataset.category;
    renderCategories();
    renderGallery();
  });

  gallery.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite-id]");
    const previewButton = event.target.closest("[data-preview-id]");
    const downloadButton = event.target.closest("[data-download-id]");

    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.favoriteId);
    } else if (previewButton) {
      openPreview(previewButton.dataset.previewId);
    } else if (downloadButton) {
      downloadWallpaper(downloadButton.dataset.downloadId);
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", renderGallery);
  }

  if (orientationFilter) {
    orientationFilter.addEventListener("change", renderGallery);
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", renderGallery);
  }

  function toggleFavoritesView() {
    favoritesOnly = !favoritesOnly;
    renderGallery();
    showToast(favoritesOnly ? "Showing your favorites" : "Showing all wallpapers");
  }

  if (favoritesToggle) {
    favoritesToggle.addEventListener("click", toggleFavoritesView);
  }

  if (mobileFavorites) {
    mobileFavorites.addEventListener("click", toggleFavoritesView);
  }

  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (orientationFilter) orientationFilter.value = "all";
      if (sortFilter) sortFilter.value = "default";

      selectedCategory = "All";
      favoritesOnly = false;

      renderCategories();
      renderGallery();
      showToast("Filters cleared");
    });
  }

  const resetGallery = document.getElementById("reset-gallery");

  if (resetGallery) {
    resetGallery.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (orientationFilter) orientationFilter.value = "all";
      if (sortFilter) sortFilter.value = "default";

      selectedCategory = "All";
      favoritesOnly = false;

      renderCategories();
      renderGallery();
    });
  }

  if (closePreview) {
    closePreview.addEventListener("click", closePreviewDialog);
  }

  if (dialog) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closePreviewDialog();
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      if (currentWallpaper) {
        downloadWallpaper(currentWallpaper.id);
      }
    });
  }

  if (previewFavorite) {
    previewFavorite.addEventListener("click", () => {
      if (currentWallpaper) {
        toggleFavorite(currentWallpaper.id);
      }
    });
  }

  const libraryButton = document.getElementById("library-button");

  if (libraryButton) {
    libraryButton.addEventListener("click", () => {
      favoritesOnly = true;
      renderGallery();

      const gallerySection = document.getElementById("wallpaper-gallery");

      if (gallerySection) {
        gallerySection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      showToast("Your saved wallpapers");
    });
  }

  const profileButton = document.getElementById("profile-button");

  if (profileButton) {
    profileButton.addEventListener("click", () => {
      showToast("Profiles will be available in a future update.");
    });
  }

  const currentYear = document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  renderCategories();
  renderGallery();

  console.log("ARIX Wallpapers initialized successfully.");
});
