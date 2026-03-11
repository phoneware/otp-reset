// =====================================
// Phoneware Portal Extra Toolbar Menus
// =====================================
if (typeof $ === 'undefined') {
  console.error('jQuery is not available. Cannot add toolbar links or modify login box.');
} else {
  if (typeof $.fn.dropdown === 'undefined') {
    console.log('Bootstrap JS not found. Loading Bootstrap dynamically...');
    var script = document.createElement('script');
    script.src = 'https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js';
    script.onload = function() {
      console.log('Bootstrap JS loaded dynamically.');
      addToolbarLinks();
    };
    script.onerror = function() {
      console.error('Failed to load Bootstrap JS dynamically. Dropdown may not function.');
      addToolbarLinks(); // Proceed anyway
    };
    document.head.appendChild(script);
  } else {
    addToolbarLinks();
  }

  function addToolbarLinks() {
    $(document).ready(function() {
      var $toolbar = $('.user-toolbar');
      if ($toolbar.length === 0) {
        console.error('User toolbar (.user-toolbar) not found. Using body instead.');
        $toolbar = $('body');
        var style = document.createElement('style');
        style.innerHTML =
          '.header-link { color:#fff; background:#333; padding:10px 15px; text-decoration:none; display:inline-block; margin:5px; } ' +
          '.header-link:hover { background:#555; } ' +
          '.dropdown-menu { background:#fff; border:1px solid #ccc; } ' +
          '.dropdown-menu li a { color:#333; padding:5px 10px; display:block; } ' +
          '.dropdown-menu li a:hover { background:#f0f0f0; }';
        document.head.appendChild(style);
      }

      //
      // ---- MENUS ----
      //

      // ---- Docs Dropdown ----
      var docsMenu =
        '<li class="dropdown">' +
          '<a href="#" class="dropdown-toggle header-link" data-toggle="dropdown">' +
            'Docs <span class="caret"></span>' +
          '</a>' +
          '<ul class="dropdown-menu" role="menu">' +
            '<li><a href="https://documentation.netsapiens.com" target="_blank">Documentation</a></li>' +
            '<li><a href="https://docs.ns-api.com/reference/" target="_blank">API Docs</a></li>' +
            '<li><a href="https://forum.netsapiens.com/" target="_blank">Forum</a></li>' +
            '<li><a href="https://netsapiens.zendesk.com/auth/v2/login/signin" target="_blank">SnapSupport</a></li>' +
            '<li><a href="https://netsapiens.myabsorb.com/#/login" target="_blank">SnapAcademy</a></li>' +
          '</ul>' +
        '</li>';

      // ---- Admin UI Dropdown ----
      var adminTools =
        '<li class="dropdown">' +
          '<a href="https://core1-phx.phoneware.zone/admin" class="dropdown-toggle header-link" data-toggle="dropdown">' +
            'Admin UI <span class="caret"></span>' +
          '</a>' +
          '<ul class="dropdown-menu" role="menu">' +
            '<li><a href="https://phoneware.zone/SiPbx/adminlogin.php" target="_blank">SiPbx (Core) Admin (NMS)</a></li>' +
            '<li><a href="https://endpoints1-phx.phoneware.zone/ndp/adminlogin.php" target="_blank">NDP (Endpoints) Admin</a></li>' +
            '<li><a href="https://recording1-phx.phoneware.zone/LiCf/adminlogin.php" target="_blank">LiCf (Recording) Admin</a></li>' +
            '<li><a href="https://insight.netsapiens.com" target="_blank">Insight</a></li>' +
            '<li><a href="https://qos1-phx.phoneware.zone/" target="_blank">QoS</a></li>' +
          '</ul>' +
        '</li>';

      // ---- RPS Dropdown (includes OTP Reset after divider) ----
      var rpsMenu =
        '<li class="dropdown">' +
          '<a href="#" class="dropdown-toggle header-link" data-toggle="dropdown">' +
            'RPS <span class="caret"></span>' +
          '</a>' +
          '<ul class="dropdown-menu" role="menu">' +
            '<li><a href="https://us.ymcs.yealink.com/manager/login" target="_blank">Yealink YMCS</a></li>' +
            '<li><a href="https://gdms.cloud" target="_blank">Grandstream GDMS</a></li>' +
            '<li><a href="http://partner.ztp.poly.com/" target="_blank">Poly ZTP</a></li>' +
            '<li role="separator" class="divider"></li>' +
            '<li><a href="/portal/home?module=otp-reset">OTP Reset</a></li>' +
          '</ul>' +
        '</li>';

      //
      // ---- Add menus (last prepend = leftmost) ----
      //
      $toolbar.prepend(rpsMenu);
      $toolbar.prepend(docsMenu);
      $toolbar.prepend(adminTools);

      //
      // ---- Login box styling ----
      //
      var $loginBox = $('#login-box');
      if ($loginBox.length) {
        $loginBox.css('background-color', '#FFFFFF');
      }
    });
  }
}

