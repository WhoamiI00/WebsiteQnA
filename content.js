/**
 * This script is injected into the active webpage.
 * Its purpose is to extract the main text content and images of the page.
 * It returns the text content and image data, which is then captured by the popup script.
 */
(() => {
    // Function to get all visible images on the page
    function getVisibleImages() {
        const images = Array.from(document.querySelectorAll('img'));
        return images
            .filter(img => {
                // Filter out tiny images (likely icons) and hidden images
                const rect = img.getBoundingClientRect();
                const style = window.getComputedStyle(img);
                const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 50 && rect.height > 50;
                return isVisible && img.src && (img.src.startsWith('http') || img.src.startsWith('data:'));
            })
            .map(img => {
                return {
                    src: img.src,
                    alt: img.alt || '',
                    width: img.width,
                    height: img.height
                };
            });
    }

    // Return both text content and image data
    return {
        text: document.body.innerText,
        images: getVisibleImages()
    };
})();
