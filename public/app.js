const about = document.querySelector('#about');
const aboutImagesEl = document.querySelector('#about-images');
const projectsTitle = document.querySelector('#projects-title');
const projectsSection = document.querySelector('.projects');
const projectsToggle = document.querySelector('#projects-toggle');
const projectList = document.querySelector('#project-list');
const detail = document.querySelector('#project-detail');
const detailImages = document.querySelector('#project-images');
const footer = document.querySelector('#footer');
const viewControls = document.querySelectorAll('.view-control');
let aboutText = '';
let aboutTitle = '';
let aboutImages = [];
let aboutView = 'grid';
let aboutActiveImage = 0;
let activeProject = null;
let activeView = 'grid';
let activeImage = 0;
let autoplayTimer = null;
let aboutAutoplayTimer = null;

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function imageName(image) {
  return decodeURIComponent(image.split('/').pop());
}

function setProjectsMenuOpen(isOpen) {
  projectsSection.classList.toggle('is-open', isOpen);
  projectsToggle.setAttribute('aria-expanded', String(isOpen));
  projectsToggle.setAttribute('aria-label', isOpen ? 'Close projects menu' : 'Open projects menu');
  projectsToggle.textContent = isOpen ? '×' : '≡';
}

function renderAbout(title, text, showImage = true) {
  if (!showImage) {
    stopAboutAutoplay();
  }

  if (!title) {
    about.innerHTML = `<div class="about-text">${escapeHtml(text)}</div>`;
    aboutImagesEl.innerHTML = '';
    aboutImagesEl.hidden = true;
    detail.hidden = true;
    detailImages.innerHTML = '';
    return;
  }

  const titleMarkup = title.toLowerCase() === 'logo'
    ? `<a href="#top" class="about-title-link" data-home-link="true">${escapeHtml(title)}</a>`
    : `<span class="about-title-text">${escapeHtml(title)}</span>`;

  about.innerHTML = `<div class="about-title">${titleMarkup}</div><div class="about-text">${escapeHtml(text)}</div>`;

  if (showImage && aboutImages.length) {
    renderAboutImages();
  } else {
    aboutImagesEl.innerHTML = '';
    aboutImagesEl.hidden = true;
  }
}

function renderAboutImages() {
  stopAboutAutoplay();
  detail.hidden = false;
  detailImages.hidden = true;
  detailImages.innerHTML = '';
  detailImages.className = 'project-images';
  document.querySelector('#back').hidden = true;
  viewControls.forEach((control) => {
    control.hidden = true;
  });
  aboutImagesEl.hidden = false;
  aboutImagesEl.className = 'about-gallery';
  aboutImagesEl.innerHTML = `
    <div class="view-controls" aria-label="Image view">
      <button class="about-view-control view-control${aboutView === 'grid' ? ' is-active' : ''}" type="button" data-about-view="grid" aria-label="Grid view">⊞</button>
      <button class="about-view-control view-control${aboutView === 'carousel' ? ' is-active' : ''}" type="button" data-about-view="carousel" aria-label="Carousel view">⊡</button>
    </div>
    <div class="about-gallery-images project-images${aboutView === 'carousel' ? ' carousel' : ''}">
      ${aboutView === 'carousel' ? `
        <div class="carousel-frame">
          <div class="carousel-track" style="transform: translateX(-${aboutActiveImage * 100}%);">
            ${aboutImages.map((image) => `
              <div class="carousel-slide">
                <img src="${image}" alt="${escapeHtml(aboutTitle)}" draggable="false">
              </div>
            `).join('')}
          </div>
          <div class="carousel-dots" aria-label="Image selection">
            ${aboutImages.map((image, index) => `<button class="carousel-dot${index === aboutActiveImage ? ' is-active' : ''}" type="button" data-about-image="${index}" aria-label="Image ${index + 1}"></button>`).join('')}
          </div>
        </div>
        <div class="image-name">${escapeHtml(imageName(aboutImages[aboutActiveImage]))}</div>
      ` : aboutImages.map((image) => `
        <figure class="grid-image">
          <img src="${image}" alt="${escapeHtml(aboutTitle)}">
          <figcaption class="image-name">${escapeHtml(imageName(image))}</figcaption>
        </figure>
      `).join('')}
    </div>
  `;

  aboutImagesEl.querySelectorAll('[data-about-view]').forEach((control) => {
    control.addEventListener('click', () => {
      aboutView = control.dataset.aboutView;
      renderAboutImages();
    });
  });

  if (aboutView === 'carousel') {
    const gallery = aboutImagesEl.querySelector('.about-gallery-images');
    bindCarousel(
      gallery,
      () => aboutActiveImage,
      (direction) => {
        aboutActiveImage = (aboutActiveImage + direction + aboutImages.length) % aboutImages.length;
      },
      renderAboutImages,
      startAboutAutoplay,
      stopAboutAutoplay
    );
    startAboutAutoplay();
  }
}

