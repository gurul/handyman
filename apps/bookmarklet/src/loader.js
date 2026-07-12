/*
 * handyman bookmarklet loader — canonical, readable source.
 *
 * This is the payload that runs when the user clicks the "Handyman" bookmark on
 * any page. The generator page (../index.html) inlines an identical copy, bakes
 * in the three parameters (PROXY, TTS, STT) as literals, minifies it, and emits
 * a `javascript:` URL of the shape:
 *
 *     javascript:(<minified handymanBookmarklet>)("http://localhost:3000",true,true);void 0
 *
 * Keep this file and the inline copy in index.html in sync — index.html is the
 * one that actually ships the bytes; this file is the source of record so the
 * payload stays reviewable instead of living only as a minified string.
 *
 * The heavy lifting is in ${PROXY}/handyman.js (the built IIFE that defines
 * window.Handyman). The bookmarklet is only the loader: inject once, init, and
 * on a repeat click just surface the widget's FAB instead of re-injecting.
 *
 * As a named function EXPRESSION invoked via `(fn)(...)`, the name
 * `handymanBookmarklet` is not added to the global scope — nothing leaks onto
 * the host page except what window.Handyman itself sets.
 */
function handymanBookmarklet(PROXY, TTS, STT) {
	// Already on the page? Don't re-inject — just toggle the widget's FAB so a
	// second click resurfaces the ask panel. The FAB lives on a [data-handyman]
	// host, which under Wave 2 isolation is a shadow host, so look inside the
	// shadowRoot too.
	if (window.Handyman) {
		var hosts = document.querySelectorAll('[data-handyman]');
		for (var i = 0; i < hosts.length; i++) {
			var root = hosts[i].shadowRoot || hosts[i];
			var fab = root.querySelector('.handyman-fab');
			if (fab) {
				fab.click();
				return;
			}
		}
		return;
	}

	// First injection on this page: load the built widget from the proxy, then
	// initialize it with the ABSOLUTE proxy endpoint so its cross-origin API
	// calls resolve from any host site (the proxy sends permissive CORS).
	var script = document.createElement('script');
	script.src = PROXY + '/handyman.js';
	script.async = true;
	script.onload = function () {
		if (window.Handyman) {
			window.Handyman.init({
				endpoint: PROXY + '/api',
				tts: TTS,
				stt: STT,
			});
		}
	};
	script.onerror = function () {
		// Strict-CSP hosts (GitHub, Twitter, …) block injected script-src /
		// connect-src. Warn quietly — never alert() — and point at the extension.
		console.warn(
			'[handyman] could not load ' +
				script.src +
				" — this site's Content-Security-Policy likely blocks injected" +
				' scripts. Use the handyman Chrome extension on strict-CSP sites.',
		);
	};
	(document.head || document.documentElement).appendChild(script);
}
