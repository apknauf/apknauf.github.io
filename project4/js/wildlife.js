'use strict';

/**
 * Wildlife Explorer: a single-page, two-step interaction.
 * Step 1 shows the categories, step 2 shows the animals in a category,
 * and the final view shows everything about one animal. All views are
 * built with DOM manipulation from data loaded out of data/wildlife.json.
 */

const DATA_URL = 'data/wildlife.json';
const EXPLORER_ID = 'explorer';
const SITE_NAME = 'Amazon Rainforest Explorer';
const TEXT_SECTIONS = [
  { heading: 'Habitat', key: 'habitat' },
  { heading: 'Diet', key: 'diet' },
  { heading: 'Behavior', key: 'behavior' },
  { heading: 'Geographic Range', key: 'range' },
  { heading: 'Conservation', key: 'conservation' }
];

/**
 * Builds an element. children may be elements or strings (turned into text nodes).
 * options: className, text, attributes (object), onClick (function).
 */
function createElement(tagName, options = {}, children = []) {
  const element = document.createElement(tagName);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text !== undefined) {
    element.textContent = options.text;
  }
  Object.entries(options.attributes || {}).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  if (options.onClick) {
    element.addEventListener('click', options.onClick);
  }
  children.forEach((child) => {
    element.append(child);
  });
  return element;
}

// Finds an animal (and the category that holds it) by its id.
function findAnimalById(data, animalId) {
  for (const category of data.categories) {
    const animal = category.animals.find((item) => item.id === animalId);
    if (animal) {
      return { category, animal };
    }
  }
  return null;
}

// Replaces a broken image with a short text note so the layout stays intact.
function handleImageError(event) {
  const note = createElement('p', {
    className: 'image-fallback',
    text: `Image unavailable: ${event.target.alt}`
  });
  event.target.replaceWith(note);
}

function createImage(image) {
  return createElement('img', {
    attributes: { src: image.url, alt: image.alt, loading: 'lazy' }
  });
}

// Creates the captioned photo with its credit and source link.
function createFigure(animal) {
  const image = createImage(animal.image);
  image.addEventListener('error', handleImageError);
  const sourceLink = createElement('a', {
    text: 'Source',
    attributes: { href: animal.image.sourceUrl, target: '_blank', rel: 'noopener' }
  });
  const credit = createElement('small', {}, [`${animal.image.credit} `, sourceLink]);
  const caption = createElement('figcaption', {}, [
    `${animal.name} image`,
    createElement('br'),
    credit
  ]);
  return createElement('figure', { className: 'media-card' }, [image, caption]);
}

function createPill(label) {
  return createElement('span', { className: 'pill', text: label });
}

function createNotice(label, message) {
  return createElement('div', { className: 'notice' }, [
    createElement('strong', { text: label }),
    ` ${message}`
  ]);
}

/**
 * Creates the breadcrumb trail. Each item is { label, onSelect }.
 * Items with href become links, items with onSelect become buttons; the last item is plain text.
 */
function createBreadcrumbs(trail) {
  const breadcrumbs = createElement('div', { className: 'breadcrumbs' });
  trail.forEach((item, index) => {
    if (index > 0) {
      breadcrumbs.append(' / ');
    }
    if (item.href) {
      breadcrumbs.append(createElement('a', { text: item.label, attributes: { href: item.href } }));
    } else if (item.onSelect) {
      breadcrumbs.append(createElement('button', {
        className: 'breadcrumb-button',
        text: item.label,
        attributes: { type: 'button' },
        onClick: item.onSelect
      }));
    } else {
      breadcrumbs.append(createElement('span', {
        text: item.label,
        attributes: { 'aria-current': 'page' }
      }));
    }
  });
  return breadcrumbs;
}

/**
 * Creates a card with a picture, title, text and one action button.
 * options: image, pillLabel, title, text, buttonLabel, buttonDescription, onSelect.
 */
function createCard(options) {
  const content = createElement('div', { className: 'content' }, [
    createPill(options.pillLabel),
    createElement('h2', { text: options.title }),
    createElement('p', { text: options.text }),
    createElement('button', {
      className: 'card-link explorer-button',
      text: options.buttonLabel,
      attributes: { type: 'button', 'aria-label': options.buttonDescription },
      onClick: options.onSelect
    })
  ]);
  const card = createElement('article', { className: 'animal-card' });
  if (options.image) {
    const image = createImage(options.image);
    image.addEventListener('error', handleImageError);
    card.append(image);
  }
  card.append(content);
  return card;
}

function createAnimalCard(animal, category, onSelect) {
  return createCard({
    image: animal.image,
    pillLabel: category.name,
    title: animal.name,
    text: animal.summary,
    buttonLabel: 'View Animal',
    buttonDescription: `View ${animal.name}`,
    onSelect
  });
}

// A category card borrows the first animal's photo as its cover image.
function createCategoryCard(category, onSelect) {
  const count = category.animals.length;
  return createCard({
    image: category.animals[0] ? category.animals[0].image : null,
    pillLabel: `${count} ${count === 1 ? 'animal' : 'animals'}`,
    title: category.name,
    text: category.description,
    buttonLabel: `Explore ${category.name}`,
    buttonDescription: `Explore ${category.name}`,
    onSelect
  });
}

function createInfoPanel(heading, text) {
  return createElement('article', { className: 'panel' }, [
    createElement('h2', { text: heading }),
    createElement('p', { text })
  ]);
}

