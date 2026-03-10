!(function () {
  try {
    var SPA_URL = 'https://phoneware.github.io/otp-reset/';
    var SPA_ORIGIN = 'https://phoneware.github.io';

    // Only run in NS Manager Portal
    if (typeof omp_level === 'undefined') {
      return;
    }

    var domain = typeof current_domain !== 'undefined' ? current_domain : null;

    // Add "OTP Reset" menu item to admin tools dropdown
    var toolbar = document.querySelector('.user-toolbar');
    if (toolbar) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="/portal/home?module=otp-reset" class="header-link">OTP Reset</a>';
      toolbar.appendChild(li);
    } else {
      console.warn('OTP Reset: .user-toolbar not found, skipping menu item');
    }

    // Check if we should load the OTP Reset module
    var params = new URLSearchParams(window.location.search);
    if (
      window.location.pathname !== '/portal/home' ||
      params.get('module') !== 'otp-reset'
    ) {
      return;
    }

    var contentEl = document.getElementById('content');
    if (!contentEl) {
      return;
    }

    contentEl.innerHTML = '';

    var token = localStorage.getItem('ns_t');
    if (!token) {
      contentEl.innerHTML =
        '<div style="padding:40px;text-align:center;">' +
        '<h3 style="color:#d9534f;">Authentication Error</h3>' +
        '<p>Could not read authentication token. Please log in again.</p>' +
        '</div>';
      return;
    }

    // Create and insert iframe
    var iframe = document.createElement('iframe');
    iframe.id = 'otp-reset-frame';
    iframe.src = SPA_URL;
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.minHeight = '400px';
    iframe.scrolling = 'no';
    contentEl.appendChild(iframe);

    // Send auth data to iframe on load via postMessage
    iframe.onload = function () {
      iframe.contentWindow.postMessage(
        { type: 'init', token: token, domain: domain },
        SPA_ORIGIN
      );
    };

    // Listen for setHeight messages from iframe
    window.addEventListener('message', function (event) {
      if (event.origin !== SPA_ORIGIN) {
        return;
      }
      var data = event.data;
      if (data && data.type === 'setHeight') {
        var height = data.height;
        if (height > 1200) {
          height = 1200;
        }
        var frame = document.getElementById('otp-reset-frame');
        if (frame) {
          frame.style.height = height + 'px';
        }
      }
    });
  } catch (e) {
    // Silent exit - do not break non-portal pages
  }
})();
