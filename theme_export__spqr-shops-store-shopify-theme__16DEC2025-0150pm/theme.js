/**
 * JAVASCRIPT PRINCIPAL - JUGUETERÍA SPQR
 * Funcionalidades: Carrito, Wishlist, Modo Niños, Interactividad
 */

(function() {
  'use strict';

  // ==========================================
  // 1. GESTIÓN DEL CARRITO
  // ==========================================

  const CartManager = {
    
    // Añadir producto al carrito
    add: function(variantId, quantity = 1) {
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity
        })
      })
      .then(response => response.json())
      .then(data => {
        this.updateCount();
        this.showNotification('✅ Producto añadido al carrito', 'success');
        return data;
      })
      .catch(error => {
        this.showNotification('❌ Error al añadir al carrito', 'error');
        throw error;
      });
    },

    // Actualizar contador del carrito
    updateCount: function() {
      fetch('/cart.js')
        .then(response => response.json())
        .then(data => {
          const cartCount = document.getElementById('cart-count');
          if (cartCount) {
            cartCount.textContent = data.item_count;
            cartCount.style.animation = 'pulse 0.5s';
          }
          
          // Disparar evento personalizado
          document.dispatchEvent(new CustomEvent('cart:updated', {
            detail: { item_count: data.item_count, total_price: data.total_price }
          }));
        });
    },

    // Mostrar notificación toast
    showNotification: function(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };

  // Exponer CartManager globalmente
  window.CartManager = CartManager;

  // ==========================================
  // 2. WISHLIST / FAVORITOS
  // ==========================================

  const WishlistManager = {
    
    // Clave de localStorage
    STORAGE_KEY: 'spqr_wishlist',

    // Obtener wishlist
    get: function() {
      const wishlist = localStorage.getItem(this.STORAGE_KEY);
      return wishlist ? JSON.parse(wishlist) : [];
    },

    // Añadir producto
    add: function(productId) {
      const wishlist = this.get();
      if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wishlist));
        CartManager.showNotification('❤️ Añadido a favoritos', 'success');
        this.updateUI(productId, true);
      }
    },

    // Quitar producto
    remove: function(productId) {
      let wishlist = this.get();
      wishlist = wishlist.filter(id => id !== productId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wishlist));
      CartManager.showNotification('💔 Eliminado de favoritos', 'info');
      this.updateUI(productId, false);
    },

    // Toggle (añadir/quitar)
    toggle: function(productId) {
      const wishlist = this.get();
      if (wishlist.includes(productId)) {
        this.remove(productId);
      } else {
        this.add(productId);
      }
    },

    // Actualizar UI
    updateUI: function(productId, isInWishlist) {
      const buttons = document.querySelectorAll(`[data-wishlist-id="${productId}"]`);
      buttons.forEach(btn => {
        btn.classList.toggle('is-favorited', isInWishlist);
        btn.querySelector('.wishlist-icon').textContent = isInWishlist ? '❤️' : '🤍';
      });
    }
  };

  window.WishlistManager = WishlistManager;

  // ==========================================
  // 3. MODO NIÑOS (KIDS MODE)
  // ==========================================

  const KidsMode = {
    
    STORAGE_KEY: 'spqr_kids_mode',

    // Verificar si está activo
    isActive: function() {
      return localStorage.getItem(this.STORAGE_KEY) === 'true';
    },

    // Activar modo niños
    enable: function() {
      localStorage.setItem(this.STORAGE_KEY, 'true');
      document.body.classList.add('kids-mode-active');
      this.applyKidsStyles();
      CartManager.showNotification('🎮 Modo Explorador activado', 'success');
    },

    // Desactivar modo niños
    disable: function() {
      localStorage.setItem(this.STORAGE_KEY, 'false');
      document.body.classList.remove('kids-mode-active');
      CartManager.showNotification('👔 Modo Adulto activado', 'info');
    },

    // Toggle modo
    toggle: function() {
      if (this.isActive()) {
        this.disable();
      } else {
        this.enable();
      }
    },

    // Aplicar estilos para niños
    applyKidsStyles: function() {
      // Botones más grandes
      document.querySelectorAll('.btn').forEach(btn => {
        btn.classList.add('btn-kids');
      });
      
      // Cards más espaciadas
      document.querySelectorAll('.product-card-spqr').forEach(card => {
        card.classList.add('product-card-kids');
      });

      // Sonidos al hacer click (opcional)
      this.addSounds();
    },

    // Añadir sonidos de feedback
    addSounds: function() {
      document.addEventListener('click', function(e) {
        if (e.target.closest('.btn') || e.target.closest('.product-card-spqr')) {
          // Reproducir sonido (si lo tienes)
          // new Audio('/assets/click-sound.mp3').play();
        }
      });
    }
  };

  window.KidsMode = KidsMode;

  // Inicializar modo niños si estaba activo
  if (KidsMode.isActive()) {
    document.body.classList.add('kids-mode-active');
  }

  // ==========================================
  // 4. BÚSQUEDA INTELIGENTE
  // ==========================================

  const SearchManager = {
    
    // Inicializar búsqueda predictiva
    init: function() {
      const searchInput = document.querySelector('.search-input');
      if (!searchInput) return;

      let timeout;
      searchInput.addEventListener('input', function(e) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          SearchManager.predict(e.target.value);
        }, 300);
      });
    },

    // Búsqueda predictiva
    predict: function(query) {
      if (query.length < 2) return;

      fetch(`/search/suggest.json?q=${query}&resources[type]=product&resources[limit]=5`)
        .then(response => response.json())
        .then(data => {
          this.showSuggestions(data.resources.results.products);
        });
    },

    // Mostrar sugerencias
    showSuggestions: function(products) {
      // Implementar dropdown de sugerencias
      console.log('Suggestions:', products);
    }
  };

  // ==========================================
  // 5. FILTROS AVANZADOS
  // ==========================================

  const FilterManager = {
    
    // Filtrar por edad
    filterByAge: function(minAge, maxAge) {
      const products = document.querySelectorAll('.product-card-spqr');
      
      products.forEach(product => {
        const productAge = parseInt(product.dataset.age);
        const shouldShow = productAge >= minAge && productAge <= maxAge;
        
        product.style.display = shouldShow ? 'block' : 'none';
      });
    },

    // Filtrar por habilidades
    filterBySkills: function(skills) {
      const products = document.querySelectorAll('.product-card-spqr');
      
      products.forEach(product => {
        const productSkills = product.dataset.skills ? product.dataset.skills.split(',') : [];
        const hasSkill = skills.some(skill => productSkills.includes(skill));
        
        product.style.display = hasSkill ? 'block' : 'none';
      });
    }
  };

  window.FilterManager = FilterManager;

  // ==========================================
  // 6. PERFORMANCE OPTIMIZATIONS
  // ==========================================

  // Lazy loading de imágenes
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // ==========================================
  // 7. ACCESIBILIDAD
  // ==========================================

  // Navegación por teclado mejorada
  document.addEventListener('keydown', function(e) {
    // ESC para cerrar modales
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal, .dropdown').forEach(el => {
        el.classList.remove('is-active');
      });
    }
  });

  // Focus visible solo con teclado
  document.addEventListener('mousedown', function() {
    document.body.classList.add('using-mouse');
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      document.body.classList.remove('using-mouse');
    }
  });

  // ==========================================
  // 8. ANALYTICS TRACKING
  // ==========================================

  const Analytics = {
    
    // Track evento
    track: function(eventName, data) {
      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
      }

      // Facebook Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', eventName, data);
      }

      console.log('Analytics tracked:', eventName, data);
    },

    // Track producto visto
    trackProductView: function(productId, productName) {
      this.track('view_item', {
        items: [{
          id: productId,
          name: productName
        }]
      });
    },

    // Track añadido al carrito
    trackAddToCart: function(productId, productName, price) {
      this.track('add_to_cart', {
        items: [{
          id: productId,
          name: productName,
          price: price
        }]
      });
    }
  };

  window.Analytics = Analytics;

  // ==========================================
  // 9. INICIALIZACIÓN
  // ==========================================

  document.addEventListener('DOMContentLoaded', function() {
    
    // Inicializar búsqueda
    SearchManager.init();

    // Actualizar contador del carrito
    CartManager.updateCount();

    // Inicializar wishlist UI
    const wishlist = WishlistManager.get();
    wishlist.forEach(productId => {
      WishlistManager.updateUI(productId, true);
    });

    console.log('🎯 SPQR Theme initialized');
  });

  // ==========================================
  // 10. CSS ANIMATIONS
  // ==========================================

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100px);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    /* Modo Niños Activo */
    .kids-mode-active .btn {
      min-height: 60px;
      font-size: 1.2em;
      border-radius: 16px;
    }

    .kids-mode-active .product-card-spqr {
      border: 3px solid var(--color-accent);
    }

    /* Focus visible solo con teclado */
    .using-mouse *:focus {
      outline: none;
    }
  `;
  document.head.appendChild(style);

})();

// ==========================================
// FUNCIONES GLOBALES (Compatibilidad con Liquid)
// ==========================================

function toggleWishlist(productId) {
  window.WishlistManager.toggle(productId);
}

function addToCart(variantId, quantity = 1) {
  window.CartManager.add(variantId, quantity);
}

function toggleKidsMode() {
  window.KidsMode.toggle();
}

function quickView(productId) {
  // Implementar modal de quick view
  console.log('Quick view:', productId);
}

console.log('✅ SPQR JavaScript loaded');