/************************************
 * OTP Reset Module (Inline - Self-Contained)
 ************************************/
!(function () {
  try {
    if (typeof omp_level === 'undefined') return;

    // domain is read dynamically at lookup time to reflect current portal context
    function getCurrentDomain() { return typeof current_domain !== 'undefined' ? current_domain : null; }
    var domain = getCurrentDomain();
    var API_BASE = 'https://' + window.location.hostname;

    var params = new URLSearchParams(window.location.search);
    if (
      window.location.pathname !== '/portal/home' ||
      params.get('module') !== 'otp-reset'
    ) return;

    // ---- Styles ----
    var style = document.createElement('style');
    style.innerHTML = [
      '#otp-module { max-width: 640px; margin: 30px auto; font-family: inherit; }',
      '#otp-module h2 { font-size: 22px; font-weight: 600; color: #222; margin: 0 0 6px; }',
      '#otp-module .otp-subtitle { color: #666; font-size: 14px; margin: 0 0 16px; }',
      '#otp-module .otp-card { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 18px 20px; margin-bottom: 18px; }',
      '#otp-module .otp-user-line { font-size: 14px; color: #444; margin: 3px 0; }',
      '#otp-module .otp-user-line strong { color: #222; }',
      '#otp-module .otp-label { font-size: 13px; font-weight: 600; color: #444; margin: 0 0 6px; display: block; }',
      '#otp-module .otp-input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px dashed #aaa; border-radius: 4px; font-size: 14px; color: #333; outline: none; }',
      '#otp-module .otp-input:focus { border-color: #0099cc; border-style: solid; }',
      '#otp-module .otp-hint { font-size: 12px; color: #888; margin: 5px 0 0; }',
      '#otp-module .otp-btn { width: 100%; padding: 11px; background: #b0b8c1; color: #fff; border: none; border-radius: 4px; font-size: 15px; cursor: pointer; margin-top: 10px; transition: background 0.2s; }',
      '#otp-module .otp-btn:hover:not(:disabled) { background: #888; }',
      '#otp-module .otp-btn:disabled { opacity: 0.6; cursor: not-allowed; }',
      '#otp-module .otp-btn-enable { background: #0099cc; }',
      '#otp-module .otp-btn-enable:hover:not(:disabled) { background: #007aa3; }',
      '#otp-module .otp-btn-disable { background: #c0392b; }',
      '#otp-module .otp-btn-disable:hover:not(:disabled) { background: #a93226; }',
      '#otp-module .otp-btn-back { background: #888; }',
      '#otp-module .otp-btn-back:hover:not(:disabled) { background: #666; }',
      '#otp-module .otp-device-card { background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px; padding: 16px 20px; margin-bottom: 16px; }',
      '#otp-module .otp-device-row { display: flex; justify-content: space-between; font-size: 14px; padding: 5px 0; border-bottom: 1px solid #eee; }',
      '#otp-module .otp-device-row:last-child { border-bottom: none; }',
      '#otp-module .otp-device-row .otp-dkey { color: #666; }',
      '#otp-module .otp-device-row .otp-dval { color: #222; font-weight: 500; }',
      '#otp-module .otp-status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }',
      '#otp-module .otp-badge-enabled { background: #d4edda; color: #155724; }',
      '#otp-module .otp-badge-disabled { background: #f8d7da; color: #721c24; }',
      '#otp-module .otp-alert { padding: 14px 16px; border-radius: 5px; font-size: 14px; margin-bottom: 14px; }',
      '#otp-module .otp-alert-error { background: #fff3cd; border: 1px solid #ffc107; color: #856404; }',
      '#otp-module .otp-alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }',
      '#otp-module .otp-alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }',
      '#otp-module .otp-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: otp-spin 0.7s linear infinite; vertical-align: middle; margin-right: 6px; }',
      '@keyframes otp-spin { to { transform: rotate(360deg); } }',
      // Help panel
      '#otp-module .otp-help-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #0099cc; cursor: pointer; border: none; background: none; padding: 0; margin-bottom: 18px; text-decoration: underline; }',
      '#otp-module .otp-help-panel { background: #f0f7fb; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px 22px; margin-bottom: 20px; font-size: 13px; color: #333; line-height: 1.6; }',
      '#otp-module .otp-help-panel h3 { margin: 0 0 10px; font-size: 15px; color: #0c5460; }',
      '#otp-module .otp-help-panel h4 { margin: 16px 0 6px; font-size: 13px; color: #0c5460; text-transform: uppercase; letter-spacing: 0.04em; }',
      '#otp-module .otp-help-panel p { margin: 0 0 10px; }',
      '#otp-module .otp-help-panel ul { margin: 0 0 10px; padding-left: 18px; }',
      '#otp-module .otp-help-panel li { margin-bottom: 4px; }',
      // Flow diagram
      '#otp-flow { margin: 14px 0 4px; }',
      '#otp-flow .otp-flow-step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }',
      '#otp-flow .otp-flow-node { min-width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; background: #0099cc; flex-shrink: 0; margin-top: 2px; }',
      '#otp-flow .otp-flow-node.otp-node-warn { background: #e67e22; }',
      '#otp-flow .otp-flow-node.otp-node-ok { background: #27ae60; }',
      '#otp-flow .otp-flow-node.otp-node-err { background: #c0392b; }',
      '#otp-flow .otp-flow-text { font-size: 13px; color: #333; padding-top: 5px; }',
      '#otp-flow .otp-flow-text strong { color: #0c5460; }',
      '#otp-flow .otp-flow-arrow { text-align: center; color: #aaa; font-size: 16px; line-height: 1; margin: 0 0 4px 8px; }',
      '#otp-flow .otp-flow-branch { display: flex; gap: 10px; margin: 4px 0 4px 40px; }',
      '#otp-flow .otp-flow-branch-item { flex: 1; border-radius: 5px; padding: 8px 10px; font-size: 12px; line-height: 1.5; }',
      '#otp-flow .otp-flow-branch-yes { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }',
      '#otp-flow .otp-flow-branch-no { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }'
    ].join('\n');
    document.head.appendChild(style);

    // ---- State ----
    var token = null;
    var currentPhone = null;
    var currentDomainForPhone = null;
    var helpOpen = false;

    // ---- Boot ----
    function init() {
      token = localStorage.getItem('ns_t');
      var contentEl = document.getElementById('content');
      if (!contentEl) return;
      contentEl.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.id = 'otp-module';
      contentEl.appendChild(wrap);
      renderLookup(wrap);
    }

    // ---- Help Panel HTML ----
    function helpPanelHtml() {
      return (
        '<div class="otp-help-panel" id="otp-help-panel">' +
          '<h3>&#9432; What is Global OTP and when should you use it?</h3>' +
          '<p><strong>Global One-Time Password (OTP)</strong> is a provisioning security feature that allows a phone that has been <strong>factory reset</strong> to successfully re-provision itself from scratch — without requiring manual credential entry.</p>' +
          '<p>Normally, after a factory reset, a phone loses its provisioning password and cannot authenticate with the provisioning server. Enabling OTP temporarily relaxes this restriction for one provisioning cycle.</p>' +
          '<h4>When to use it</h4>' +
          '<p>Enable Global OTP <strong>before factory resetting an already-deployed phone</strong> so that it can re-provision as if it were newly added — without having to delete and re-add it to inventory or manually update the provisioning credentials in the manufacturer\'s redirect service. With OTP enabled, the phone can obtain its provisioning data using the one-time password upon its next boot.</p>' +
          '<h4>How it works — Provisioning Flow</h4>' +
          '<div id="otp-flow">' +
            flowStep('1', '', 'default', '<strong>Factory-reset phone</strong> contacts the manufacturer\'s <strong>RPS / Redirect Server</strong>.') +
            flowArrow() +
            flowStep('2', '', 'default', '<strong>RPS</strong> responds with the provisioning server URL, username, and a <strong>one-time password</strong>.') +
            flowArrow() +
            flowStep('3', '', 'default', '<strong>Phone contacts</strong> the NetSapiens Device Provisioning (NDP) server and presents its username and OTP.') +
            flowArrow() +
            flowStep('4', '?', 'warn', 'NetSapiens Device Provisioning (NDP) server checks credentials and evaluates the <strong>Global OTP setting</strong> for this device.') +
            '<div class="otp-flow-branch">' +
              '<div class="otp-flow-branch-item otp-flow-branch-yes">&#10003; <strong>OTP Enabled</strong><br>Credentials accepted. Phone receives its full config. The delivered config contains a <em>new permanent provisioning password</em> and OTP is automatically disabled.</div>' +
              '<div class="otp-flow-branch-item otp-flow-branch-no">&#10007; <strong>OTP Disabled</strong><br>Request rejected. Phone does not provision. Manual intervention required.</div>' +
            '</div>' +
          '</div>' +
          '<h4>After provisioning</h4>' +
          '<p>OTP is automatically disabled by the NDP server after a successful config delivery. You only need to manually disable it if provisioning did not complete and you want to lock the device back down.</p>' +
        '</div>'
      );
    }

    function flowStep(num, label, type, text) {
      var nodeClass = 'otp-flow-node' +
        (type === 'warn' ? ' otp-node-warn' : type === 'ok' ? ' otp-node-ok' : type === 'err' ? ' otp-node-err' : '');
      return '<div class="otp-flow-step"><div class="' + nodeClass + '">' + num + '</div><div class="otp-flow-text">' + text + '</div></div>';
    }

    function flowArrow() {
      return '<div class="otp-flow-arrow">&#8595;</div>';
    }

    // ---- Render: Lookup Form ----
    function renderLookup(wrap) {
      var ext = typeof current_user !== 'undefined' ? current_user : '';
      var role = typeof nms_role !== 'undefined' ? nms_role : '';
      var territory = typeof current_reseller !== 'undefined' ? current_reseller : '';
      var dom = domain || '';

      wrap.innerHTML =
        '<h2>Enable / Disable Global OTP</h2>' +
        '<p class="otp-subtitle">Look up a device to manage its Global One-Time Password setting.</p>' +
        '<button class="otp-help-toggle" id="otp-help-btn">&#9432; ' + (helpOpen ? 'Hide Help' : 'What is OTP and how does it work?') + '</button>' +
        (helpOpen ? helpPanelHtml() : '') +
        '<div id="otp-alert-area"></div>' +
        '<label class="otp-label" for="otp-mac-input">MAC Address</label>' +
        '<input id="otp-mac-input" class="otp-input" type="text" placeholder="00:A1:B2:C3:D4:E5" autocomplete="off" />' +
        '<p class="otp-hint">With or without colons/dashes. Auto-stripped.</p>' +
        '<button id="otp-lookup-btn" class="otp-btn otp-btn-enable">Look Up Device</button>';

      document.getElementById('otp-help-btn').addEventListener('click', function () {
        helpOpen = !helpOpen;
        renderLookup(wrap);
      });
      document.getElementById('otp-lookup-btn').addEventListener('click', function () {
        doLookup(wrap);
      });
      document.getElementById('otp-mac-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doLookup(wrap);
      });
    }

    // ---- Lookup Action ----
    function doLookup(wrap) {
      domain = getCurrentDomain(); // refresh domain to reflect current portal context
      var raw = document.getElementById('otp-mac-input').value.trim();
      var mac = raw.replace(/[:\-\.]/g, '').toUpperCase();

      if (mac.length !== 12) {
        showAlert('otp-alert-area', 'error', 'Please enter a valid 12-character MAC address.');
        return;
      }
      if (!token) {
        showAlert('otp-alert-area', 'error', 'Authentication token not found. Please log in again.');
        return;
      }

      var btn = document.getElementById('otp-lookup-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="otp-spinner"></span>Looking up...';
      clearAlert('otp-alert-area');

      // NS API stores MACs inconsistently by brand — try uppercase then lowercase
      var macUpper = mac.toUpperCase();
      var macLower = mac.toLowerCase();

      function fetchPhone(macVal) {
        return fetch(API_BASE + '/ns-api/v2/phones/' + macVal, {
          headers: { Authorization: 'Bearer ' + token }
        }).then(function (res) {
          if (res.status === 404) throw new Error('NOT_FOUND');
          if (res.status === 403) throw new Error('OUT_OF_SCOPE');
          if (res.status === 401) {
            try {
              var payload = JSON.parse(atob(token.split('.')[1]));
              if (payload.exp && payload.exp < Date.now() / 1000) {
                throw new Error('SESSION_EXPIRED');
              }
            } catch (e) {
              if (e.message === 'SESSION_EXPIRED') throw e;
            }
            throw new Error('OUT_OF_SCOPE');
          }
          if (!res.ok) throw new Error('NETWORK_ERROR');
          return res.json();
        }).then(function (phone) {
          if (!phone || typeof phone !== 'object') {
            throw new Error('NOT_FOUND');
          }
          // Full record — all good
          if (phone['device-provisioning-mac-address']) {
            return phone;
          }
          // Stub record — device may exist in domain, check domain phone list
          return fetch(API_BASE + '/ns-api/v2/domains/' + encodeURIComponent(domain) + '/phones?limit=1000', {
            headers: { Authorization: 'Bearer ' + token }
          }).then(function (res) {
            if (!res.ok) throw new Error('NOT_FOUND');
            return res.json();
          }).then(function (list) {
            // Domain phone list may be array or object with items array
            var phones = Array.isArray(list) ? list : (list.items || list.data || []);
            var macLookup = macVal.toLowerCase().replace(/[^a-f0-9]/g, '');
            var found = phones.some(function (p) {
              var m = (p['mac-address'] || p['mac'] || p['device-provisioning-mac-address'] || '').toLowerCase().replace(/[^a-f0-9]/g, '');
              return m === macLookup;
            });
            if (found) {
              throw new Error('STUB_RECORD');
            }
            throw new Error('NOT_FOUND');
          });
        });
      }

      fetchPhone(macUpper)
        .catch(function (err) {
          if (err.message === 'NOT_FOUND') return fetchPhone(macLower);
          throw err;
        })
        .then(function (phone) {
          currentPhone = phone;
          currentDomainForPhone = phone.domain || domain;
          renderDeviceResult(wrap, phone);
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.innerHTML = 'Look Up Device';
          if (err.message === 'NOT_FOUND') {
            showAlert('otp-alert-area', 'error', 'No device found for MAC address <strong>' + escHtml(raw) + '</strong> in domain <strong>' + escHtml(domain || '') + '</strong>.');
          } else if (err.message === 'STUB_RECORD') {
            showAlert('otp-alert-area', 'error', 'Device <strong>' + escHtml(raw) + '</strong> exists in this domain but its provisioning data could not be retrieved. OTP management is not available for this device.');
          } else if (err.message === 'NO_OTP_SUPPORT') {
            showAlert('otp-alert-area', 'error', 'Device <strong>' + escHtml(raw) + '</strong> exists but its provisioning data could not be retrieved. OTP management is not available for this device.');
          } else if (err.message === 'OUT_OF_SCOPE') {
            showAlert('otp-alert-area', 'error', 'The device <strong>' + escHtml(raw) + '</strong> does not reside within your scope. You may only manage devices you have been granted access to.');
          } else if (err.message === 'SESSION_EXPIRED') {
            showAlert('otp-alert-area', 'error', 'Your session has expired. Please refresh and log in again.');
          } else {
            showAlert('otp-alert-area', 'error', 'Network error. Please try again.');
          }
        });
    }

    // ---- Render: Device Result ----
    function renderDeviceResult(wrap, phone) {
      var otpEnabled = (phone['global-one-time-pass'] === 'yes');
      var otpBadge = otpEnabled
        ? '<span class="otp-status-badge otp-badge-enabled">Enabled</span>'
        : '<span class="otp-status-badge otp-badge-disabled">Disabled</span>';

      // Parse line 1 user from sip URI e.g. "sip:222@Phoneware" -> "222@Phoneware"
      var sipUri1 = phone['device-provisioning-sip-uri-1'] || '';
      var line1 = sipUri1.replace(/^sip:/, '') || '\u2014';

      // Brand and model is a single combined field e.g. "Yealink SIP-T54W"
      var brandModel = phone['device-models-brand-and-model'] || '\u2014';
      var brandModelParts = brandModel !== '\u2014' ? brandModel.split(' ') : [];
      var manufacturer = brandModelParts.length > 0 ? brandModelParts[0] : '\u2014';
      var model = brandModelParts.length > 1 ? brandModelParts.slice(1).join(' ') : '\u2014';

      var macDisplay = formatMac(phone['device-provisioning-mac-address'] || '');

      wrap.innerHTML =
        '<h2>Enable / Disable Global OTP</h2>' +
        '<p class="otp-subtitle">Look up a device to manage its Global One-Time Password setting.</p>' +
        '<div id="otp-alert-area"></div>' +
        '<div class="otp-device-card">' +
          deviceRow('MAC Address', escHtml(macDisplay)) +
          deviceRow('Domain', escHtml(phone['domain'] || '\u2014')) +
          deviceRow('Manufacturer', escHtml(manufacturer)) +
          deviceRow('Model', escHtml(model)) +
          deviceRow('Line 1 User', escHtml(line1)) +
          deviceRow('Global OTP', otpBadge) +
        '</div>' +
        (otpEnabled
          ? '<div class="otp-alert otp-alert-info" style="margin-bottom:10px;">Global OTP is currently <strong>enabled</strong>. The phone will be allowed to provision on its next attempt. Disable it below if you want to lock the device back down before provisioning occurs.</div>' +
            '<button id="otp-disable-btn" class="otp-btn otp-btn-disable">Disable One-Time Password</button>'
          : '<div class="otp-alert otp-alert-info" style="margin-bottom:10px;">Global OTP is currently <strong>disabled</strong>. Enable it below to allow this device to re-provision after a factory reset.</div>' +
            '<button id="otp-enable-btn" class="otp-btn otp-btn-enable">Enable One-Time Password</button>'
        ) +
        '<button id="otp-back-btn" class="otp-btn otp-btn-back">&#8592; Look Up Another Device</button>';

      if (otpEnabled) {
        document.getElementById('otp-disable-btn').addEventListener('click', function () {
          doSetOtp(wrap, phone, false);
        });
      } else {
        document.getElementById('otp-enable-btn').addEventListener('click', function () {
          doSetOtp(wrap, phone, true);
        });
      }
      document.getElementById('otp-back-btn').addEventListener('click', function () {
        renderLookup(wrap);
      });
    }

    // ---- Enable/Disable OTP Action ----
    function doSetOtp(wrap, phone, enable) {
      var btnId = enable ? 'otp-enable-btn' : 'otp-disable-btn';
      var btn = document.getElementById(btnId);
      btn.disabled = true;
      btn.innerHTML = '<span class="otp-spinner"></span>' + (enable ? 'Enabling...' : 'Disabling...');
      clearAlert('otp-alert-area');

      var body = Object.assign({}, phone, { 'global-one-time-pass': enable ? 'yes' : 'no' });

      fetch(API_BASE + '/ns-api/v2/domains/' + encodeURIComponent(currentDomainForPhone) + '/phones', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
        .then(function (res) {
          if (res.status === 403) throw new Error('OUT_OF_SCOPE');
          if (res.status === 401) {
            try {
              var payload = JSON.parse(atob(token.split('.')[1]));
              if (payload.exp && payload.exp < Date.now() / 1000) {
                throw new Error('SESSION_EXPIRED');
              }
            } catch (e) {
              if (e.message === 'SESSION_EXPIRED') throw e;
            }
            throw new Error('OUT_OF_SCOPE');
          }
          if (!res.ok) throw new Error('NETWORK_ERROR');
          renderConfirmation(wrap, phone, enable);
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.innerHTML = enable ? 'Enable One-Time Password' : 'Disable One-Time Password';
          if (err.message === 'OUT_OF_SCOPE') {
            showAlert('otp-alert-area', 'error', 'You do not have permission to modify this device. You may only manage devices you have been granted access to.');
          } else if (err.message === 'SESSION_EXPIRED') {
            showAlert('otp-alert-area', 'error', 'Your session has expired. Please refresh and log in again.');
          } else {
            showAlert('otp-alert-area', 'error', 'Failed to ' + (enable ? 'enable' : 'disable') + ' OTP. Please try again.');
          }
        });
    }

    // ---- Render: Confirmation ----
    function renderConfirmation(wrap, phone, enabled) {
      var macDisplay = formatMac(phone['device-provisioning-mac-address'] || '');
      var sipUri1 = phone['device-provisioning-sip-uri-1'] || '';
      var line1 = sipUri1.replace(/^sip:/, '') || '\u2014';

      var msg = enabled
        ? '&#10003; <strong>OTP Enabled.</strong> Device <strong>' + escHtml(macDisplay) + '</strong>' + (line1 !== '\u2014' ? ' (User: <strong>' + escHtml(line1) + '</strong>)' : '') + ' is now authorized to provision on its next attempt. OTP will be automatically disabled after a successful provisioning.'
        : '&#10003; <strong>OTP Disabled.</strong> Device <strong>' + escHtml(macDisplay) + '</strong>' + (line1 !== '\u2014' ? ' (User: <strong>' + escHtml(line1) + '</strong>)' : '') + ' has been locked. It will not be allowed to provision until OTP is re-enabled.';

      wrap.innerHTML =
        '<h2>Enable / Disable Global OTP</h2>' +
        '<p class="otp-subtitle">Look up a device to manage its Global One-Time Password setting.</p>' +
        '<div class="otp-alert otp-alert-success">' + msg + '</div>' +
        '<button id="otp-again-btn" class="otp-btn otp-btn-enable">Look Up Another Device</button>';

      document.getElementById('otp-again-btn').addEventListener('click', function () {
        renderLookup(wrap);
      });
    }

    // ---- Helpers ----
    function deviceRow(label, value) {
      return '<div class="otp-device-row"><span class="otp-dkey">' + label + '</span><span class="otp-dval">' + value + '</span></div>';
    }

    function showAlert(id, type, msg) {
      var el = document.getElementById(id);
      if (!el) return;
      var cls = type === 'error' ? 'otp-alert-error' : type === 'success' ? 'otp-alert-success' : 'otp-alert-info';
      el.innerHTML = '<div class="otp-alert ' + cls + '">' + msg + '</div>';
    }

    function clearAlert(id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '';
    }

    function escHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatMac(mac) {
      var clean = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      if (clean.length === 12) return clean.match(/.{2}/g).join(':');
      return mac;
    }

    if (document.readyState === 'complete') {
      setTimeout(init, 0);
    } else {
      window.addEventListener('load', function () {
        setTimeout(init, 100);
      });
    }
  } catch (e) {
    // Silent exit
  }
})();
