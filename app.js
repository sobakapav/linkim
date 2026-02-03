const SURFACES = [
  {
    id: "feed-desktop",
    width: 560,
    minHeight: 280,
    maxHeight: 640,
    textLines: 3,
  },
  {
    id: "feed-mobile",
    width: 360,
    minHeight: 220,
    maxHeight: 520,
    textLines: 4,
  },
  {
    id: "profile",
    width: 620,
    minHeight: 280,
    maxHeight: 640,
    textLines: 3,
  },
  {
    id: "repost",
    width: 520,
    minHeight: 240,
    maxHeight: 520,
    textLines: 3,
  },
  {
    id: "permalink",
    width: 720,
    minHeight: 320,
    maxHeight: 720,
    textLines: 5,
  },
];

const fileInput = document.getElementById("file-input");
const imageMeta = document.getElementById("image-meta");
const postTextInput = document.getElementById("post-text");
const textMeta = document.getElementById("text-meta");
const surfaces = Array.from(document.querySelectorAll(".surface"));

let activeObjectUrl = null;

function updateMeta(label) {
  imageMeta.textContent = label;
}

function clearImages() {
  surfaces.forEach((surface) => {
    const media = surface.querySelector("[data-media]");
    if (!media) return;
    media.innerHTML = "";
    media.style.height = "";
    media.style.removeProperty("--media-url");
    media.classList.remove("has-image");
  });
}

function measureFullTextHeight(referenceElement, text) {
  const measurer = document.createElement("div");
  const styles = window.getComputedStyle(referenceElement);

  measurer.textContent = text;
  measurer.style.position = "absolute";
  measurer.style.visibility = "hidden";
  measurer.style.pointerEvents = "none";
  measurer.style.width = referenceElement.clientWidth + "px";
  measurer.style.fontFamily = styles.fontFamily;
  measurer.style.fontSize = styles.fontSize;
  measurer.style.lineHeight = styles.lineHeight;
  measurer.style.whiteSpace = "pre-wrap";
  measurer.style.wordBreak = "break-word";

  document.body.appendChild(measurer);
  const height = measurer.scrollHeight;
  document.body.removeChild(measurer);
  return height;
}

function updateTextForSurface(surface, text) {
  const config = SURFACES.find((item) => item.id === surface.dataset.surfaceId);
  if (!config) return;

  const postText = surface.querySelector("[data-post-text]");
  if (!postText) return;

  postText.style.setProperty("--line-clamp", config.textLines);
  postText.textContent = text;

  if (!text.trim()) {
    postText.classList.remove("is-truncated");
    return;
  }

  const lineHeight = parseFloat(window.getComputedStyle(postText).lineHeight);
  const maxHeight = lineHeight * config.textLines;
  const fullHeight = measureFullTextHeight(postText, text);

  if (fullHeight > maxHeight + 1) {
    postText.classList.add("is-truncated");
  } else {
    postText.classList.remove("is-truncated");
  }
}

function applyImageToSurface(surface, objectUrl, ratio) {
  const config = SURFACES.find((item) => item.id === surface.dataset.surfaceId);
  if (!config) return;

  const media = surface.querySelector("[data-media]");
  if (!media) return;

  const img = document.createElement("img");
  img.src = objectUrl;

  const desiredHeight = config.width / ratio;
  let finalHeight = desiredHeight;
  let fitMode = "contain";

  if (desiredHeight < config.minHeight) {
    finalHeight = config.minHeight;
    fitMode = "cover";
  }

  if (desiredHeight > config.maxHeight) {
    finalHeight = config.maxHeight;
    fitMode = "cover";
  }

  media.style.height = `${Math.round(finalHeight)}px`;
  img.style.objectFit = fitMode;

  media.innerHTML = "";
  media.appendChild(img);
  media.style.setProperty("--media-url", `url('${objectUrl}')`);
  media.classList.add("has-image");

  const shell = surface.querySelector(".li-shell");
  if (shell) {
    shell.style.setProperty("--card-width", `${config.width}px`);
  }
}

function updateAllSurfaces(objectUrl, image) {
  const ratio = image.width / image.height;
  surfaces.forEach((surface) => applyImageToSurface(surface, objectUrl, ratio));
}

function updateAllText() {
  const text = postTextInput.value || "";
  textMeta.textContent = `${text.length} символов`;
  surfaces.forEach((surface) => updateTextForSurface(surface, text));
}

fileInput.addEventListener("change", () => {
  const [file] = fileInput.files || [];
  if (!file) {
    updateMeta("Нет файла");
    clearImages();
    return;
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
  }

  activeObjectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    updateMeta(`${file.name} · ${image.width}×${image.height}px`);
    updateAllSurfaces(activeObjectUrl, image);
  };
  image.src = activeObjectUrl;
});

updateMeta("Нет файла");
updateAllText();

postTextInput.addEventListener("input", () => {
  updateAllText();
});
