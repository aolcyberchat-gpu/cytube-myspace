/**
 * ============================================================
 *  CyTube Room Script — cytu.be/r/myspace
 *  Theme: MySpace-era mallgoth / 2000s music nostalgia
 * ============================================================
 *  MODULES:
 *   1. CONFIG          — edit everything from here
 *   2. FONT            — Special Elite via <link>
 *   3. STYLES          — CSS injected as one <style> tag
 *   4. NAVBAR          — brand emoji + gold text patched via JS
 *   5. ANIMATIONS      — roses + flying symbols, chat-triggered
 *   6. PROFILE         — owner contact card w/ emoji links
 *   7. CHAT            — emoji appender + border flash trigger
 *   8. TOKENS          — [scaffold] skull points system
 *   9. VOTING          — [scaffold] song / queue voting
 *  10. VISUALIZER      — [scaffold] Winamp-style audio reactive UI
 *  11. INIT            — wires everything together
 * ============================================================
 *
 *  DOM selectors confirmed against live CyTube HTML:
 *   nav.navbar.navbar-inverse.navbar-fixed-top
 *   .navbar-header  a.navbar-brand            ← "CyTube" text
 *   span#welcome                               ← "Welcome, username"
 *   input#logout                               ← logout submit button
 *   div#chatheader                             ← top bar of chat column
 *   div.linewrap#messagebuffer                 ← message list
 *   input#chatline                             ← chat input
 *   div#userlist                               ← online users panel
 * ============================================================
 */

