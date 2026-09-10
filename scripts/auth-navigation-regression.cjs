/**
 * Focused rendered logout regression, with all external requests mocked.
 * Requires a development server and a dedicated Chrome debugging session:
 * node scripts/auth-navigation-regression.cjs http://localhost:4200 9332
 * Uses Node's built-in WebSocket; no test dependencies or real credentials.
 */
const assert = require('node:assert/strict');
const origin = process.argv[2] || 'http://localhost:4200';
const port = process.argv[3] || '9332';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const target = await (await fetch(
    'http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' }
  )).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.onopen = resolve);
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  const requests = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const user = {
    _id: '111111111111111111111111', username: 'Navigation Test',
    email: 'navigation@example.test', currency: 'USD', salary: [],
    roles: ['user'], isActive: true,
  };
  const token = 'header.' + Buffer.from(JSON.stringify({ exp: 4102444800 })).toString('base64url') + '.fixture';
  ws.onmessage = async event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id);
      pending.delete(message.id);
      message.error ? task.reject(message.error) : task.resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      const text = message.params.args.map(arg => arg.description || arg.value || '').join(' ');
      if (/commit|Global Error Handler/.test(text)) errors.push(text);
    }
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      const url = new URL(request.url);
      if (url.origin === origin) {
        await send('Fetch.continueRequest', { requestId });
        return;
      }
      requests.push(url.pathname);
      if (/\/user\/(login|logout)$/.test(url.pathname)) console.log('Mock request', url.pathname);
      // External scripts are mocked too; prevent Google bootstrap callbacks.
      let body = 'window.gapi = { load: function() {} };';
      if (url.pathname.includes('/v1/') || url.pathname.includes('/health')) {
        let data = [];
        if (url.pathname.endsWith('/user/me')) data = user;
        if (url.pathname.endsWith('/user/login')) {
          data = { user, accessToken: token, refreshToken: 'synthetic-refresh' };
        }
        if (url.pathname.includes('/totals')) data = { income: 0, expenses: 0, balance: 0 };
        body = JSON.stringify({ success: true, status: 'healthy', data });
      }
      await send('Fetch.fulfillRequest', {
        requestId, responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: body.startsWith('{') ? 'application/json' : 'text/javascript' },
          { name: 'Access-Control-Allow-Origin', value: origin },
          { name: 'Access-Control-Allow-Credentials', value: 'true' },
          { name: 'Access-Control-Allow-Headers', value: '*' },
          { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
        ],
        body: Buffer.from(body).toString('base64'),
      });
    }
  };
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 300; attempt++) {
      if (await evaluate(expression).catch(() => false)) return;
      await pause(100);
    }
    const detail = await evaluate("({url:location.pathname,form:document.querySelector('app-login') && {valid:ng.getComponent(document.querySelector('app-login')).loginForm.valid,email:ng.getComponent(document.querySelector('app-login')).loginForm.get('email').value,passwordLength:ng.getComponent(document.querySelector('app-login')).loginForm.get('password').value?.length},active:document.activeElement?.tagName,loader:!!document.querySelector('.custom-loader-overlay'),onboard:!!document.querySelector('app-onboarding')})");
    throw Error('Timed out: ' + expression + '\n' + JSON.stringify(detail) + '\n' + errors.slice(-2).join('\n'));
  };
  const visible = selector => "!![...document.querySelectorAll(" + JSON.stringify(selector) + ")].find(e => !e.classList.contains('ion-page-hidden') && !e.classList.contains('ion-page-invisible'))";
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setBypassServiceWorker', { bypass: true });
    await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: "localStorage.clear();sessionStorage.clear();localStorage.setItem('ewallet_auth_persistent','false');",
    });
    await send('Page.navigate', { url: origin + '/auth/login' });
    await waitFor(visible('app-login'));
    await evaluate("document.querySelector('app-onboarding') && ng.getComponent(document.querySelector('app-onboarding')).skip()");
    await waitFor("!document.querySelector('app-onboarding')");
    // Onboarding skip navigates to public Home; return through the actual Router.
    await evaluate("ng.getComponent(document.querySelector('app-side-menu')).router.navigateByUrl('/auth/login')");
    await waitFor("location.pathname === '/auth/login' && " + visible('app-login'));
    await evaluate("window.__outlet = document.querySelector('ion-router-outlet')");
    console.log('Login ready', await evaluate('location.pathname'));
    // Use the real Ionic input elements, input events, and submit control.
    for (const [selector, text] of [['ion-input#login-email', 'navigation@example.test'], ['ion-input#login-password', 'synthetic-password']]) {
      await evaluate('(async()=>{const input=await document.querySelector(' + JSON.stringify(selector) + ').getInputElement();input.focus();})()');
      await send('Input.insertText', { text });
      console.log('Typed', selector, await evaluate('location.pathname'));
    }
    console.log('Before submit', await evaluate("({url:location.pathname,valid:ng.getComponent(document.querySelector('app-login')).loginForm.valid,disabled:document.querySelector('app-login .auth-submit-button').disabled})"));
    await waitFor("!document.querySelector('app-login .auth-submit-button').disabled");
    await evaluate("document.querySelector('app-login .auth-submit-button').click()");
    await waitFor("location.pathname === '/home' && " + visible('app-home-page'));
    // Create protected route history before returning Home.
    await evaluate("ng.getComponent(document.querySelector('app-tabs-bar')).navigateTab('/categories', {preventDefault(){}})");
    await waitFor("location.pathname.startsWith('/categories/')");
    await evaluate("ng.getComponent(document.querySelector('app-tabs-bar')).navigateTab('/home', {preventDefault(){}})");
    await waitFor("location.pathname === '/home' && " + visible('app-home-page'));
    assert.equal(await evaluate("document.querySelectorAll('ion-router-outlet').length"), 1, 'one persistent primary outlet');
    await evaluate("window.__oldHome = document.querySelector('app-home-page'); window.__homeDestroyed = false; ng.getComponent(__oldHome).destroy$.subscribe(() => window.__homeDestroyed = true)");
    await evaluate("ng.getComponent(document.querySelector('app-side-menu')).menuCtrl.open('main-menu')");
    await waitFor("document.querySelector('ion-menu').classList.contains('show-menu')");
    await evaluate("[...document.querySelectorAll('app-side-menu ion-item')].find(e => /Logout/i.test(e.textContent)).click()");
    await waitFor("location.pathname === '/auth/login' && " + visible('app-login') + " && !document.querySelector('.custom-loader-overlay')");
    await waitFor("window.__homeDestroyed && !window.__oldHome.isConnected");
    assert.equal(await evaluate("document.querySelector('ion-router-outlet') === window.__outlet"), true, 'outlet survives auth state changes');
    assert.equal(await evaluate("ng.getComponent(__outlet).canGoBack()"), false, 'logout resets Ionic stack');
    // Verify the Login control can receive input after logout.
    await evaluate("(async()=>{const input=await document.querySelector('app-login ion-input#login-email').getInputElement();input.value='after@example.test';input.dispatchEvent(new Event('input',{bubbles:true,composed:true}));})()");
    assert.equal(await evaluate("ng.getComponent(document.querySelector('app-login')).loginForm.value.email"), 'after@example.test');
    await waitFor("!document.querySelector('ion-menu').classList.contains('show-menu')");
    await evaluate("document.querySelector('app-login a.signup-link').click()");
    await waitFor("location.pathname === '/auth/signup' && " + visible('app-signup'));
    await evaluate("document.querySelector('app-signup a.login-link').click()");
    await waitFor("location.pathname === '/auth/login' && " + visible('app-login'));
    await evaluate("new Promise(resolve => { const sub = ng.getComponent(document.querySelector('app-side-menu')).router.events.subscribe(event => { if (event.urlAfterRedirects) { sub.unsubscribe(); resolve(event.urlAfterRedirects); } }); history.back(); })");
    await waitFor("location.pathname === '/auth/signup' && " + visible('app-signup'));
    await evaluate("new Promise(resolve => { const sub = ng.getComponent(document.querySelector('app-side-menu')).router.events.subscribe(event => { if (event.urlAfterRedirects) { sub.unsubscribe(); resolve(event.urlAfterRedirects); } }); history.back(); })");
    await waitFor("location.pathname === '/auth/login' && " + visible('app-login'));
    await evaluate("new Promise(resolve => { const sub = ng.getComponent(document.querySelector('app-side-menu')).router.events.subscribe(event => { if (event.urlAfterRedirects) { sub.unsubscribe(); resolve(event.urlAfterRedirects); } }); history.back(); })");
    // The older protected Categories history entry must be redirected by its guard.
    await waitFor("location.pathname === '/auth/login' && " + visible('app-login'));
    assert.equal(await evaluate("ng.getComponent(document.querySelector('app-side-menu')).authService.isLoggedIn"), false);
    assert.equal(await evaluate("window.__oldHome.isConnected"), false, 'Back cannot resurrect authenticated Home');
    assert.equal(await evaluate("!!document.querySelector('.custom-loader-overlay')"), false);
    const logoutIndex = requests.findIndex(path => path.endsWith('/user/logout'));
    assert.ok(logoutIndex >= 0, 'logout request completed');
    assert.equal(requests.slice(logoutIndex + 1).filter(path => path.endsWith('/user/me')).length, 0);
    assert.equal(errors.filter(error => /reading 'commit'/.test(error)).length, 0, errors.join('\n'));
    const otherErrors = errors.filter(error => !/onAriaChanged/.test(error));
    assert.equal(otherErrors.length, 0, otherErrors.join('\n'));
    console.log(JSON.stringify({
      passed: true,
      checks: ['login controls', 'one persistent outlet', 'logout URL and rendered Login',
        'Home destruction', 'Ionic root stack', 'Login input after logout',
        'Signup and Login links', 'browser Back guard', 'no post-logout me',
        'no loader', 'no commit error'],
      preExistingStencilAriaErrors: errors.length,
    }, null, 2));
  } finally {
    await send('Fetch.disable').catch(() => {});
    ws.close();
    await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id).catch(() => {});
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

