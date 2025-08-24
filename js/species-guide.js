// Shared toggling behavior for species guide pages
// Usage: buttons call rcToggleSection('sectionId')

function rcHideAllSections() {
  document.querySelectorAll('.rc-species-section').forEach(section => {
    section.style.display = 'none';
  });
}

function rcToggleSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target) return;
  const currentlyVisible = target.style.display === 'block';
  rcHideAllSections();
  target.style.display = currentlyVisible ? 'none' : 'block';
}

// Optional: open first section by default on load
document.addEventListener('DOMContentLoaded', () => {
  const first = document.querySelector('.rc-species-section');
  if (first) first.style.display = 'block';
});


