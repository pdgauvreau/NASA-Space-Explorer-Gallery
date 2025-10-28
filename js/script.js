// API URL
const API_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// DOM Elements
const fetchBtn = document.getElementById('fetch-btn');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const gallery = document.getElementById('gallery');
const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalClose = document.querySelector('.modal-close');

// Set default dates (last 30 days)
const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

endDateInput.value = today.toISOString().split('T')[0];
startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];

// Event Listeners
fetchBtn.addEventListener('click', fetchSpaceImages);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Fetch and display space images
async function fetchSpaceImages() {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    // Validate dates
    if (!startDateInput.value || !endDateInput.value) {
        alert('Please select both start and end dates');
        return;
    }

    if (startDate > endDate) {
        alert('Start date must be before end date');
        return;
    }

    // Show loading, hide gallery
    loading.classList.remove('hidden');
    gallery.innerHTML = '';
    gallery.style.display = 'none';

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        // Filter data by date range
        const filteredData = data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        // Sort by date (newest first)
        filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Hide loading
        loading.classList.add('hidden');

        // Display gallery
        if (filteredData.length === 0) {
            gallery.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-size: 1.2rem; grid-column: 1/-1;">No images found for the selected date range.</p>';
        } else {
            displayGallery(filteredData);
        }

        gallery.style.display = 'grid';

    } catch (error) {
        loading.classList.add('hidden');
        gallery.innerHTML = `<p style="text-align: center; color: var(--nasa-red); font-size: 1.2rem; grid-column: 1/-1;">Error loading images: ${error.message}</p>`;
        gallery.style.display = 'grid';
    }
}

// Display gallery items
function displayGallery(data) {
    gallery.innerHTML = '';

    data.forEach(item => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.addEventListener('click', () => openModal(item));

        // Determine image source
        let imageSrc;
        let isVideo = false;

        if (item.media_type === 'video') {
            imageSrc = item.thumbnail_url || 'https://img.youtube.com/vi/default/hqdefault.jpg';
            isVideo = true;
        } else {
            imageSrc = item.url;
        }

        galleryItem.innerHTML = `
            <div class="gallery-item-image-wrapper">
                <img src="${imageSrc}" alt="${item.title}" class="gallery-item-image">
                ${isVideo ? '<div class="video-indicator">▶</div>' : ''}
            </div>
            <div class="gallery-item-info">
                <h3 class="gallery-item-title">${item.title}</h3>
                <p class="gallery-item-date">${formatDate(item.date)}</p>
            </div>
        `;

        gallery.appendChild(galleryItem);
    });
}

// Open modal with item details
function openModal(item) {
    const modalMedia = document.querySelector('.modal-media');
    const modalTitle = document.querySelector('.modal-title');
    const modalDate = document.querySelector('.modal-date');
    const modalExplanation = document.querySelector('.modal-explanation');
    const modalCopyright = document.querySelector('.modal-copyright');

    // Set media (image or video)
    if (item.media_type === 'video') {
        modalMedia.innerHTML = `
            <iframe src="${item.url}" allowfullscreen></iframe>
        `;
    } else {
        const hdImageSrc = item.hdurl || item.url;
        modalMedia.innerHTML = `
            <img src="${hdImageSrc}" alt="${item.title}">
        `;
    }

    // Set text content
    modalTitle.textContent = item.title;
    modalDate.textContent = formatDate(item.date);
    modalExplanation.textContent = item.explanation;
    
    // Set copyright if available
    if (item.copyright) {
        modalCopyright.textContent = `© ${item.copyright}`;
        modalCopyright.style.display = 'block';
    } else {
        modalCopyright.style.display = 'none';
    }

    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Stop any playing videos
    const iframe = modal.querySelector('iframe');
    if (iframe) {
        iframe.src = iframe.src;
    }
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});