async function loadContent() {
  const response = await fetch('/api/content');
  const content = await response.json();
  aboutText = content.about;
  aboutTitle = content.aboutTitle || '';
  aboutImages = content.aboutImages || [];
  footer.textContent = content.footer || '';
  footer.hidden = !content.footer;
  aboutView = 'grid';
  aboutActiveImage = 0;
  const { projectsTitle: title, projects } = content;
  renderAbout(aboutTitle, aboutText);
  projectsTitle.textContent = title;
  projectList.innerHTML = projects.map((project) => `
    <button class="project" type="button" data-project="${escapeHtml(project.id)}">${escapeHtml(project.id)}</button>
  `).join('');
  projectList.querySelectorAll('[data-project]').forEach((button) => {
    button.addEventListener('click', () => {
      setProjectsMenuOpen(false);
      showProject(projects.find((project) => project.id === button.dataset.project));
    });
  });
}

function showProject(project) {
  activeProject = project;
  activeImage = 0;
  activeView = 'grid';
  renderAbout(project.textTitle, project.text, false);
  aboutImagesEl.hidden = true;
  detailImages.hidden = false;
  document.querySelector('#back').hidden = false;
  viewControls.forEach((control) => {
    control.hidden = false;
  });
  renderImages();
  detail.hidden = false;
  detail.scrollIntoView({ behavior: 'smooth' });
}

function renderImages() {
  stopAutoplay();
  viewControls.forEach((control) => {
    control.classList.toggle('is-active', control.dataset.view === activeView);
  });

  if (activeView === 'carousel') {
    detailImages.className = 'project-images carousel';
    detailImages.innerHTML = `
      <div class="carousel-frame">
        <div class="carousel-track" style="transform: translateX(-${activeImage * 100}%);">
        ${activeProject.images.map((image) => `
          <div class="carousel-slide">
            <img src="${image}" alt="${escapeHtml(activeProject.id)}" draggable="false">
          </div>
        `).join('')}
        </div>
        <div class="carousel-dots" aria-label="Image selection">
          ${activeProject.images.map((image, index) => `<button class="carousel-dot${index === activeImage ? ' is-active' : ''}" type="button" data-image="${index}" aria-label="Image ${index + 1}"></button>`).join('')}
        </div>
      </div>
      <div class="image-name">${escapeHtml(imageName(activeProject.images[activeImage]))}</div>
    `;
    bindCarousel(
      detailImages,
      () => activeImage,
      moveToImage,
      renderImages,
      startAutoplay,
      stopAutoplay
    );
    startAutoplay();
    return;
  }

  detailImages.className = 'project-images';
  detailImages.innerHTML = activeProject.images.map((image) => `
    <figure class="grid-image">
      <img src="${image}" alt="${escapeHtml(activeProject.id)}">
      <figcaption class="image-name">${escapeHtml(imageName(image))}</figcaption>
    </figure>
  `).join('');
}

function startAutoplay() {
  if (!activeProject || activeProject.images.length < 2) return;
  autoplayTimer = setInterval(() => {
    activeImage = (activeImage + 1) % activeProject.images.length;
    renderImages();
  }, 3000);
}