(function () {
    'use strict';

    /* ============================================================
       1. CONFIG
       ============================================================ */
    var CFG = {

        profile: {
            name:  'Andy L. Sixx',
            image: 'https://i.ibb.co/qMPh9kXr/Andy-Sixx-log.jpg',
            links: [
                { emoji: '\uD83D\uDCE7', label: 'Email',    href: 'mailto:andylsixx@proton.me' },
                { emoji: '\uD83D\uDC19', label: 'Tumblr',   href: 'https://www.tumblr.com/andylsixx',   ext: true },
                { emoji: '\uD83D\uDC18', label: 'Mastodon', href: 'https://mastodon.social/@andylsixx', ext: true },
                { emoji: '\uD83D\uDCFA', label: 'Twitch',   href: 'https://twitch.tv/andyl_sixx',       ext: true },
                { emoji: '\uD83D\uDCBB', label: 'MySpace',  href: 'https://myspace.com/andylsixx',      ext: true },
                { emoji: '\uD83C\uDFB5', label: 'TikTok',   href: 'https://www.tiktok.com/@andylsixx',  ext: true }
            ]
        },

        navbar: {
            brandEmoji: '\uD83C\uDFE0',  // 🏠 home — swap to 💀 🌹 ⛧ etc.
            brandText:  'CyTube'
        },

        animations: {
            fallingChar:   '\uD83C\uDF39',  // 🌹
            fallingCount:  5,
            fallingDurSec: 10,

            flyingChars:   ['\uD83D\uDC80', '\u2620\uFE0F', '\uD83D\uDC94', '\uD83E\uDD87'],
            flyingCount:   6,
            flyingDurSec:  8,

            showDurMs: 12000  // must be >= fallingDurSec * 1000
        },

        chat: {
            emojis: [
                '\uD83D\uDC80','\u2620\uFE0F','\uD83D\uDC94','\uD83D\uDDA4','\u26B0\uFE0F',
                '\uD83E\uDEA6','\uD83D\uDD78\uFE0F','\uD83D\uDD77\uFE0F','\uD83E\uDD87','\uD83C\uDF19',
                '\uD83D\uDD95','\uD83D\uDD2A','\uD83E\uDE78','\u26E7','\u271D\uFE0F',
                '\u26D3\uFE0F','\uD83D\uDD12','\uD83D\uDDF9\uFE0F','\uD83C\uDFB8','\uD83E\uDD41',
                '\uD83C\uDFA4','\uD83D\uDD25','\u26A1','\uD83C\uDF11','\uD83E\uDE93',
                '\uD83E\uDDE7','\uD83E\uDE9E','\uD83D\uDD6F\uFE0F','\uD83E\uDE79','\uD83E\uFAC0',
                '\uD83D\uDD70\uFE0F','\uD83E\uDDB4','\uD83C\uDF39','\uD83D\uDC8B'
            ]
        },

        tokens:     { enabled: false, startingBalance: 100, currency: 'skulls', earnPerMessage: 1 },
        voting:     { enabled: false, upEmoji: '\uD83E\uDD18', downEmoji: '\uD83D\uDC94', skipThreshold: 5 },
        visualizer: { enabled: false, barColor: '#ff00de', bgColor: 'rgba(0,0,0,0.7)', barCount: 32 },

        theme: {
            bg:     ['#1a1a1a', '#330033', '#660000', '#1a1a1a'],
            accent: '#ff00de',
            gold:   '#ffd700'
        }

    };


    /* ============================================================
       2. FONT
       ============================================================ */
    function injectFont() {
        if (document.getElementById('rm-font')) return;
        var l = document.createElement('link');
        l.id   = 'rm-font';
        l.rel  = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap';
        document.head.appendChild(l);
    }


    /* ============================================================
       3. STYLES
       ============================================================ */
    function injectStyles() {
        var t   = CFG.theme;
        var bg  = t.bg.join(',');
        var ac  = t.accent;
        var gld = t.gold;
        var a   = CFG.animations;

        var navBg  = 'rgba(26,0,26,0.65)';
        var navBd  = 'rgba(255,0,222,0.35)';

        var css = [

            /* ---- Page ---- */
            'body,#wrap,#main{background:linear-gradient(45deg,' + bg + ');',
            'background-size:400% 400%;animation:rmGlow 10s ease infinite;min-height:100vh;margin:0}',
            '@keyframes rmGlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}',

            /* ---- Navbar — confirmed: nav.navbar.navbar-inverse.navbar-fixed-top ---- */
            'nav.navbar.navbar-inverse{',
            'background:' + navBg + '!important;',
            'background-image:none!important;',
            'border-color:' + navBd + '!important;',
            'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);',
            'box-shadow:0 2px 14px rgba(255,0,222,0.18)!important}',

            /* Brand "CyTube" — a.navbar-brand */
            'nav.navbar.navbar-inverse a.navbar-brand{',
            'color:' + gld + '!important;',
            'text-shadow:0 0 8px ' + ac + ',0 0 2px #fff!important;',
            'font-family:"Special Elite",serif!important;',
            'letter-spacing:0.04em}',
            'nav.navbar.navbar-inverse a.navbar-brand:hover{color:#fff!important}',

            /* Welcome span — span#welcome */
            'span#welcome{',
            'color:' + gld + '!important;',
            'font-family:"Special Elite",serif!important;',
            'text-shadow:0 0 6px ' + ac + '!important;',
            'font-size:13px}',

            /* Logout input — input#logout (it's a form submit, not an anchor) */
            'input#logout{',
            'color:' + gld + '!important;',
            'background:transparent!important;',
            'border:none!important;',
            'font-family:"Special Elite",serif!important;',
            'font-size:13px;',
            'text-shadow:0 0 5px ' + ac + '!important;',
            'cursor:pointer;padding:0;margin-left:8px}',
            'input#logout:hover{color:#fff!important;text-shadow:0 0 8px ' + ac + '!important}',

            /* Other nav links */
            'nav.navbar.navbar-inverse .navbar-nav>li>a{',
            'color:rgba(255,215,0,0.8)!important;font-family:"Special Elite",serif!important}',
            'nav.navbar.navbar-inverse .navbar-nav>li>a:hover{',
            'color:#fff!important;background:rgba(255,0,222,0.12)!important}',

            /* ---- Chat area ---- */
            '#chatwrap{background:transparent}',

            /* chatheader — top bar above messagebuffer */
            '#chatheader{',
            'background:rgba(20,0,20,0.7)!important;',
            'border:1px solid ' + navBd + ';',
            'border-radius:4px 4px 0 0}',

            /* userlist panel */
            '#userlist{',
            'background:rgba(10,0,10,0.6)!important;',
            'border-right:1px solid ' + navBd + '}',
            '.userlist_item{',
            'font-family:"Special Elite",serif!important;',
            'color:' + gld + '!important;font-size:12px}',

            /* messagebuffer */
            '#messagebuffer{',
            'background:rgba(10,0,10,0.5)!important;',
            'border:1px solid ' + navBd + ';',
            'border-top:none;transition:border-color 0.3s ease,box-shadow 0.3s ease}',

            '#messagebuffer div{',
            'background:rgba(0,0,0,.65);padding:5px;margin-bottom:4px;border-radius:4px;',
            'font-family:"Special Elite",serif;font-size:13px;line-height:1.5;',
            'text-shadow:0 0 4px #fff,0 0 8px #fff,0 0 12px ' + ac + '}',

            /* Username spans inside messages */
            '#messagebuffer div span{',
            'font-weight:bold;color:' + gld + ';',
            'font-family:"Special Elite",serif;',
            'text-shadow:0 0 5px #fff,0 0 10px #fff,0 0 15px ' + ac + ';',
            'animation:rmSparkle 1s infinite}',
            '@keyframes rmSparkle{',
            '0%,100%{text-shadow:0 0 5px #fff,0 0 10px #fff,0 0 15px ' + ac + '}',
            '50%{text-shadow:0 0 10px #fff,0 0 20px #fff,0 0 30px ' + ac + '}}',

            /* Chat input */
            '#chatline{',
            'font-family:"Special Elite",serif!important;',
            'background:rgba(0,0,0,0.75)!important;',
            'color:' + gld + '!important;',
            'border:1px solid ' + navBd + '!important;',
            'border-top:none!important;',
            'border-radius:0 0 4px 4px;',
            'box-shadow:inset 0 0 6px rgba(255,0,222,0.15)!important}',
            '#chatline:focus{',
            'border-color:' + ac + '!important;',
            'box-shadow:inset 0 0 8px rgba(255,0,222,0.3),0 0 6px rgba(255,0,222,0.2)!important}',

            /*
             * CHAT FLASH — fires on messagebuffer and chatheader borders, NOT chatwrap.
             * Uses border-color + box-shadow pulse so only the inner chat borders react.
             */
            '@keyframes rmMsgFlash{',
            '0%{border-color:' + navBd + ';box-shadow:none}',
            '40%{border-color:' + ac + ';box-shadow:0 0 12px 2px rgba(255,0,222,0.5)}',
            '100%{border-color:' + navBd + ';box-shadow:none}}',
            '#messagebuffer.rm-flash{animation:rmMsgFlash 0.5s ease-out!important}',
            '#chatheader.rm-flash{animation:rmMsgFlash 0.5s ease-out!important}',

            /* ---- Animations wrapper ---- */
            '#rm-anim{opacity:0;transition:opacity 1.5s ease;pointer-events:none}',
            '#rm-anim.rm-active{opacity:1;transition:opacity 0.2s ease}',

            '.rm-fall{position:fixed;top:-1.5em;font-size:20px;line-height:1;',
            'animation:rmFall ' + a.fallingDurSec + 's linear infinite;',
            'z-index:9999;pointer-events:none;will-change:transform;user-select:none}',
            '@keyframes rmFall{0%{transform:translateY(-2em) rotate(0deg)}100%{transform:translateY(101vh) rotate(720deg)}}',

            '.rm-fly{position:fixed;left:-1.5em;font-size:20px;line-height:1;',
            'animation:rmFly ' + a.flyingDurSec + 's linear infinite;',
            'z-index:9999;pointer-events:none;will-change:transform;user-select:none}',
            '@keyframes rmFly{0%{transform:translateX(-2em) rotate(0deg)}100%{transform:translateX(101vw) rotate(360deg)}}',

            /* ---- Misc ---- */
            '#currenttitle::after{content:" \u2728"}',
            '#videowrap,#queue,#motd,#footer{background:transparent}',

            /* ---- Profile card ---- */
            '#rm-profile{margin:10px;padding:10px;display:flex;align-items:flex-start;',
            'background:rgba(0,0,0,.8);border:2px solid ' + ac + ';border-radius:5px;z-index:10}',
            '#rm-profile img{width:100px;height:100px;margin-right:20px;',
            'border:2px solid ' + gld + ';border-radius:10px;flex-shrink:0}',
            '#rm-profile-info{display:flex;flex-direction:column;flex:1}',
            '#rm-profile-heading{font-size:18px;font-weight:bold;color:' + gld + ';',
            'font-family:"Special Elite",serif;text-shadow:0 0 5px ' + ac + ';margin-bottom:10px}',
            '#rm-profile-links{display:flex;flex-wrap:wrap;gap:12px}',
            '.rm-link{display:flex;flex-direction:column;align-items:center;gap:3px;',
            'color:' + ac + ';text-decoration:none;',
            'background:rgba(255,0,222,0.08);border:1px solid rgba(255,0,222,0.3);',
            'border-radius:8px;padding:8px 12px;min-width:60px;',
            'font-family:"Special Elite",serif;font-size:11px;',
            'text-shadow:0 0 3px #fff;transition:all 0.2s ease}',
            '.rm-link .rm-link-icon{font-size:22px;line-height:1}',
            '.rm-link .rm-link-label{color:rgba(255,215,0,0.8);letter-spacing:0.03em}',
            '.rm-link:hover{color:#fff;background:rgba(255,0,222,0.22);',
            'border-color:' + ac + ';box-shadow:0 0 8px rgba(255,0,222,0.4);transform:translateY(-2px)}',

            '.rm-emoji{font-size:15px;margin-left:4px}'

        ].join('');

        var old = document.getElementById('rm-styles');
        if (old) old.remove();
        var s = document.createElement('style');
        s.id = 'rm-styles';
        s.textContent = css;
        document.head.appendChild(s);
    }


    /* ============================================================
       4. NAVBAR — patch brand text to prepend emoji via JS
       CSS can style the element but can't prepend content to
       existing text without ::before (which CyTube may override).
       JS textContent swap is the reliable path.
       ============================================================ */
    function patchNavbar() {
        var brand = document.querySelector('nav.navbar.navbar-inverse a.navbar-brand');
        if (brand) {
            brand.textContent = CFG.navbar.brandEmoji + ' ' + CFG.navbar.brandText;
        }

        // The logout element is input#logout (type=submit), not an anchor.
        // Its "Log out" value is already fine — we just style it via CSS.
        // Optionally prepend a skull to it:
        // No textContent on inputs — use a wrapper trick only if desired later.
    }


    /* ============================================================
       5. ANIMATIONS — opacity-toggle, always running
       ============================================================ */
    var Animations = (function () {
        var wrap      = null;
        var hideTimer = null;

        function _build() {
            var a    = CFG.animations;
            var frag = document.createDocumentFragment();

            for (var i = 0; i < a.fallingCount; i++) {
                var f = document.createElement('span');
                f.className   = 'rm-fall';
                f.textContent = a.fallingChar;
                f.style.left           = (10 + i * 20) + '%';
                f.style.animationDelay = (i * (a.fallingDurSec / a.fallingCount)) + 's';
                frag.appendChild(f);
            }

            for (var j = 0; j < a.flyingCount; j++) {
                var s = document.createElement('span');
                s.className   = 'rm-fly';
                s.textContent = a.flyingChars[j % a.flyingChars.length];
                s.style.top            = (10 + j * 13) + '%';
                s.style.animationDelay = (j * (a.flyingDurSec / a.flyingCount)) + 's';
                frag.appendChild(s);
            }

            wrap    = document.createElement('div');
            wrap.id = 'rm-anim';
            wrap.appendChild(frag);
            document.body.appendChild(wrap);
        }

        function trigger() {
            if (!wrap) return;
            wrap.classList.add('rm-active');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(function () {
                wrap.classList.remove('rm-active');
            }, CFG.animations.showDurMs);
        }

        // Flash the inner chat borders — messagebuffer + chatheader
        // NOT chatwrap (the outer column)
        function flashChat() {
            ['messagebuffer', 'chatheader'].forEach(function (id) {
                var el = document.getElementById(id);
                if (!el) return;
                el.classList.remove('rm-flash');
                void el.offsetWidth; // force reflow so animation re-triggers
                el.classList.add('rm-flash');
            });
        }

        return { build: _build, trigger: trigger, flashChat: flashChat };
    })();


    /* ============================================================
       6. PROFILE CARD
       ============================================================ */
    function buildProfile() {
        var p   = CFG.profile;
        var sec = document.createElement('div');
        sec.id  = 'rm-profile';

        var img = document.createElement('img');
        img.src = p.image;
        img.alt = p.name;

        var info = document.createElement('div');
        info.id  = 'rm-profile-info';

        var h = document.createElement('div');
        h.id  = 'rm-profile-heading';
        h.textContent = p.name + ' \u2014 Contact Info';

        var linksWrap = document.createElement('div');
        linksWrap.id  = 'rm-profile-links';

        var lf = document.createDocumentFragment();
        p.links.forEach(function (item) {
            var a = document.createElement('a');
            a.href      = item.href;
            a.className = 'rm-link';
            a.title     = item.label;
            if (item.ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }

            var icon = document.createElement('span');
            icon.className   = 'rm-link-icon';
            icon.textContent = item.emoji;

            var lbl = document.createElement('span');
            lbl.className   = 'rm-link-label';
            lbl.textContent = item.label;

            a.appendChild(icon);
            a.appendChild(lbl);
            lf.appendChild(a);
        });

        linksWrap.appendChild(lf);
        info.appendChild(h);
        info.appendChild(linksWrap);
        sec.appendChild(img);
        sec.appendChild(info);

        var cw = document.getElementById('chatwrap');
        (cw && cw.parentNode) ? cw.parentNode.insertBefore(sec, cw) : document.body.appendChild(sec);
    }


    /* ============================================================
       7. CHAT
       ============================================================ */
    function initChat() {
        var buf = document.getElementById('messagebuffer');
        if (!buf) return;
        var pool = CFG.chat.emojis;

        new MutationObserver(function (mutations) {
            for (var m = 0; m < mutations.length; m++) {
                var nodes = mutations[m].addedNodes;
                for (var n = 0; n < nodes.length; n++) {
                    var node = nodes[n];
                    if (node.nodeType === 1
                        && node.nodeName === 'DIV'
                        && !node.querySelector('.rm-emoji')) {

                        var sp = document.createElement('span');
                        sp.className   = 'rm-emoji';
                        sp.textContent = ' ' + pool[new Date().getSeconds() % pool.length];
                        node.appendChild(sp);

                        Animations.trigger();
                        Animations.flashChat();
                    }
                }
            }
        }).observe(buf, { childList: true });
    }


    /* ============================================================
       8. TOKENS [scaffold]
    ============================================================
       Planned:
         - Per-user balance in localStorage keyed by CyTube username
         - Award CFG.tokens.earnPerMessage skulls per chat message
         - Chat commands: !balance  !give <user> <amount>
         - UI: skull + count badge next to username in messagebuffer
         - Hook into initChat MutationObserver to award on message
         - window.Room.tokens.balance(user) → number
    ============================================================ */
    var RoomTokens = {
        init:    function () { if (!CFG.tokens.enabled) return; },
        balance: function (/* user */) { return 0; },
        award:   function (/* user, amount */) {}
    };


    /* ============================================================
       9. VOTING [scaffold]
    ============================================================
       Planned:
         - Inject upEmoji / downEmoji buttons on each #queue li
         - Tally votes in memory per media ID
         - Broadcast via CyTube chat socket (!vote command)
         - Auto-skip when downvotes >= CFG.voting.skipThreshold
         - MutationObserver on #queue to re-render on queue change
         - Chat commands: !vote skip  !vote keep
    ============================================================ */
    var RoomVoting = {
        init: function () { if (!CFG.voting.enabled) return; }
    };


    /* ============================================================
       10. VISUALIZER [scaffold]
    ============================================================
       Planned:
         - <canvas id="rm-canvas"> injected below #videowrap
         - Web Audio AnalyserNode tapped from room media element
         - requestAnimationFrame loop drawing CFG.visualizer.barCount FFT bars
         - Pause rAF when player pauses; destroy on source change
         ⚠  YouTube iframes are cross-origin — direct audio tap blocked.
            Fallback: BPM-driven bars via Last.fm / MusicBrainz tempo,
            refreshed on CyTube's "changeMedia" socket event.
    ============================================================ */
    var RoomVisualizer = {
        canvas: null, ctx: null, analyser: null, rafId: null,
        init:    function () { if (!CFG.visualizer.enabled) return; },
        destroy: function () { if (this.rafId) cancelAnimationFrame(this.rafId); }
    };


    /* ============================================================
       11. INIT
       ============================================================ */
    function init() {
        if (!document.body
            || !document.getElementById('chatwrap')
            || !document.getElementById('messagebuffer')) {
            return setTimeout(init, 500);
        }

        injectFont();
        injectStyles();
        patchNavbar();
        Animations.build();
        buildProfile();
        initChat();
        RoomTokens.init();
        RoomVoting.init();
        RoomVisualizer.init();

        window.Room = {
            cfg:          CFG,
            tokens:       RoomTokens,
            voting:       RoomVoting,
            visualizer:   RoomVisualizer,
            reloadStyles: injectStyles,
            patchNavbar:  patchNavbar
        };
    }

    (document.readyState === 'complete' || document.readyState === 'interactive')
        ? init()
        : document.addEventListener('DOMContentLoaded', init);

})();
