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

    // Wait for portal to finish initializing before replacing content
    function loadOtpModule() {
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
    }

    // Defer until after portal scripts finish (avoids "Container is not defined" from chart libs)
    if (document.readyState === 'complete') {
      setTimeout(loadOtpModule, 0);
    } else {
      window.addEventListener('load', loadOtpModule);
    }

    var API_BASE = 'https://edge.phoneware.cloud';

    // Listen for messages from iframe
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
      // Proxy API requests from iframe to avoid CORS
      if (data && data.type === 'apiRequest') {
        handleApiRequest(data, event.source);
      }
    });

    function handleApiRequest(data, source) {
      var promise;
      if (data.action === 'getPhone') {
        promise = fetch(API_BASE + '/ns-api/v2/phones/' + data.mac, {
          headers: { Authorization: 'Bearer ' + data.token },
        }).then(function (res) {
          if (res.status === 404) throw new Error('NOT_FOUND');
          if (res.status === 401 || res.status === 403) {
            var token = localStorage.getItem('ns_t');
            if (token) {
              try {
                var payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp && payload.exp > Date.now() / 1000) {
                  throw new Error('ACCESS_DENIED');
                }
              } catch (e) {
                if (e.message === 'ACCESS_DENIED') throw e;
              }
            }
            throw new Error('SESSION_EXPIRED');
          }
          if (!res.ok) throw new Error('NETWORK_ERROR');
          return res.json();
        });
      } else if (data.action === 'enableOtp') {
        var body = Object.assign({}, data.phone, { 'global-one-time-pass': 'yes' });
        promise = fetch(API_BASE + '/ns-api/v2/domains/' + data.domain + '/phones', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + data.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }).then(function (res) {
          if (res.status === 401 || res.status === 403) {
            var putToken = localStorage.getItem('ns_t');
            if (putToken) {
              try {
                var putPayload = JSON.parse(atob(putToken.split('.')[1]));
                if (putPayload.exp && putPayload.exp > Date.now() / 1000) {
                  throw new Error('ACCESS_DENIED');
                }
              } catch (e) {
                if (e.message === 'ACCESS_DENIED') throw e;
              }
            }
            throw new Error('SESSION_EXPIRED');
          }
          if (!res.ok) throw new Error('NETWORK_ERROR');
          return { ok: true };
        });
      } else {
        return;
      }
      promise
        .then(function (result) {
          source.postMessage({ type: 'apiResponse', id: data.id, result: result }, SPA_ORIGIN);
        })
        .catch(function (err) {
          source.postMessage({ type: 'apiResponse', id: data.id, error: err.message }, SPA_ORIGIN);
        });
    }
  } catch (e) {
    // Silent exit - do not break non-portal pages
  }
})();
