async function loadBoardingData() {
  try {
    const response = await fetch("js/boardingData.json");

    if (!response.ok) {
      throw new Error(`Could not load JSON data (${response.status}).`);
    }

    const data = await response.json();
    updatePage(data);
  } catch (error) {
    console.error("Error loading snowboarding information:", error);
  }
}

function updatePage(data) {
  document.title = data.title;

  document.getElementById("styleName").textContent = data.header;
  document.getElementById("heroTitle").textContent = data.hero.headline;
  document.getElementById("heroDesc").textContent = data.hero.description;

  document.getElementById("sec1Title").textContent =
    data.sections.overview.title;
  document.getElementById("sec1Subtitle").textContent =
    data.sections.overview.subtitle;

  updateCards("sec1Grid", data.sections.overview.cards);

  document.getElementById("sec2Title").textContent =
    data.sections.equipment.title;
  document.getElementById("sec2Subtitle").textContent =
    data.sections.equipment.subtitle;

  updateCards("sec2Grid", data.sections.equipment.cards);

  // The CSS custom property is on the hero element. Resolve the JSON image
  // path against the stylesheet because the original path is stylesheet-relative.
  const stylesheet = document.querySelector('link[rel="stylesheet"]');
  const imageUrl = new URL(data.hero.image, stylesheet.href);
  document.getElementById("heroSection").style.setProperty(
    "--hero-img",
    `url("${imageUrl.href}")`
  );
}

function updateCards(gridId, cards) {
  const cardElements = document.querySelectorAll(`#${gridId} .card`);

  cards.forEach((card, index) => {
    if (cardElements[index]) {
      cardElements[index].querySelector("h3").textContent = card.title;
      cardElements[index].querySelector("p").textContent = card.description;
    }
  });
}

document.addEventListener("DOMContentLoaded", loadBoardingData);
