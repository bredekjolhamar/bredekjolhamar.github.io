class Product {
    constructor(id, url, image, title, price, description, device) {
        this.id = id;
        this.url = url;
        this.image = image;
        this.title = title;
        this.price = price;
        this.description = description;
        this.device = device;
    }

    fetchAndCropImage(imageSrc, callback, errorCallback) {
        const proxyUrl = `https://widgetproxyserver.bredekjolhamar.workers.dev/?url=${encodeURIComponent(imageSrc)}`;
        
        fetch(proxyUrl)
            .then(response => response.blob())
            .then(blob => {
                const img = new Image();
                const url = URL.createObjectURL(blob);
                img.src = url;
                img.crossOrigin = 'anonymous'; // Enable CORS

                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    let top = 0;
                    let bottom = canvas.height;

                    // Find top boundary
                    for (let y = 0; y < canvas.height; y++) {
                        let white = true;
                        for (let x = 0; x < canvas.width; x++) {
                            const index = (y * canvas.width + x) * 4;
                            if (data[index] < 250 || data[index + 1] < 250 || data[index + 2] < 250) {
                                white = false;
                                break;
                            }
                        }
                        if (!white) {
                            top = y;
                            break;
                        }
                    }

                    // Find bottom boundary
                    for (let y = canvas.height - 1; y >= 0; y--) {
                        let white = true;
                        for (let x = 0; x < canvas.width; x++) {
                            const index = (y * canvas.width + x) * 4;
                            if (data[index] < 250 || data[index + 1] < 250 || data[index + 2] < 250) {
                                white = false;
                                break;
                            }
                        }
                        if (!white) {
                            bottom = y;
                            break;
                        }
                    }

                    const height = bottom - top;
                    const croppedImageData = ctx.getImageData(0, top, canvas.width, height);

                    // Resize canvas and draw cropped image
                    canvas.height = height;
                    ctx.putImageData(croppedImageData, 0, 0);

                    const croppedImageSrc = canvas.toDataURL();
                    callback(croppedImageSrc);
                    URL.revokeObjectURL(url); // Clean up
                };

                img.onerror = function () {
                    console.error('Failed to load image:', imageSrc);
                    errorCallback();
                    URL.revokeObjectURL(url); // Clean up
                };
            })
            .catch(error => {
                console.error('Error fetching image:', error);
                errorCallback();
            });
    }

    render() {
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'widget';

        this.fetchAndCropImage(this.image, (croppedImageSrc) => {
            img.src = croppedImageSrc;
        }, () => {
            img.src = this.image; // Fallback to the original image if cropping fails
        });
        if (this.device === 'Mobile') {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://widgettest-bir.pages.dev/styleMobile.css';
            document.head.appendChild(link);
            const productContainer = document.getElementById('productContainer');
        }

        else {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://widgettest-bir.pages.dev/style.css';
            document.head.appendChild(link);
            const productContainer = document.getElementById('productContainer');
        }


        widgetDiv.innerHTML = `
            <a href="${this.url}" target="_blank" style="text-decoration: none; width: 100%; height: 100%;">
                <div class="item">
                    <div class="item__content">
                        <p class="item__content--text">${this.title}</p>
                    </div>
                    <div class="item__content">
                        <p class="item__content--description">${this.description}</p>
                    </div>
                    <div class="item__image">
                        <img src="" alt="${this.title}">
                    </div>
                    <div class="item__content">
                        <p class="item__content--price">${this.price.replace(/(\d)\s+(?=\d)/g, '$1')}</p>
                    </div>
                </div>
            </a>
        `;

        const img = widgetDiv.querySelector('img');

        // Set up hover effect
        img.onmouseover = () => img.style.transform = 'scale(1.1)';
        img.onmouseout = () => img.style.transform = 'scale(1)';

        return widgetDiv;
    }
}

function detectDevice() {
    const userAgent = navigator.userAgent;

    if (/Mobi|Android/i.test(userAgent)) {
        return "Mobile"
        // Apply mobile-specific logic here
    } else {
        return "Not Mobile"
        // Apply desktop-specific logic here
    }
}



function fetchProducts() {
    const device = detectDevice();
    fetch('https://events.contkit.com/sample/recommended')
        .then(response => response.json())
        .then(data => {
            const productContainer = document.getElementById('productContainer');
            productContainer.innerHTML = '';
            if (device === 'Mobile') {
                const item = data[0];
                const product = new Product(item.id, item.url, item.image, item.title, item.price, item.description, device);
                productContainer.appendChild(product.render());
            }
            else {
            data.forEach(item => {
                const product = new Product(item.id, item.url, item.image, item.title, item.price, item.description, device);
                productContainer.appendChild(product.render());
            });
        }})
        .catch(error => {
            console.error('There was an error fetching the products:', error);
        });
}

// Init
console.log(navigator.userAgent);
fetchProducts();