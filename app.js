// PRIME POPS WhatsApp business number
const WHATSAPP_PHONE = '233530596326';

    // Safe session storage wrapper for temporary order state
    const safeSessionStorage = {
      get(key) { try { return window.sessionStorage.getItem(key); } catch { return null; } },
      set(key, value) { try { window.sessionStorage.setItem(key, value); return true; } catch { return false; } },
      remove(key) { try { window.sessionStorage.removeItem(key); } catch {} }
    };

    // Safe local storage wrapper for persistent theme preference
    const safeLocalStorage = {
      get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
      set(key, value) { try { window.localStorage.setItem(key, value); return true; } catch { return false; } }
    };
    // Descriptions shown after a customer selects a flavor
    const flavorDescriptions = {
      'Classic (Salted)': {
        icon: '🧂',
        title: 'Classic (Salted)',
        description: 'Not a fan of sweet popcorn? Enjoy the simple, satisfying crunch of our lightly salted classic.'
      },
      'Milky': {
        icon: '🥛',
        title: 'Milky',
        description: 'Our signature flavor. Sweet, creamy popcorn made with rich milk flavor for a smooth and satisfying treat.'
      },
      'Chocolate': {
        icon: '🍫',
        title: 'Chocolate',
        description: 'For chocolate lovers. Crispy popcorn coated with rich cocoa flavor for a deliciously indulgent snack.'
      }
    };

    // Product names, prices and available flavors
    const menuPacks = {
      mini: {
        name: 'Prime Mini',
        price: 15,
        flavors: ['Classic (Salted)', 'Milky']
      },
      bossu: {
        name: 'Prime Plus',
        price: 20,
        flavors: ['Classic (Salted)', 'Milky', 'Chocolate']
      },
      bigman: {
        name: 'Prime Deluxe',
        price: 30,
        flavors: ['Classic (Salted)', 'Milky', 'Chocolate']
      }
    };

    // Current menu and checkout state
    const menuState = {
      selectedPack: '',
      selectedFlavor: '',
      quantity: 1,
      flavorError: false,
      checkoutPromptVisible: false
    };

    let _modalProduct = '', _modalFlavor = '', _modalPriceUnit = 0, _modalQty = 1;
    let successProcessingTimer = null;
    let successCelebrationTimer = null;
    let lastFocusedElement = null;

    // Re-render Lucide icons after dynamic HTML updates
    function refreshIcons() {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

    // Open an external URL safely in a new browser tab
    function openExternalUrl(url) {
      try {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      } catch (error) {
        return false;
      }
    }

    // Return visible, keyboard-focusable controls inside a container
    function getFocusableElements(container) {
      return [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.disabled && el.offsetParent !== null);
    }

    // Activate a modal and move keyboard focus inside it
    function activateDialog(modal, card) {
      lastFocusedElement = document.activeElement;
      modal.removeAttribute('inert');
      modal.setAttribute('aria-hidden', 'false');
      const focusables = getFocusableElements(card);
      (focusables[0] || card).focus();
    }

    // Deactivate a modal and restore the previous focus target
    function deactivateDialog(modal) {
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('inert', '');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
    }

    // Keep keyboard focus inside an open modal
    function trapDialogFocus(event, modal, card, closeHandler) {
      if (
        !modal ||
        modal.getAttribute('aria-hidden') === 'true' ||
        modal.classList.contains('pointer-events-none')
      ) return;
      if (event.key === 'Escape') { closeHandler(); return; }
      if (event.key !== 'Tab') return;
      const focusables = getFocusableElements(card);
      if (!focusables.length) { event.preventDefault(); card.focus(); return; }
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    // Build the flavor buttons and selected-flavor description
    function renderFlavorOptions() {
      Object.keys(menuPacks).forEach(packId => {
        const holder = document.getElementById(`flavors-${packId}`);
        if (!holder) return;

        const showError = menuState.flavorError && menuState.selectedPack === packId && !menuState.selectedFlavor;

        holder.innerHTML = `
          <div class="flavor-heading">Choose your preferred flavor</div>
          <div class="flavor-buttons ${showError ? 'flavor-shake' : ''}">
            ${menuPacks[packId].flavors.map(flavor => `
              <button type="button"
                onclick="event.stopPropagation(); selectFlavor('${packId}', '${flavor}')"
                class="flavor-option border border-brand-cocoa/10 dark:border-white/10 bg-white/75 dark:bg-white/5 py-3 text-sm font-extrabold transition-all duration-300 ${menuState.selectedPack === packId && menuState.selectedFlavor === flavor ? 'active' : ''}">
                ${flavor}
              </button>
            `).join('')}
          </div>
          ${menuState.selectedPack === packId && menuState.selectedFlavor && flavorDescriptions[menuState.selectedFlavor] ? `
            <div class="flavor-description-card" role="status" aria-live="polite">
              <div class="flavor-description-icon" aria-hidden="true">${flavorDescriptions[menuState.selectedFlavor].icon}</div>
              <div>
                <p class="flavor-description-title">${flavorDescriptions[menuState.selectedFlavor].title}</p>
                <p class="flavor-description-text">${flavorDescriptions[menuState.selectedFlavor].description}</p>
              </div>
            </div>
          ` : ''}
          <p class="flavor-error ${showError ? 'show' : ''}">Please choose your preferred flavor before continuing.</p>
        `;
      });
    }

    // Refresh product selection, totals and checkout UI
    function updateMenuSummary() {
      const hasPack = Boolean(menuState.selectedPack);
      const pack = hasPack ? menuPacks[menuState.selectedPack] : null;
      const total = hasPack ? pack.price * menuState.quantity : 0;

      document.querySelectorAll('.menu-pack-card').forEach(card => card.classList.remove('selected'));
      if (hasPack) {
        document.getElementById(`pack-${menuState.selectedPack}`)?.classList.add('selected');
      }

      document.getElementById('summary-pack').textContent = hasPack ? pack.name : 'Not selected';
      document.getElementById('summary-flavor').textContent = menuState.selectedFlavor || 'Not selected';
      document.getElementById('summary-qty').textContent = hasPack ? menuState.quantity : 'Not selected';
      document.getElementById('summary-total').textContent = hasPack ? `GH₵${total}` : 'GH₵0';

      const largeOrderNotice = document.getElementById('large-order-notice');
      if (largeOrderNotice) {
        largeOrderNotice.classList.toggle('hidden', !(hasPack && menuState.quantity > 20));
      }

      const checkoutBar = document.getElementById('menu-checkout');
      const readyForCheckout = hasPack && Boolean(menuState.selectedFlavor);
      checkoutBar?.classList.toggle('show', readyForCheckout);

      const checkoutError = document.getElementById('menu-checkout-error');
      if (checkoutError && hasPack && menuState.selectedFlavor) {
        checkoutError.classList.remove('show');
      }

      const mobileCheckoutFloat = document.getElementById('mobile-checkout-float');
      const mobileCheckoutPack = document.getElementById('mobile-checkout-pack');
      const mobileCheckoutFlavor = document.getElementById('mobile-checkout-flavor');
      if (mobileCheckoutFloat && mobileCheckoutPack && mobileCheckoutFlavor) {
        const showMobilePrompt = readyForCheckout && menuState.checkoutPromptVisible;
        mobileCheckoutFloat.classList.toggle('show', showMobilePrompt);
        mobileCheckoutFloat.classList.toggle('checkout-open', !showMobilePrompt);
        mobileCheckoutFloat.setAttribute('aria-hidden', showMobilePrompt ? 'false' : 'true');
        mobileCheckoutPack.textContent = readyForCheckout ? pack.name : 'Pack size';
        mobileCheckoutFlavor.textContent = readyForCheckout ? menuState.selectedFlavor : 'Flavor';
      }

      renderFlavorOptions();
      refreshIcons();
    }


    // Return the customer to the selected product card
    function backToMenu() {
      const menu = document.getElementById('products');
      const firstSelected = menuState.selectedPack
        ? document.getElementById(`pack-${menuState.selectedPack}`)
        : document.getElementById('pack-mini');

      (firstSelected || menu)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        if (firstSelected && typeof firstSelected.focus === 'function') {
          firstSelected.focus({ preventScroll: true });
        }
      }, 650);
    }

    // Hide the mobile prompt and reveal the checkout section
    function scrollToCheckout() {
      if (!menuState.selectedPack || !menuState.selectedFlavor) return;
      menuState.checkoutPromptVisible = false;
      updateMenuSummary();
      document.getElementById('menu-checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Select a product pack
    function selectPack(packId) {
      const isNewPack = menuState.selectedPack !== packId;
      menuState.selectedPack = packId;
      menuState.flavorError = false;
      menuState.checkoutPromptVisible = false;
      if (isNewPack) {
        menuState.quantity = 1;
      }
      if (!menuPacks[packId].flavors.includes(menuState.selectedFlavor)) {
        menuState.selectedFlavor = '';
      }
      const checkoutError = document.getElementById('menu-checkout-error');
      if (checkoutError) checkoutError.classList.remove('show');
      updateMenuSummary();
    }

    // Scroll only when the new flavor description is outside the viewport
    function revealSelectedFlavorDescription(packId) {
      window.setTimeout(() => {
        const description = document.querySelector(`#pack-${packId} .flavor-description-card`);
        if (!description) return;

        const rect = description.getBoundingClientRect();
        const safeTop = 104;
        const safeBottom = window.innerHeight - 110;
        const isFullyVisible = rect.top >= safeTop && rect.bottom <= safeBottom;

        if (!isFullyVisible) {
          description.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }, 120);
    }

    // Select a flavor and show the mobile checkout prompt
    function selectFlavor(packId, flavor) {
      menuState.selectedPack = packId;
      menuState.selectedFlavor = flavor;
      menuState.flavorError = false;
      menuState.checkoutPromptVisible = true;
      updateMenuSummary();
      revealSelectedFlavorDescription(packId);
    }

    // Increase or decrease the quantity in the checkout summary
    function changeMenuQty(delta) {
      if (!menuState.selectedPack) {
        const checkoutError = document.getElementById('menu-checkout-error');
        if (checkoutError) {
          checkoutError.textContent = 'Please choose your popcorn pack first.';
          checkoutError.classList.add('show');
        }
        return;
      }
      const next = menuState.quantity + delta;
      if (next < 1 || next > 99) return;
      menuState.quantity = next;
      updateMenuSummary();
    }

    // Validate the order and open the preorder review modal
    function preorderSelectedPack() {
      const checkoutError = document.getElementById('menu-checkout-error');

      if (!menuState.selectedPack) {
        if (checkoutError) {
          checkoutError.textContent = 'Please choose your popcorn pack first.';
          checkoutError.classList.add('show');
        }
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const pack = menuPacks[menuState.selectedPack];

      if (!menuState.selectedFlavor) {
        menuState.flavorError = true;
        if (checkoutError) {
          checkoutError.textContent = 'Please choose your preferred flavor before continuing.';
          checkoutError.classList.add('show');
        }
        updateMenuSummary();
        document.getElementById(`pack-${menuState.selectedPack}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (checkoutError) checkoutError.classList.remove('show');
      openModal(pack.name, menuState.selectedFlavor, pack.price, menuState.quantity);
    }

    // Open the standard preorder review modal
    function openModal(product, flavor, price, qty){
      _modalProduct = product;
      _modalFlavor = flavor;
      _modalPriceUnit = price;
      _modalQty = qty;

      document.getElementById('modal-product-name').textContent = product;
      document.getElementById('modal-flavor-name').textContent = flavor;
      document.getElementById('modal-unit-price').textContent = `GH₵${price}`;
      document.getElementById('modal-qty').textContent = qty;
      document.getElementById('modal-total').textContent = `GH₵${price * qty}`;

      const modal = document.getElementById('order-modal');
      const card = document.getElementById('modal-card');
      modal.classList.remove('opacity-0', 'pointer-events-none');
      requestAnimationFrame(() => {
        card.classList.remove('translate-y-6');
        activateDialog(modal, card);
      });
      document.body.style.overflow = 'hidden';
      refreshIcons();
    }
    // Close the standard preorder review modal
    function closeModal(){
      const modal=document.getElementById('order-modal'); const card=document.getElementById('modal-card');
      card.classList.add('translate-y-6'); modal.classList.add('opacity-0','pointer-events-none');
      deactivateDialog(modal); document.body.style.overflow='';
    }
    // Update quantity inside the preorder review modal
    function modalChangeQty(delta){ const next=_modalQty+delta; if(next<1||next>99)return; _modalQty=next; document.getElementById('modal-qty').textContent=_modalQty; document.getElementById('modal-total').textContent=`GH₵${_modalPriceUnit*_modalQty}`; }
    // Generate the WhatsApp order message and launch WhatsApp
    function confirmOrder(){
      const confirmButton = document.getElementById('confirm-order-button');
      if (confirmButton) {
        confirmButton.classList.add('is-loading');
        confirmButton.setAttribute('aria-busy', 'true');
        confirmButton.disabled = true;
      }

      const productLabel = `${_modalProduct} - ${_modalFlavor}`;
      const total = _modalPriceUnit * _modalQty;
      const messageText = `🍿 *PRIME POPS PREORDER*

I'd like to place a preorder.

*Kindly complete the details below before sending your order. 😊*

*Name:*

*Product:* ${_modalProduct}

*Flavor:* ${_modalFlavor}

*Quantity:* ${_modalQty}

*Total:* GH₵${total}

*Preferred Date:*

*Preferred Time:*

*Delivery Location:*

*Special Instructions (Optional):*

Thank you!`;

      const pendingOrder = {
        product: _modalProduct,
        flavor: _modalFlavor,
        quantity: _modalQty,
        total,
        launchedAt: Date.now(),
        type: 'regular'
      };

      safeSessionStorage.set(
        'primepops-pending-whatsapp-order',
        JSON.stringify(pendingOrder)
      );
      safeSessionStorage.set('primepops-awaiting-whatsapp-return', 'true');
      window.primePopsWhatsAppLaunchTime = Date.now();

      const opened = openExternalUrl(
        `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(messageText)}`
      );

      if (!opened) {
        if (confirmButton) {
          confirmButton.classList.remove('is-loading');
          confirmButton.removeAttribute('aria-busy');
          confirmButton.disabled = false;
        }
        safeSessionStorage.remove('primepops-pending-whatsapp-order');
        safeSessionStorage.remove('primepops-awaiting-whatsapp-return');
        showOrderErrorToast();
        return;
      }

      window.setTimeout(() => {
        if (confirmButton) {
          confirmButton.classList.remove('is-loading');
          confirmButton.removeAttribute('aria-busy');
          confirmButton.disabled = false;
        }
      }, 800);

      closeModal();
    }
    // Generate and launch the bulk-order WhatsApp enquiry
    function launchBulkWhatsApp() {
      const messageText = `🍿 *PRIME POPS BULK PREORDER*

I'd like to place a bulk preorder.

*Kindly complete the details below before sending your request. 😊*

*Name:*

*Event Type:*

*Estimated Quantity:*

*Preferred Date:*

*Preferred Time:*

*Delivery Location:*

*Preferred Flavor(s):*

*Special Instructions (Optional):*

Thank you!`;
      const pendingOrder = {
        product: 'Bulk preorder enquiry',
        quantity: 'To be confirmed',
        total: 'To be confirmed',
        launchedAt: Date.now(),
        type: 'bulk'
      };
      safeSessionStorage.set('primepops-pending-whatsapp-order', JSON.stringify(pendingOrder));
      safeSessionStorage.set('primepops-awaiting-whatsapp-return', 'true');
      window.primePopsWhatsAppLaunchTime = Date.now();
      const opened = openExternalUrl(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(messageText)}`);
      if (!opened) {
        safeSessionStorage.remove('primepops-pending-whatsapp-order');
        safeSessionStorage.remove('primepops-awaiting-whatsapp-return');
        showOrderErrorToast();
      }
    }

    updateMenuSummary();

    // Show a temporary message if WhatsApp cannot be opened
    function showOrderErrorToast() {
      const toast = document.getElementById('order-error-toast');
      if (!toast) return;
      toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
      refreshIcons();
      window.setTimeout(() => toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4'), 6000);
    }

    // Read the pending WhatsApp order from session storage
    function getPendingWhatsAppOrder() {
      try {
        return JSON.parse(safeSessionStorage.get('primepops-pending-whatsapp-order') || 'null');
      } catch (error) {
        return null;
      }
    }

    // Show the return confirmation after the customer comes back from WhatsApp
    function showWhatsAppReturnModal() {
      if (safeSessionStorage.get('primepops-awaiting-whatsapp-return') !== 'true') return;

      const pending = getPendingWhatsAppOrder();
      if (!pending) return;

      const modal = document.getElementById('whatsapp-return-modal');
      const card = document.getElementById('whatsapp-return-card');
      const selection = document.getElementById('whatsapp-return-selection');
      const secondaryButton = document.getElementById('whatsapp-return-secondary');
      if (!modal || !card || !selection) return;

      // Prepare all content while the entire modal is still invisible.
      const isBulkOrder = pending.type === 'bulk';
      selection.textContent = isBulkOrder
        ? pending.product
        : `${pending.product} • ${pending.flavor} • Qty ${pending.quantity} • GH₵${pending.total}`;

      if (secondaryButton) {
        secondaryButton.textContent = isBulkOrder
          ? 'Return to Website'
          : 'No, Continue Ordering';
      }

      refreshIcons();
      document.body.style.overflow = 'hidden';

      // Reveal the backdrop and card together after layout and icons are ready.
      requestAnimationFrame(() => {
        modal.classList.remove('pointer-events-none');
        modal.classList.add('return-modal-open');
        card.classList.remove('translate-y-6', 'scale-[.98]');
        activateDialog(modal, card);
      });
    }

    // Hide the WhatsApp return confirmation
    function hideWhatsAppReturnModal() {
      const modal = document.getElementById('whatsapp-return-modal');
      const card = document.getElementById('whatsapp-return-card');
      if (!modal || !card) return;

      modal.classList.remove('return-modal-open');
      modal.classList.add('pointer-events-none');
      card.classList.add('translate-y-6', 'scale-[.98]');
      deactivateDialog(modal);
      document.body.style.overflow = '';
    }

    // Reset product, flavor and quantity selections
    function resetMenuOrder() {
      menuState.selectedPack = '';
      menuState.selectedFlavor = '';
      menuState.quantity = 1;
      menuState.flavorError = false;
      safeSessionStorage.remove('primepops-pending-whatsapp-order');
      safeSessionStorage.remove('primepops-awaiting-whatsapp-return');
      updateMenuSummary();
    }

    // Confirm that the customer sent the WhatsApp message
    function confirmWhatsAppOrderSent() {
      hideWhatsAppReturnModal();
      resetMenuOrder();
      showPremiumSuccessExperience();
    }

    function clearSuccessExperienceTimers() {
      if (successProcessingTimer) {
        window.clearTimeout(successProcessingTimer);
        successProcessingTimer = null;
      }

      if (successCelebrationTimer) {
        window.clearTimeout(successCelebrationTimer);
        successCelebrationTimer = null;
      }
    }

    function showPremiumSuccessExperience() {
      const modal = document.getElementById('premium-success-modal');
      const processing = document.getElementById('premium-processing-stage');
      const celebration = document.getElementById(
        'premium-celebration-stage'
      );
      const card = document.getElementById('premium-success-card');

      if (!modal || !processing || !celebration || !card) return;

      clearSuccessExperienceTimers();

      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      processing.classList.remove('processing-hidden');
      celebration.classList.remove(
        'celebration-active',
        'celebration-complete'
      );
      card.classList.remove('success-card-visible');

      modal.removeAttribute('inert');
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('success-modal-open');
      document.body.style.overflow = 'hidden';
      refreshIcons();

      if (reduceMotion) {
        processing.classList.add('processing-hidden');
        celebration.classList.add('celebration-complete');
        card.classList.add('success-card-visible');
        activateDialog(modal, card);
        return;
      }

      successProcessingTimer = window.setTimeout(() => {
        processing.classList.add('processing-hidden');
        celebration.classList.add('celebration-active');
        successProcessingTimer = null;

        successCelebrationTimer = window.setTimeout(() => {
          celebration.classList.add('celebration-complete');
          card.classList.add('success-card-visible');
          activateDialog(modal, card);
          successCelebrationTimer = null;
        }, 2300);
      }, 1000);
    }

    function closePremiumSuccessModal() {
      const modal = document.getElementById('premium-success-modal');
      const processing = document.getElementById('premium-processing-stage');
      const celebration = document.getElementById(
        'premium-celebration-stage'
      );
      const card = document.getElementById('premium-success-card');

      if (!modal || !processing || !celebration || !card) return;

      clearSuccessExperienceTimers();

      modal.classList.remove('success-modal-open');
      processing.classList.remove('processing-hidden');
      celebration.classList.remove(
        'celebration-active',
        'celebration-complete'
      );
      card.classList.remove('success-card-visible');
      deactivateDialog(modal);
      document.body.style.overflow = '';
    }

    function returnHomeAfterSuccess() {
      closePremiumSuccessModal();
      document.getElementById('home')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    function placeAnotherOrder() {
      closePremiumSuccessModal();
      document.getElementById('products')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    // Continue the correct website flow after returning from WhatsApp
    function continueWebsiteOrder() {
      const pending = getPendingWhatsAppOrder();
      const isBulkOrder = pending?.type === 'bulk';

      safeSessionStorage.remove('primepops-awaiting-whatsapp-return');
      safeSessionStorage.remove('primepops-pending-whatsapp-order');
      hideWhatsAppReturnModal();

      // Bulk enquiries continue entirely on WhatsApp, so returning to the
      // website should not push the customer into the retail menu checkout.
      if (isBulkOrder) return;

      document.getElementById('menu-checkout')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    function maybeShowWhatsAppReturnPrompt() {
      if (safeSessionStorage.get('primepops-awaiting-whatsapp-return') !== 'true') return;
      const launchedAt = window.primePopsWhatsAppLaunchTime || getPendingWhatsAppOrder()?.launchedAt || 0;
      if (Date.now() - launchedAt < 1200) return;
      showWhatsAppReturnModal();
    }

    function setTheme(isDark){ document.documentElement.classList.toggle('dark', isDark); safeLocalStorage.set('primepops-theme', isDark ? 'dark' : 'light'); document.querySelectorAll('.theme-icon').forEach(icon=>{ icon.classList.remove('theme-icon-spin'); void icon.offsetWidth; icon.classList.add('theme-icon-spin'); icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon'); }); refreshIcons(); }
    function toggleTheme(){ setTheme(!document.documentElement.classList.contains('dark')); }

    document.addEventListener('DOMContentLoaded', ()=>{
      const saved=safeLocalStorage.get('primepops-theme'); if(saved==='dark') document.documentElement.classList.add('dark');
      refreshIcons();
      document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
      document.getElementById('theme-toggle-desktop')?.addEventListener('click', toggleTheme);

      const mobileMenuBtn=document.getElementById('mobile-menu-btn'); const mobileMenu=document.getElementById('mobile-menu');
      const setMobileMenu=(open)=>{ mobileMenu.classList.toggle('open', open); mobileMenuBtn.classList.toggle('open', open); mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true'); };
      mobileMenuBtn.addEventListener('click',()=>setMobileMenu(!mobileMenu.classList.contains('open')));
      document.querySelectorAll('.mobile-link').forEach(link=>link.addEventListener('click',()=>setMobileMenu(false)));

      document.querySelectorAll('.menu-pack-card').forEach(card => {
        card.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          if (event.target.closest('button')) return;
          event.preventDefault();
          const packId = card.id.replace('pack-', '');
          if (menuPacks[packId]) selectPack(packId);
        });
      });

      const orderModal = document.getElementById('order-modal');
      const orderCard = document.getElementById('modal-card');
      const returnModal = document.getElementById('whatsapp-return-modal');
      const returnCard = document.getElementById('whatsapp-return-card');
      const successModal = document.getElementById('premium-success-modal');
      const successCard = document.getElementById('premium-success-card');

      document.addEventListener('keydown', event => {
        trapDialogFocus(event, orderModal, orderCard, closeModal);
        trapDialogFocus(event, returnModal, returnCard, continueWebsiteOrder);
        trapDialogFocus(
          event,
          successModal,
          successCard,
          closePremiumSuccessModal
        );
      });

      const navbar=document.getElementById('navbar'); const progress=document.getElementById('scroll-progress'); const navLinks=document.querySelectorAll('.nav-link'); const sections=document.querySelectorAll('section, footer'); let ticking=false;
      function onScroll(){ if(!ticking){ requestAnimationFrame(()=>{ const y=window.scrollY; navbar.classList.toggle('glass-nav', y>40); navbar.classList.toggle('shadow-md', y>40); navbar.classList.toggle('bg-transparent', y<=40); const max=document.documentElement.scrollHeight-window.innerHeight; progress.style.width=max>0?`${(y/max)*100}%`:'0%'; let current='home'; sections.forEach(s=>{ if(y>=s.offsetTop-170) current=s.id; }); if(window.innerHeight+y>=document.documentElement.scrollHeight-50) current='footer'; navLinks.forEach(link=>{ link.classList.toggle('active', link.getAttribute('href')===`#${current}`); }); ticking=false; }); ticking=true; } }
      window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

      const revealElements=document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
      const revealObserver=new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('show');
            revealObserver.unobserve(entry.target);
          }
        });
      },{threshold:.1, rootMargin:'0px 0px -55px 0px'});
      revealElements.forEach(el=>revealObserver.observe(el));

      const animatedSections=document.querySelectorAll('main > section, footer');
      const sectionObserver=new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('section-visible');
            sectionObserver.unobserve(entry.target);
          }
        });
      },{threshold:.06, rootMargin:'0px 0px -45px 0px'});

      animatedSections.forEach((section,index)=>{
        section.classList.add('section-scroll-reveal');
        if(index===0){
          requestAnimationFrame(()=>section.classList.add('section-visible'));
        } else {
          sectionObserver.observe(section);
        }
      });

      window.addEventListener('focus', () => window.setTimeout(maybeShowWhatsAppReturnPrompt, 250));
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') window.setTimeout(maybeShowWhatsAppReturnPrompt, 250);
      });
    });