function startAboutAutoplay() {
  if (aboutView !== 'carousel' || aboutImages.length < 2) return;
  aboutAutoplayTimer = setInterval(() => {
    aboutActiveImage = (aboutActiveImage + 1) % aboutImages.length;
    renderAboutImages();
  }, 3000);
}

function stopAutoplay() {
  clearInterval(autoplayTimer);
  autoplayTimer = null;
}

function stopAboutAutoplay() {
  clearInterval(aboutAutoplayTimer);
  aboutAutoplayTimer = null;
}

function moveToImage(direction) {
  activeImage = (activeImage + direction + activeProject.images.length) % activeProject.images.length;
}

function bindCarousel(container, getActiveImage, moveImage, render, start, stop) {
  const track = container.querySelector('.carousel-track');
  const images = [...track.querySelectorAll('img')];
  Promise.all(images.map((image) => image.decode().catch(() => undefined))).then(() => {
    const widestRatio = Math.max(...images.map((image) => image.naturalWidth / image.naturalHeight));
    const frame = container.querySelector('.carousel-frame');
    const maxHeight = frame.clientHeight * 0.75;
    const widthLimitedHeight = frame.clientWidth / widestRatio;
    container.style.setProperty('--carousel-image-height', `${Math.min(maxHeight, widthLimitedHeight)}px`);
  });

  let dragStartX = null;
  let dragOffsetX = 0;

  track.addEventListener('pointerdown', (event) => {
    stop();
    dragStartX = event.clientX;
    dragOffsetX = 0;
    track.classList.add('is-dragging');
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', (event) => {
    if (dragStartX === null) return;
    dragOffsetX = event.clientX - dragStartX;
    track.style.transform = `translateX(calc(-${getActiveImage() * 100}% + ${dragOffsetX}px))`;
  });
  track.addEventListener('pointerup', (event) => {
    if (dragStartX === null) return;
    const distance = event.clientX - dragStartX;
    track.classList.remove('is-dragging');
    if (Math.abs(distance) > 40) {
      moveImage(distance < 0 ? 1 : -1);
      render();
    } else {
      start();
    }
    dragStartX = null;
    dragOffsetX = 0;
  });
  track.addEventListener('pointercancel', () => {
    dragStartX = null;
    dragOffsetX = 0;
    track.classList.remove('is-dragging');
    render();
  });
  track.addEventListener('mousedown', (event) => {
    stop();
    dragStartX = event.clientX;
    dragOffsetX = 0;
    track.classList.add('is-dragging');
  });
  track.addEventListener('mousemove', (event) => {
    if (dragStartX === null) return;
    dragOffsetX = event.clientX - dragStartX;
    track.style.transform = `translateX(calc(-${getActiveImage() * 100}% + ${dragOffsetX}px))`;
  });
  track.addEventListener('mouseup', (event) => {
    if (dragStartX === null) return;
    const distance = event.clientX - dragStartX;
    track.classList.remove('is-dragging');
    if (Math.abs(distance) > 40) {
      moveImage(distance < 0 ? 1 : -1);
      render();
    } else {
      start();
    }
    dragStartX = null;
    dragOffsetX = 0;
  });
  container.querySelectorAll('.carousel-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      if (dot.dataset.aboutImage !== undefined) {
        aboutActiveImage = Number(dot.dataset.aboutImage);
      } else {
        activeImage = Number(dot.dataset.image);
      }
      render();
    });
  });
}

viewControls.forEach((control) => {
  control.addEventListener('click', () => {
    activeView = control.dataset.view;
    renderImages();
  });
});

document.addEventListener('click', (event) => {
  const homeLink = event.target.closest('[data-home-link]');
  if (!homeLink) return;

  event.preventDefault();
  detail.hidden = true;
  stopAutoplay();
  activeProject = null;
  renderAbout(aboutTitle, aboutText);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelector('#back').addEventListener('click', () => {
  stopAutoplay();
  activeProject = null;
  renderAbout(aboutTitle, aboutText);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

projectsToggle.addEventListener('click', () => {
  setProjectsMenuOpen(projectsToggle.getAttribute('aria-expanded') !== 'true');
});

loadContent().catch(() => { about.textContent = 'Content could not be loaded right now.'; });