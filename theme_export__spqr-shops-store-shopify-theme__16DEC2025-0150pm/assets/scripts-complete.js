/* ====================================================================
   SPQR SHOP - JAVASCRIPT DEFINITIVO 2025
   Arquitectura: Modular | Performance: Optimizado | Mobile-First: 100%
   Funcionalidades: Wishlist, Quick View, Filtros AJAX, Modo Niños, etc.
   ==================================================================== */

(function() {
  'use strict';

  /* ========================================
     CONFIGURACIÓN GLOBAL
     ======================================== */
  const CONFIG = {
    wishlistKey: 'spqr_wishlist',
    cartKey: 'spqr_cart_data',
    kidsMode: 'spqr_kids_mode',
    apiDelay: 300, // Debounce delay
    toastDuration: 3000,
    lazyLoadMargin: '50px'
  };

  /* ========================================
     1. INICIALIZACIÓN
     ======================================== */
  document.addEventListener('DOMContentLoaded', function() {
    initCountdown();
    initStickyHeader();
    initWishlist();
    initQuickAddToCart();
    initLazyLoading();
    initKidsMode();
    initSearch();
    initFilters();
    initCartUpdates();
    initGallery();
    initAnalytics();
    
    console.log('🎉 SPQR Shop iniciado correctamente');
  });

  /* ========================================
     2. COUNTDOWN TIMER
     ======================================== */
  function initCountdown() {
    const countdownElements = document.querySelectorAll('.countdown-box, [data-countdown]');
    
    countdownElements.forEach(element => {
      const targetDate = element.dataset.countdown || 'January 5, 2026 23:59:59';
      updateCountdown(element, new Date(targetDate).getTime());
      
      setInterval(() => {
        updateCountdown(element, new Date(targetDate).getTime());
      }, 1000);
    });
  }

  function updateCountdown(element, targetDate) {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      element.innerHTML = '<div class="timer-unit">🎁 ¡Ya llegaron los Reyes!</div>';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const units = element.querySelectorAll('.timer-unit');
    
    if (units.length >= 4) {
      units[0].innerHTML = `${pad(days)}<span>DÍAS</span>`;
      units[1].innerHTML = `${pad(hours)}<span>HRS</span>`;
      units[2].innerHTML = `${pad(minutes)}<span>MIN</span>`;
      units[3].innerHTML = `${pad(seconds)}<span>SEG</span>`;
    } else if (units.length >= 3) {
      units[0].innerHTML = `${pad(days)}<span>DÍAS</span>`;
      units[1].innerHTML = `${pad(hours)}<span>HRS</span>`;
      units[2].innerHTML = `${pad(minutes)}<span>MIN</span>`;
    }
  }

  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  /* ========================================
     3. STICKY HEADER
     ======================================== */
  function initStickyHeader() {
    const header = document.querySelector('#spqr-unique-header, #spqr-menu-final, header.site-header-custom');
    if (!header) return;

    let lastScroll = 0;
    
    window.addEventListener('scroll', throttle(() => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 100) {
        header.classList.add('scrolled');
        
        // Hide on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 200) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = 'translateY(0)';
        }
      } else {
        header.classList.remove('scrolled');
        header.style.transform = 'translateY(0)';
      }
      
      lastScroll = currentScroll;
    }, 100));
  }

  /* ========================================
     4. WISHLIST (LocalStorage)
     ======================================== */
  function initWishlist() {
    // Inicializar wishlist desde localStorage
    updateWishlistUI();

    // Event listener para botones de wishlist
    document.addEventListener('click', function(e) {
      const wishlistBtn = e.target.closest('.wishlist-btn, [data-wishlist-toggle]');
      if (!wishlistBtn) return;

      e.preventDefault();
      const productId = wishlistBtn.dataset.productId || wishlistBtn.dataset.wishlistToggle;
      toggleWishlist(productId, wishlistBtn);
    });
  }

  function toggleWishlist(productId, button) {
    let wishlist = getWishlist();
    const index = wishlist.indexOf(productId);

    if (index > -1) {
      wishlist.splice(index, 1);
      button.classList.remove('is-favorited');
      button.innerHTML = '🤍';
      showToast('Eliminado de favoritos', 'info');
    } else {
      wishlist.push(productId);
      button.classList.add('is-favorited');
      button.innerHTML = '❤️';
      showToast('Añadido a favoritos', 'success');
    }

    localStorage.setItem(CONFIG.wishlistKey, JSON.stringify(wishlist));
    updateWishlistUI();
  }

  function getWishlist() {
    const data = localStorage.getItem(CONFIG.wishlistKey);
    return data ? JSON.parse(data) : [];
  }

  function updateWishlistUI() {
    const wishlist = getWishlist();
    const counter = document.querySelector('.wishlist-count');
    
    if (counter) {
      counter.textContent = wishlist.length;
      counter.style.display = wishlist.length > 0 ? 'flex' : 'none';
    }

    // Actualizar estado de botones
    document.querySelectorAll('[data-product-id], [data-wishlist-toggle]').forEach(btn => {
      const productId = btn.dataset.productId || btn.dataset.wishlistToggle;
      if (wishlist.includes(productId)) {
        btn.classList.add('is-favorited');
        btn.innerHTML = '❤️';
      }
    });
  }

  /* ========================================
     5. QUICK ADD TO CART
     ======================================== */
  function initQuickAddToCart() {
    document.addEventListener('click', function(e) {
      const addBtn = e.target.closest('.quick-add-btn, [data-quick-add]');
      if (!addBtn) return;

      e.preventDefault();
      
      const productId = addBtn.dataset.productId || addBtn.dataset.quickAdd;
      const variantId = addBtn.dataset.variantId;
      
      if (!variantId) {
        console.error('No variant ID provided');
        return;
      }

      addToCart(variantId, 1, addBtn);
    });
  }

  function addToCart(variantId, quantity = 1, button) {
    // Mostrar loading
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span>';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: variantId,
        quantity: quantity
      })
    })
    .then(response => response.json())
    .then(data => {
      button.innerHTML = '✓ Añadido';
      showToast('Producto añadido al carrito', 'success');
      updateCartCount();
      
      // Restaurar botón después de 2s
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalHTML;
      }, 2000);
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      showToast('Error al añadir al carrito', 'error');
      button.disabled = false;
      button.innerHTML = originalHTML;
    });
  }

  function updateCartCount() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const counters = document.querySelectorAll('.cart-count, [data-cart-count]');
        counters.forEach(counter => {
          counter.textContent = cart.item_count;
          counter.style.display = cart.item_count > 0 ? 'flex' : 'none';
        });
      })
      .catch(error => console.error('Error updating cart count:', error));
  }

  /* ========================================
     6. LAZY LOADING (Intersection Observer)
     ======================================== */
  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback para navegadores antiguos
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.src = img.dataset.src || img.src;
      });
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: CONFIG.lazyLoadMargin
    });

    document.querySelectorAll('img[loading="lazy"], img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  /* ========================================
     7. MODO NIÑOS
     ======================================== */
  function initKidsMode() {
    const toggleBtn = document.querySelector('[data-kids-mode-toggle]');
    if (!toggleBtn) return;

    // Restaurar estado desde localStorage
    const isKidsModeActive = localStorage.getItem(CONFIG.kidsMode) === 'true';
    if (isKidsModeActive) {
      document.body.classList.add('kids-mode');
      toggleBtn.classList.add('active');
    }

    // Toggle al hacer click
    toggleBtn.addEventListener('click', function() {
      const isActive = document.body.classList.toggle('kids-mode');
      toggleBtn.classList.toggle('active');
      
      localStorage.setItem(CONFIG.kidsMode, isActive);
      
      showToast(
        isActive ? '🎨 Modo Niños activado' : 'Modo Normal activado',
        'info'
      );
    });
  }

  /* ========================================
     8. BÚSQUEDA PREDICTIVA
     ======================================== */
  function initSearch() {
    const searchInput = document.querySelector('[data-search-input]');
    const searchResults = document.querySelector('[data-search-results]');
    
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(function(e) {
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        if (searchResults) searchResults.innerHTML = '';
        return;
      }

      performSearch(query, searchResults);
    }, CONFIG.apiDelay));

    // Cerrar resultados al hacer click fuera
    document.addEventListener('click', function(e) {
      if (!e.target.closest('[data-search-input], [data-search-results]')) {
        if (searchResults) searchResults.innerHTML = '';
      }
    });
  }

  function performSearch(query, resultsContainer) {
    fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6`)
      .then(response => response.json())
      .then(data => {
        if (!data.resources || !data.resources.results) {
          resultsContainer.innerHTML = '<div class="search-no-results">No se encontraron resultados</div>';
          return;
        }

        const products = data.resources.results.products || [];
        
        if (products.length === 0) {
          resultsContainer.innerHTML = '<div class="search-no-results">No se encontraron resultados</div>';
          return;
        }

        let html = '<div class="search-results-list">';
        products.forEach(product => {
          html += `
            <a href="${product.url}" class="search-result-item">
              <img src="${product.featured_image}" alt="${product.title}" class="search-result-image">
              <div class="search-result-info">
                <div class="search-result-title">${product.title}</div>
                <div class="search-result-price">${formatMoney(product.price)}</div>
              </div>
            </a>
          `;
        });
        html += '</div>';
        
        resultsContainer.innerHTML = html;
      })
      .catch(error => {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="search-error">Error en la búsqueda</div>';
      });
  }

  /* ========================================
     9. FILTROS DINÁMICOS (AJAX)
     ======================================== */
  function initFilters() {
    const filterForm = document.querySelector('[data-filter-form]');
    if (!filterForm) return;

    filterForm.addEventListener('change', debounce(function(e) {
      if (e.target.matches('input[type="checkbox"], select')) {
        applyFilters();
      }
    }, CONFIG.apiDelay));

    // Limpiar filtros
    const clearBtn = document.querySelector('[data-clear-filters]');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        filterForm.reset();
        applyFilters();
      });
    }
  }

  function applyFilters() {
    const form = document.querySelector('[data-filter-form]');
    if (!form) return;

    const formData = new FormData(form);
    const params = new URLSearchParams(formData);
    
    // Construir URL con parámetros
    const url = window.location.pathname + '?' + params.toString();
    
    // Mostrar loading
    const productsGrid = document.querySelector('[data-products-grid]');
    if (productsGrid) {
      productsGrid.classList.add('loading');
    }

    fetch(url)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Actualizar productos
        const newProducts = doc.querySelector('[data-products-grid]');
        if (newProducts && productsGrid) {
          productsGrid.innerHTML = newProducts.innerHTML;
          productsGrid.classList.remove('loading');
          
          // Reinicializar lazy loading
          initLazyLoading();
        }

        // Actualizar contador
        const newCount = doc.querySelector('[data-product-count]');
        const currentCount = document.querySelector('[data-product-count]');
        if (newCount && currentCount) {
          currentCount.textContent = newCount.textContent;
        }

        // Actualizar URL sin recargar
        window.history.pushState({}, '', url);
      })
      .catch(error => {
        console.error('Filter error:', error);
        if (productsGrid) {
          productsGrid.classList.remove('loading');
        }
        showToast('Error al aplicar filtros', 'error');
      });
  }

  /* ========================================
     10. ACTUALIZACIÓN DE CARRITO (AJAX)
     ======================================== */
  function initCartUpdates() {
    // Cambiar cantidad
    document.addEventListener('click', function(e) {
      const qtyBtn = e.target.closest('.qty-btn, [data-qty-change]');
      if (!qtyBtn) return;

      const input = qtyBtn.parentElement.querySelector('input[type="number"]');
      if (!input) return;

      const change = parseInt(qtyBtn.dataset.qtyChange || (qtyBtn.classList.contains('qty-minus') ? -1 : 1));
      const newQty = Math.max(0, parseInt(input.value) + change);
      
      input.value = newQty;
      updateCartItem(input.dataset.itemKey || input.name, newQty);
    });

    // Eliminar item
    document.addEventListener('click', function(e) {
      const removeBtn = e.target.closest('.item-remove, [data-remove-item]');
      if (!removeBtn) return;

      const itemKey = removeBtn.dataset.itemKey || removeBtn.dataset.removeItem;
      updateCartItem(itemKey, 0);
    });
  }

  function updateCartItem(key, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: key,
        quantity: quantity
      })
    })
    .then(response => response.json())
    .then(cart => {
      // Recargar página o actualizar UI dinámicamente
      if (quantity === 0) {
        const itemRow = document.querySelector(`[data-item-key="${key}"]`);
        if (itemRow) {
          itemRow.style.opacity = '0';
          setTimeout(() => itemRow.remove(), 300);
        }
        showToast('Producto eliminado', 'info');
      }
      
      updateCartCount();
      updateCartTotals(cart);
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      showToast('Error al actualizar el carrito', 'error');
    });
  }

  function updateCartTotals(cart) {
    // Actualizar subtotal
    const subtotalElements = document.querySelectorAll('[data-cart-subtotal]');
    subtotalElements.forEach(el => {
      el.textContent = formatMoney(cart.total_price);
    });

    // Actualizar barra de progreso envío gratis
    const threshold = 4900; // 49€ en centavos
    const progress = Math.min(100, (cart.total_price / threshold) * 100);
    const progressBar = document.querySelector('.progress-bar-fill');
    
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }

    const remaining = threshold - cart.total_price;
    const progressText = document.querySelector('.shipping-progress-content');
    
    if (progressText && remaining > 0) {
      progressText.innerHTML = `
        <div class="progress-text">
          <span class="progress-icon">🚚</span>
          <span>¡Solo <strong>${formatMoney(remaining)}</strong> más para <strong>ENVÍO GRATIS</strong>!</span>
        </div>
      `;
    } else if (progressText) {
      progressText.innerHTML = `
        <div class="progress-text success">
          <span class="progress-icon">✅</span>
          <span>¡Felicidades! Tienes <strong>ENVÍO GRATIS</strong></span>
        </div>
      `;
    }
  }

  /* ========================================
     11. GALERÍA DE PRODUCTO
     ======================================== */
  function initGallery() {
    // Thumbnails click
    document.addEventListener('click', function(e) {
      const thumb = e.target.closest('.thumbnail-item');
      if (!thumb) return;

      const mediaId = thumb.dataset.mediaId;
      const mediaType = thumb.dataset.mediaType;
      const mainMediaContainer = document.querySelector('.main-media-wrapper');
      
      if (!mainMediaContainer) return;

      // Remover clase active de todos los thumbnails
      document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      // Obtener media source
      let mediaHTML = '';
      
      if (mediaType === 'video') {
        const videoSrc = thumb.querySelector('img').dataset.videoSrc;
        mediaHTML = `
          <video 
            id="MainMedia"
            controls 
            autoplay 
            loop 
            muted 
            playsinline 
            class="main-media-element" 
            src="${videoSrc}">
          </video>
        `;
      } else {
        const imgSrc = thumb.querySelector('img').src.replace('_200x', '_1000x');
        mediaHTML = `
          <img 
            id="MainMedia" 
            src="${imgSrc}" 
            alt="Imagen del producto"
            class="main-media-element">
        `;
      }

      // Fade transition
      mainMediaContainer.style.opacity = '0.5';
      setTimeout(() => {
        mainMediaContainer.innerHTML = mediaHTML;
        mainMediaContainer.style.opacity = '1';
      }, 200);
    });

    // Image zoom on hover (desktop only)
    if (window.innerWidth >= 1024) {
      const mainImage = document.querySelector('.main-media-element');
      if (mainImage && mainImage.tagName === 'IMG') {
        mainImage.addEventListener('mousemove', function(e) {
          const { left, top, width, height } = mainImage.getBoundingClientRect();
          const x = (e.clientX - left) / width * 100;
          const y = (e.clientY - top) / height * 100;
          mainImage.style.transformOrigin = `${x}% ${y}%`;
          mainImage.style.transform = 'scale(1.5)';
        });

        mainImage.addEventListener('mouseleave', function() {
          mainImage.style.transform = 'scale(1)';
        });
      }
    }
  }

  /* ========================================
     12. ANALYTICS TRACKING
     ======================================== */
  function initAnalytics() {
    // Track page view
    trackEvent('page_view', {
      page_path: window.location.pathname,
      page_title: document.title
    });

    // Track product clicks
    document.addEventListener('click', function(e) {
      const productLink = e.target.closest('a[href*="/products/"]');
      if (!productLink) return;

      const productName = productLink.querySelector('.product-title')?.textContent || 'Unknown';
      trackEvent('product_click', {
        product_name: productName,
        product_url: productLink.href
      });
    });

    // Track add to cart (ya se hace en addToCart)
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', throttle(() => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > maxScroll && scrollPercent >= 25) {
        maxScroll = Math.floor(scrollPercent / 25) * 25;
        trackEvent('scroll_depth', { depth: maxScroll });
      }
    }, 1000));
  }

  function trackEvent(eventName, params = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, params);
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', eventName, params);
    }

    // Console log para debug
    console.log('📊 Event tracked:', eventName, params);
  }

  /* ========================================
     13. NOTIFICACIONES TOAST
     ======================================== */
  function showToast(message, type = 'info') {
    // Remover toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }[type] || 'ℹ';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Remover después de X segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, CONFIG.toastDuration);
  }

  /* ========================================
     14. UTILIDADES
     ======================================== */
  
  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Format money (Shopify format)
  function formatMoney(cents) {
    const euros = cents / 100;
    return euros.toFixed(2).replace('.', ',') + ' €';
  }

  // Smooth scroll
  function smoothScroll(target, duration = 800) {
    const targetElement = document.querySelector(target);
    if (!targetElement) return;

    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
  }

  /* ========================================
     15. FUNCIONES GLOBALES (para inline JS)
     ======================================== */
  
  // Cambiar media en galería
  window.changeMedia = function(type, src, videoSrc) {
    const container = document.querySelector('.main-media-wrapper');
    if (!container) return;

    container.style.opacity = '0.5';

    setTimeout(() => {
      if (type === 'video') {
        container.innerHTML = `<video src="${videoSrc}" controls autoplay loop class="main-media-element"></video>`;
      } else {
        container.innerHTML = `<img src="${src}" class="main-media-element">`;
      }
      container.style.opacity = '1';
    }, 200);
  };

  // Cambiar slide del carousel
  window.changeSlide = function(direction) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    const currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = slides.length - 1;
    if (newIndex >= slides.length) newIndex = 0;

    slides[currentIndex].classList.remove('active');
    dots[currentIndex]?.classList.remove('active');
    
    slides[newIndex].classList.add('active');
    dots[newIndex]?.classList.add('active');
  };

  window.goToSlide = function(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    const currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));

    slides[currentIndex].classList.remove('active');
    dots[currentIndex]?.classList.remove('active');
    
    slides[index].classList.add('active');
    dots[index]?.classList.add('active');
  };

  // Exponer funciones útiles globalmente
  window.SPQR = {
    showToast,
    addToCart,
    toggleWishlist,
    updateCartCount,
    smoothScroll,
    trackEvent
  };

  console.log('🎯 SPQR JavaScript completamente cargado');

})();
