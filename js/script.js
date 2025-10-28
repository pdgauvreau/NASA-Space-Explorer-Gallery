// NASA APOD JSON Feed Configuration
const APOD_JSON_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// DOM Elements
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const fetchBtn = document.getElementById('fetch-btn');
const gallery = document.getElementById('gallery');
const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalExplanation = document.getElementById('modal-explanation');
const modalClose = document.querySelector('.modal-close');
const modalOverlay = document.querySelector('.modal-overlay');

// Store all APOD data
let allApodData = [];

// Initialize date inputs with default values
function initializeDates() {
    // We'll set these after loading the data to match available dates
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    
    const maxDate = today.toISOString().split('T')[0];
    startDateInput.max = maxDate;
    endDateInput.max = maxDate;
    
    startDateInput.value = tenDaysAgo.toISOString().split('T')[0];
    endDateInput.value = maxDate;
}

// Fetch all space images from JSON feed
async function fetchAllSpaceImages() {
    try {
        const response = await fetch(APOD_JSON_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching space images:', error);
        throw error;
    }
}

// Filter data by date range
function filterByDateRange(data, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
    });
}

// Create gallery item HTML
function createGalleryItem(item) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    let imageUrl;
    let imageHTML;
    
    if (item.media_type === 'image') {
        // Use regular url for gallery thumbnail
        imageUrl = item.url;
        imageHTML = `<img src="${imageUrl}" alt="${item.title}" loading="lazy">`;
    } else if (item.media_type === 'video') {
        // Use thumbnail for video entries
        imageUrl = item.thumbnail_url || 'https://via.placeholder.com/300x250?text=Video+Content';
        imageHTML = `
            <div style="position: relative;">
                <img src="${imageUrl}" alt="${item.title}" loading="lazy">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(252, 61, 33, 0.9); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                    <svg style="width: 30px; height: 30px; fill: white; margin-left: 5px;" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
        `;
    }
    
    galleryItem.innerHTML = `
        ${imageHTML}
        <div class="gallery-item-info">
            <h3 class="gallery-item-title">${item.title}</h3>
            <p class="gallery-item-date">${formatDate(item.date)}</p>
        </div>
    `;
    
    // Add click event to open modal
    galleryItem.addEventListener('click', () => openModal(item));
    
    return galleryItem;
}

// Format date to readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Display gallery
function displayGallery(data) {
    gallery.innerHTML = '';
    
    if (data.length === 0) {
        gallery.innerHTML = '<p style="color: white; text-align: center; width: 100%;">No images found for the selected date range.</p>';
        return;
    }
    
    // Reverse array to show newest first
    const reversedData = [...data].reverse();
    
    reversedData.forEach(item => {
        const galleryItem = createGalleryItem(item);
        gallery.appendChild(galleryItem);
    });
}

// Open modal with image details
function openModal(item) {
    // Clear previous content
    modalImage.innerHTML = '';
    
    if (item.media_type === 'image') {
        // Display high-res image if available, otherwise regular url
        const imageUrl = item.hdurl || item.url;
        modalImage.innerHTML = `<img src="${imageUrl}" alt="${item.title}" style="width: 100%; max-height: 500px; object-fit: contain; display: block; background: #000;">`;
    } else if (item.media_type === 'video') {
        // Embed YouTube video
        if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
            modalImage.innerHTML = `
                <iframe 
                    src="${item.url}" 
                    style="width: 100%; height: 500px; border: none; display: block; background: #000;"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
        } else {
            // For other video types, show thumbnail with link
            const thumbnailUrl = item.thumbnail_url || 'https://via.placeholder.com/800x600?text=Video+Content';
            modalImage.innerHTML = `
                <div style="position: relative; width: 100%; height: 500px; background: #000; display: flex; align-items: center; justify-content: center;">
                    <img src="${thumbnailUrl}" alt="${item.title}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    <a href="${item.url}" target="_blank" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(252, 61, 33, 0.9); color: white; padding: 1rem 2rem; border-radius: 4px; text-decoration: none; font-weight: 600;">
                        Watch Video
                    </a>
                </div>
            `;
        }
    }
    
    modalTitle.textContent = item.title;
    modalDate.textContent = formatDate(item.date);
    modalExplanation.textContent = item.explanation;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Show loading state
function showLoading() {
    loading.classList.remove('hidden');
    gallery.innerHTML = '';
}

// Hide loading state
function hideLoading() {
    loading.classList.add('hidden');
}

// Handle fetch button click
async function handleFetchImages() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    // Validate dates
    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date.');
        return;
    }
    
    try {
        showLoading();
        
        // If we haven't loaded the data yet, fetch it
        if (allApodData.length === 0) {
            allApodData = await fetchAllSpaceImages();
        }
        
        // Filter data by date range
        const filteredData = filterByDateRange(allApodData, startDate, endDate);
        
        hideLoading();
        displayGallery(filteredData);
    } catch (error) {
        hideLoading();
        gallery.innerHTML = '<p style="color: white; text-align: center; width: 100%;">Error loading images. Please try again later.</p>';
        console.error('Error:', error);
    }
}

// Load data on page load to set date limits
async function initializeApp() {
    try {
        console.log('Loading APOD data...');
        allApodData = await fetchAllSpaceImages();
        console.log(`Loaded ${allApodData.length} APOD entries`);
        
        // Find min and max dates in the dataset
        if (allApodData.length > 0) {
            const dates = allApodData.map(item => new Date(item.date)).sort((a, b) => a - b);
            const minDate = dates[0].toISOString().split('T')[0];
            const maxDate = dates[dates.length - 1].toISOString().split('T')[0];
            
            // Update date input limits
            startDateInput.min = minDate;
            startDateInput.max = maxDate;
            endDateInput.min = minDate;
            endDateInput.max = maxDate;
            
            // Set default values to last 10 entries
            const defaultEndDate = maxDate;
            const defaultStart = new Date(dates[dates.length - 1]);
            defaultStart.setDate(defaultStart.getDate() - 9);
            const defaultStartDate = defaultStart.toISOString().split('T')[0];
            
            startDateInput.value = defaultStartDate;
            endDateInput.value = defaultEndDate;
            
            console.log(`Date range available: ${minDate} to ${maxDate}`);
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('Error loading APOD data. Please refresh the page.');
    }
}

// Event listeners
fetchBtn.addEventListener('click', handleFetchImages);
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

// Initialize the app
console.log('NASA Space Explorer script loaded successfully!');
initializeDates();
initializeApp();

// Verify elements are found
console.log('Start date input found:', startDateInput ? 'Yes' : 'No');
console.log('End date input found:', endDateInput ? 'Yes' : 'No');
console.log('Fetch button found:', fetchBtn ? 'Yes' : 'No');