function createQuickFactsPanel(quickFacts) {
  const facts = quickFacts.map((fact) => createElement('li', { text: fact }));
  return createElement('article', { className: 'panel' }, [
    createElement('h2', { text: 'Quick Facts' }),
    createElement('ul', { className: 'fact-list' }, facts)
  ]);
}

/**
 * Swaps the explorer contents for a new view, updates the tab title, and
 * (after the first view) moves focus to the heading so screen readers
 * announce the change.
 */
function renderView(root, title, nodes, shouldMoveFocus) {
  root.replaceChildren(...nodes);
  document.title = `${title} | ${SITE_NAME}`;
  const heading = root.querySelector('h1');
  if (heading && shouldMoveFocus) {
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}

// Final view: every detail for one animal.
function showAnimalDetail(context, category, animal) {
  const hero = createElement('div', { className: 'animal-hero' }, [
    createElement('div', { className: 'image-wrap' }, [createFigure(animal)]),
    createElement('div', { className: 'panel' }, [
      createPill(category.name),
      createElement('h1', { text: animal.name }),
      createElement('p', {}, [createElement('em', { text: animal.scientificName })]),
      createElement('p', { text: animal.summary }),
      createElement('button', {
        className: 'button-link explorer-button',
        text: `Back to ${category.name}`,
        attributes: { type: 'button' },
        onClick: () => showAnimals(context, category, true)
      })
    ])
  ]);
  const panels = TEXT_SECTIONS.map((section) => createInfoPanel(section.heading, animal[section.key]));
  panels.push(createQuickFactsPanel(animal.quickFacts));
  const trail = [
    { label: 'Wildlife Explorer', onSelect: () => showCategories(context, true) },
    { label: category.name, onSelect: () => showAnimals(context, category, true) },
    { label: animal.name }
  ];
  renderView(context.root, animal.name, [
    createBreadcrumbs(trail),
    hero,
    createElement('div', { className: 'info-grid' }, panels)
  ], true);
}

// Step 2: the animals in one category.
function showAnimals(context, category, shouldMoveFocus) {
  const cards = category.animals.map((animal) =>
    createAnimalCard(animal, category, () => showAnimalDetail(context, category, animal))
  );
  const trail = [
    { label: 'Wildlife Explorer', onSelect: () => showCategories(context, true) },
    { label: category.name }
  ];
  renderView(context.root, category.name, [
    createBreadcrumbs(trail),
    createElement('div', { className: 'section-heading' }, [
      createElement('h1', { text: category.name }),
      createElement('p', { text: category.description })
    ]),
    createNotice('Step 2:', 'Choose one animal below to view its information page.'),
    createElement('div', { className: 'animal-grid' }, cards)
  ], shouldMoveFocus);
}

// Step 1: the list of categories.
function showCategories(context, shouldMoveFocus) {
  const cards = context.data.categories.map((category) =>
    createCategoryCard(category, () => showAnimals(context, category, true))
  );
  renderView(context.root, 'Wildlife Explorer', [
    createBreadcrumbs([{ label: 'Home', href: 'index.html' }, { label: 'Wildlife Explorer' }]),
    createElement('div', { className: 'section-heading' }, [
      createElement('h1', { text: 'Wildlife Explorer' }),
      createElement('p', { text: 'Start with one of the animal groups. Your next choice will depend on the group you select.' })
    ]),
    createNotice('Step 1:', 'Choose a category. In the next step, you will see the animals in that category.'),
    createElement('div', { className: 'animal-grid' }, cards)
  ], shouldMoveFocus);
}

// Fetches and validates the JSON file. Throws if the request or data is bad.
async function fetchWildlifeData() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`The data file could not be loaded (status ${response.status}).`);
  }
  const data = await response.json();
  if (!Array.isArray(data.categories) || data.categories.length === 0) {
    throw new Error('The data file does not contain any categories.');
  }
  return data;
}

function showLoading(root) {
  root.replaceChildren(createElement('p', {
    className: 'notice',
    text: 'Loading wildlife data…',
    attributes: { role: 'status' }
  }));
}

// Explains the problem and offers a retry button.
function showError(root, onRetry) {
  root.replaceChildren(createElement('div', {
    className: 'notice error-message',
    attributes: { role: 'alert' }
  }, [
    createElement('p', {
      text: 'The wildlife data could not be loaded. Check your internet connection and try again.'
    }),
    createElement('button', {
      className: 'button-link explorer-button',
      text: 'Try again',
      attributes: { type: 'button' },
      onClick: onRetry
    })
  ]));
}

/**
 * Opens straight to an animal when the page address ends in its id
 * (for example wildlife.html#jaguar); otherwise starts at the categories.
 */
function showStartingView(context) {
  const match = findAnimalById(context.data, window.location.hash.slice(1));
  if (match) {
    showAnimalDetail(context, match.category, match.animal);
  } else {
    showCategories(context, false);
  }
}

// Loads the data, then shows the first view (or the error message).
async function loadExplorer(root) {
  showLoading(root);
  try {
    const data = await fetchWildlifeData();
    showStartingView({ root, data });
  } catch (error) {
    showError(root, () => loadExplorer(root));
  }
}

function initExplorer() {
  const root = document.getElementById(EXPLORER_ID);
  if (root) {
    loadExplorer(root);
  }
}

document.addEventListener('DOMContentLoaded', initExplorer);
