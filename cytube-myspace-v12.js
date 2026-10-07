/**
 * ============================================================
 *  CyTube Room Script — cytu.be/r/myspace
 *  Theme: MySpace-era mallgoth / 2000s music nostalgia
 * ============================================================
 *  VERSION HISTORY
 *  v0.12 2026-10-07  background anchored to top (CFG.theme.bgPosition)
 *                    so the top of the image is never cropped;
 *                    attachment configurable (CFG.theme.bgAttach)
 *  v0.11 2026-10-07  sparkle cursor trail (desktop only; CFG.cursor)
 *  v0.10 2026-10-07  queue list themed (rows, active item, buttons,
 *                    #plmeta item-count/length bar)
 *  v0.9  2026-10-07  page background is now an image
 *                    (CFG.theme.bgImage); gradient animation removed
 *  v0.8  2026-02-28  replaced broken surrogate \uD83E\uFAC0 at
 *                    emoji pool index 29 with バカ (\u30D0\u30AB)
 *  v0.7  2026-02-28  emoji fix v2: read seconds from node's own
 *                    span.timestamp text — true 1:1 per displayed
 *                    second regardless of observer batch timing
 *  v0.6  2026-02-28  emoji appender fixed: interval-cached per
 *                    real second (was per-node Date() call causing
 *                    two emojis at same timestamp on boundaries)
 *  v0.5  2026-02-28  userlist bottom border + form separator;
 *                    rain z-index 9999→500 (under navbar+footer);
 *                    footer#footer themed + z-index 600 above rain
 *  v0.4  2026-02-28  controlsrow box gone (buttons only);
 *                    userlist full border (top+left+right);
 *                    span#modflair gold mod styling;
 *                    p#videowrap-header purple border;
 *                    span.greentext restored to #789922
 *  v0.3  2026-02-28  no outer controlsrow border, buttons only;
 *                    message text glow removed (username sparkle
 *                    scoped to span.username); chatline full pink
 *                    neon border all 4 sides
 *  v0.2  2026-02-28  controlsrow button theme, chatline neon
 *                    border, plain messagebuffer, purge-safe
 *                    file rename to cytube-myspace-02
 *  v0.1  2026-02-26  initial release — navbar, profile card,
 *                    animations, emoji appender, chat flash
 * ============================================================
 *  MODULES:
 *   1. CONFIG          — edit everything from here
 *   2. FONT            — Special Elite via <link>
 *   3. STYLES          — CSS injected as one <style> tag
 *   4. NAVBAR          — brand emoji + gold text patched via JS
 *   5. ANIMATIONS      — roses + flying symbols, chat-triggered
 *   6. PROFILE         — owner contact card w/ emoji links
 *   7. CHAT            — emoji appender + messagebuffer flash
 *   8. TOKENS          — [scaffold] skull points system
 *   9. VOTING          — [scaffold] song / queue voting
 *  10. VISUALIZER      — [scaffold] Winamp-style audio reactive UI
 * 10b. CURSOR TRAIL    — sparkle mouse trail (desktop only)
 *  11. INIT            — wires everything together
 * ============================================================
 *
 *  DOM selectors confirmed against live CyTube HTML:
 *   nav.navbar.navbar-inverse          ← top nav bar
 *   a.navbar-brand                     ← "CyTube" brand link
 *   span#welcome                       ← "Welcome, username"
 *   input#logout                       ← logout submit button
 *   div#chatheader                     ← top bar of chat column
 *   div.linewrap#messagebuffer         ← message list
 *   input#chatline                     ← chat text input
 *   div#userlist                       ← online users panel
 *   div#controlsrow                    ← full-width bottom toolbar row
 *   div#leftcontrols                   ← New Poll, Emote List buttons
 *   div#rightcontrols                  ← media add / video controls
 *   div#videocontrols                  ← Queue next/last + player btns
 *   button#newpollbtn                  ← New Poll
 *   button#emotelistbtn                ← Emote List
 *   button#showmediaurl                ← Add video from URL (🔍/+)
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
            brandEmoji: '\uD83C\uDFE0',  // 🏠 — swap to 💀 🌹 ⛧ etc.
            brandText:  'CyTube'
        },

        animations: {
            fallingChar:   '\uD83C\uDF39',  // 🌹
            fallingCount:  5,
            fallingDurSec: 10,
            flyingChars:   ['\uD83D\uDC80', '\u2620\uFE0F', '\uD83D\uDC94', '\uD83E\uDD87'],
            flyingCount:   6,
            flyingDurSec:  8,
            showDurMs:     12000
        },

        chat: {
            emojis: [
                '\uD83D\uDC80','\u2620\uFE0F','\uD83D\uDC94','\uD83D\uDDA4','\u26B0\uFE0F',
                '\uD83E\uDEA6','\uD83D\uDD78\uFE0F','\uD83D\uDD77\uFE0F','\uD83E\uDD87','\uD83C\uDF19',
                '\uD83D\uDD95','\uD83D\uDD2A','\uD83E\uDE78','\u26E7','\u271D\uFE0F',
                '\u26D3\uFE0F','\uD83D\uDD12','\uD83D\uDDF9\uFE0F','\uD83C\uDFB8','\uD83E\uDD41',
                '\uD83C\uDFA4','\uD83D\uDD25','\u26A1','\uD83C\uDF11','\uD83E\uDE93',
                '\uD83E\uDDE7','\uD83E\uDE9E','\uD83D\uDD6F\uFE0F','\uD83E\uDE79','\u30D0\u30AB',
                '\uD83D\uDD70\uFE0F','\uD83E\uDDB4','\uD83C\uDF39','\uD83D\uDC8B',
            ]
        },

        tokens:     { enabled: false, startingBalance: 100, currency: 'skulls', earnPerMessage: 1 },
        voting:     { enabled: false, upEmoji: '\uD83E\uDD18', downEmoji: '\uD83D\uDC94', skipThreshold: 5 },
        visualizer: { enabled: false, barColor: '#ff00de', bgColor: 'rgba(0,0,0,0.7)', barCount: 32 },
        cursor:     { enabled: true,
                      chars:  ['\u2726', '\u2727', '\u2605', '\u2736'],   // ✦ ✧ ★ ✶
                      colors: ['#ffd700', '#ff00de', '#ffffff'],
                      minSize: 10, maxSize: 18,
                      throttleMs: 40,       // min ms between sparkles
                      lifeMs: 800,          // fade-out time
                      maxParticles: 40 },   // hard cap on live sparkles

        theme: {
            bg:     ['#1a1a1a', '#330033', '#660000', '#1a1a1a'],
            bgImage: 'https://i.ibb.co/F4b03GNL/196b5c2367123da9.webp',
            bgPosition: 'center top',   // keeps the top of the image visible
            bgAttach:   'fixed',        // 'fixed' = stays put; 'scroll' = image scrolls with the page
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
        l.id = 'rm-font'; l.rel = 'stylesheet';
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

        var navBg   = 'rgba(26,0,26,0.65)';
        var navBd   = 'rgba(255,0,222,0.35)';
        var ctrlBg  = 'rgba(20,0,30,0.82)';     // controls row fill — deep purple
        var btnBg   = 'rgba(40,0,50,0.9)';       // individual button fill
        var btnHov  = 'rgba(255,0,222,0.18)';    // button hover fill

        var css = [

            /* ---- Page ---- */
            'body{background:#1a1a1a url("' + t.bgImage + '") ' + t.bgPosition + ' / cover no-repeat ' + t.bgAttach + ';',
            'min-height:100vh;margin:0}',
            '#wrap,#main{background:transparent!important}',
            '@keyframes rmGlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}',

            /* ---- Navbar ---- */
            'nav.navbar.navbar-inverse{',
            'background:' + navBg + '!important;background-image:none!important;',
            'border-color:' + navBd + '!important;',
            'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);',
            'box-shadow:0 2px 14px rgba(255,0,222,0.18)!important}',

            'nav.navbar.navbar-inverse a.navbar-brand{color:' + gld + '!important;',
            'text-shadow:0 0 8px ' + ac + ',0 0 2px #fff!important;',
            'font-family:"Special Elite",serif!important;letter-spacing:0.04em}',
            'nav.navbar.navbar-inverse a.navbar-brand:hover{color:#fff!important}',

            'span#welcome{color:' + gld + '!important;font-family:"Special Elite",serif!important;',
            'text-shadow:0 0 6px ' + ac + '!important;font-size:13px}',

            'input#logout{color:' + gld + '!important;background:transparent!important;',
            'border:none!important;font-family:"Special Elite",serif!important;font-size:13px;',
            'text-shadow:0 0 5px ' + ac + '!important;cursor:pointer;padding:0;margin-left:8px}',
            'input#logout:hover{color:#fff!important;text-shadow:0 0 8px ' + ac + '!important}',

            'nav.navbar.navbar-inverse .navbar-nav>li>a{',
            'color:rgba(255,215,0,0.8)!important;font-family:"Special Elite",serif!important}',
            'nav.navbar.navbar-inverse .navbar-nav>li>a:hover{',
            'color:#fff!important;background:rgba(255,0,222,0.12)!important}',

            /* ---- Chat area — kept plain, not the focal point ---- */
            '#chatwrap{background:transparent}',

            '#chatheader{background:rgba(20,0,20,0.7)!important;',
            'border:1px solid ' + navBd + ';border-radius:4px 4px 0 0}',

            '#userlist{background:rgba(10,0,10,0.6)!important;',
            'border-top:1px solid ' + navBd + '!important;',
            'border-left:1px solid ' + navBd + '!important;',
            'border-right:1px solid ' + navBd + '!important;',
            'border-bottom:1px solid ' + navBd + '!important}',
            /* The chatline form sits inside #userlist — kill default white border */
            '#userlist form{border-top:1px solid ' + navBd + ';margin:0;padding:0}',
            '.userlist_item{font-family:"Special Elite",serif!important;',
            'color:' + gld + '!important;font-size:12px}',

            /* messagebuffer — plain dark background, subtle border, no flash */
            '#messagebuffer{background:rgba(10,0,10,0.5)!important;',
            'border:1px solid ' + navBd + ';border-top:none}',

            '#messagebuffer div{background:rgba(0,0,0,.6);padding:5px;margin-bottom:4px;',
            'border-radius:4px;font-family:"Special Elite",serif;font-size:13px;line-height:1.5;',
            'color:#ddd}',

            /* Username spans only — scope to .username so message text and emojis don't glow */
            '#messagebuffer div span.username{font-weight:bold;color:' + gld + ';',
            'font-family:"Special Elite",serif;',
            'text-shadow:0 0 5px #fff,0 0 10px #fff,0 0 15px ' + ac + ';',
            'animation:rmSparkle 1s infinite}',
            /* Explicitly kill glow on everything else inside messages */
            '#messagebuffer div span:not(.username){',
            'text-shadow:none!important;animation:none!important;color:inherit}',
            '@keyframes rmSparkle{',
            '0%,100%{text-shadow:0 0 5px #fff,0 0 10px #fff,0 0 15px ' + ac + '}',
            '50%{text-shadow:0 0 10px #fff,0 0 20px #fff,0 0 30px ' + ac + '}}',

            /* CHATLINE — full pink neon border all 4 sides */
            '#chatline{font-family:"Special Elite",serif!important;',
            'background:rgba(0,0,0,0.8)!important;',
            'color:' + gld + '!important;',
            'border:2px solid ' + ac + '!important;',
            'border-radius:4px;',
            'box-shadow:0 0 6px rgba(255,0,222,0.25),inset 0 0 4px rgba(255,0,222,0.1)!important}',
            '#chatline:focus{',
            'border-color:#fff!important;',
            'box-shadow:0 0 12px rgba(255,0,222,0.6),inset 0 0 6px rgba(255,0,222,0.2)!important}',
            '#chatline::placeholder{color:rgba(255,215,0,0.35)!important}',

            /* messagebuffer flash — only on #messagebuffer, subtle pulse */
            '@keyframes rmMsgFlash{',
            '0%{box-shadow:none}',
            '40%{box-shadow:0 0 10px 2px rgba(255,0,222,0.45)}',
            '100%{box-shadow:none}}',
            '#messagebuffer.rm-flash{animation:rmMsgFlash 0.5s ease-out!important}',

            /* ============================================================
               CONTROLS ROW — #controlsrow
               Contains #leftcontrols (New Poll, Emote List)
               and #rightcontrols (media add, video controls)
               Styled to match the profile card pill buttons:
               deep purple fill, pink neon border, gold text
               ============================================================ */
            /* controlsrow — fully transparent, no box, buttons stand alone on the page */
            '#controlsrow{background:transparent!important;border:none!important;',
            'box-shadow:none!important;padding:4px 0;margin:4px 0}',

            /* All buttons inside controlsrow */
            '#controlsrow .btn,#controlsrow .btn-default,#controlsrow .btn-sm{',
            'background:' + btnBg + '!important;',
            'color:' + gld + '!important;',
            'border:1px solid ' + ac + '!important;',
            'font-family:"Special Elite",serif!important;',
            'font-size:12px;',
            'text-shadow:0 0 4px rgba(255,215,0,0.4);',
            'box-shadow:0 0 5px rgba(255,0,222,0.15);',
            'transition:all 0.15s ease}',

            '#controlsrow .btn:hover,#controlsrow .btn-default:hover,#controlsrow .btn-sm:hover{',
            'background:' + btnHov + '!important;',
            'color:#fff!important;',
            'border-color:#fff!important;',
            'box-shadow:0 0 10px rgba(255,0,222,0.5)!important;',
            'text-shadow:0 0 6px #fff}',

            /* Active/pressed state */
            '#controlsrow .btn:active,#controlsrow .btn.active{',
            'background:rgba(255,0,222,0.3)!important;',
            'box-shadow:inset 0 0 8px rgba(255,0,222,0.4)!important}',

            /* Disabled buttons (e.g. Queue next when nothing queued) */
            '#controlsrow .btn[disabled],#controlsrow .btn.disabled{',
            'color:rgba(255,215,0,0.3)!important;',
            'border-color:rgba(255,0,222,0.2)!important;',
            'box-shadow:none!important;cursor:not-allowed}',

            /* Input fields inside controlsrow (URL add box etc.) */
            '#controlsrow .form-control,#controlsrow input[type="text"]{',
            'background:rgba(0,0,0,0.7)!important;',
            'color:' + gld + '!important;',
            'border:1px solid ' + ac + '!important;',
            'font-family:"Special Elite",serif!important;font-size:12px}',
            '#controlsrow .form-control:focus,#controlsrow input[type="text"]:focus{',
            'border-color:#fff!important;',
            'box-shadow:0 0 8px rgba(255,0,222,0.4)!important}',

            /* input-group-addon (e.g. "Guest login" label) */
            '#controlsrow .input-group-addon{',
            'background:' + btnBg + '!important;',
            'color:' + gld + '!important;',
            'border-color:' + ac + '!important;',
            'font-family:"Special Elite",serif!important}',

            /* ---- Animations wrapper ---- */
            '#rm-anim{opacity:0;transition:opacity 1.5s ease;pointer-events:none}',
            '#rm-anim.rm-active{opacity:1;transition:opacity 0.2s ease}',

            '.rm-fall{position:fixed;top:-1.5em;font-size:20px;line-height:1;',
            'animation:rmFall ' + a.fallingDurSec + 's linear infinite;',
            'z-index:500;pointer-events:none;will-change:transform;user-select:none}',
            '@keyframes rmFall{0%{transform:translateY(-2em) rotate(0deg)}',
            '100%{transform:translateY(101vh) rotate(720deg)}}',

            '.rm-fly{position:fixed;left:-1.5em;font-size:20px;line-height:1;',
            'animation:rmFly ' + a.flyingDurSec + 's linear infinite;',
            'z-index:500;pointer-events:none;will-change:transform;user-select:none}',
            '@keyframes rmFly{0%{transform:translateX(-2em) rotate(0deg)}',
            '100%{transform:translateX(101vw) rotate(360deg)}}',

            /* ---- Misc ---- */
            '#currenttitle::after{content:" \u2728"}',
            '#videowrap,#queue,#motd{background:transparent}',

            /* ---- Queue / playlist ---- */
            '#queue{background:rgba(10,0,10,0.55)!important;',
            'border:1px solid ' + navBd + '!important;border-radius:4px 4px 0 0}',
            '#queue .queue_entry{background:rgba(20,0,30,0.7)!important;',
            'border:none!important;border-bottom:1px solid rgba(255,0,222,0.2)!important;',
            'color:' + gld + '!important;font-family:"Special Elite",serif!important;font-size:12px}',
            '#queue .queue_entry:hover{background:rgba(255,0,222,0.12)!important}',
            '#queue .queue_entry a,#queue .queue_entry .qe_title{',
            'color:' + gld + '!important;text-decoration:none}',
            '#queue .queue_entry .qe_time{color:rgba(255,215,0,0.7)!important;',
            'font-family:"Special Elite",serif!important}',
            /* currently playing row */
            '#queue .queue_active,#queue .queue_active:hover{',
            'background:rgba(255,0,222,0.25)!important;',
            'box-shadow:inset 3px 0 0 ' + ac + ',0 0 8px rgba(255,0,222,0.35)}',
            /* per-row buttons: Play / Queue Next / Make Temporary */
            '#queue .queue_entry .btn{background:' + btnBg + '!important;',
            'color:' + gld + '!important;border:1px solid ' + ac + '!important;',
            'font-family:"Special Elite",serif!important;font-size:11px;',
            'text-shadow:0 0 4px rgba(255,215,0,0.4)}',
            '#queue .queue_entry .btn:hover{background:' + btnHov + '!important;',
            'color:#fff!important;border-color:#fff!important;',
            'box-shadow:0 0 8px rgba(255,0,222,0.5)}',
            /* "331 items / 25:29:40" bar */
            '#plmeta{background:rgba(20,0,20,0.7)!important;color:' + gld + '!important;',
            'border:1px solid ' + navBd + '!important;border-top:none;',
            'font-family:"Special Elite",serif!important;font-size:12px;',
            'text-shadow:0 0 4px rgba(255,0,222,0.4)}',

            /* footer#footer — "Powered by CyTube..." bar */
            /* z-index 600 > rain (500) so rain passes behind it */
            'footer#footer{',
            'position:relative;z-index:600;',
            'background:rgba(26,0,26,0.85)!important;',
            'border-top:1px solid ' + navBd + '!important;',
            'color:rgba(220,220,220,0.7)!important;',
            'font-family:"Special Elite",serif;font-size:12px;',
            'padding:8px 0;text-align:center}',
            'footer#footer a{color:rgba(255,215,0,0.6)!important;text-decoration:none}',
            'footer#footer a:hover{color:' + gld + '!important;text-shadow:0 0 4px ' + ac + '}',

            /* "Currently Playing:" bar — p#videowrap-header */
            'p#videowrap-header{',
            'background:rgba(20,0,20,0.7)!important;',
            'border:1px solid ' + navBd + '!important;',
            'border-radius:4px 4px 0 0;',
            'padding:4px 8px;margin:0;',
            'font-family:"Special Elite",serif;',
            'color:' + gld + '!important;font-size:12px}',
            'p#videowrap-header #currenttitle{color:' + gld + '!important}',

            /* Name Color mod flair button — span#modflair (label label-default) */
            /* Styled gold to signal mod status, matching username color in chat */
            'span#modflair{',
            'background:rgba(40,0,50,0.95)!important;',
            'color:' + gld + '!important;',
            'border:1px solid ' + ac + '!important;',
            'border-radius:4px;',
            'font-family:"Special Elite",serif!important;',
            'font-size:11px;',
            'text-shadow:0 0 4px rgba(255,215,0,0.5);',
            'box-shadow:0 0 5px rgba(255,0,222,0.2);',
            'cursor:pointer;padding:2px 7px}',
            'span#modflair:hover{',
            'background:rgba(255,0,222,0.2)!important;',
            'color:#fff!important;border-color:#fff!important;',
            'box-shadow:0 0 8px rgba(255,0,222,0.5)!important}',

            /* Greentext — restore CyTube default green for > quotes */
            /* CyTube wraps greentext in span.greentext */
            'span.greentext{color:#789922!important;text-shadow:none!important;',
            'animation:none!important}',

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

            '.rm-emoji{font-size:15px;margin-left:4px}',

            /* ---- Cursor sparkle trail ---- */
            '.rm-spark{position:fixed;pointer-events:none;z-index:9999;line-height:1;',
            'user-select:none;will-change:transform,opacity;',
            'animation:rmSpark var(--rm-life,800ms) ease-out forwards}',
            '@keyframes rmSpark{',
            '0%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0deg)}',
            '100%{opacity:0;transform:translate(calc(-50% + var(--rm-dx,0px)),',
            'calc(-50% + var(--rm-dy,20px))) scale(0.3) rotate(180deg)}}'

        ].join('');

        var old = document.getElementById('rm-styles');
        if (old) old.remove();
        var s = document.createElement('style');
        s.id = 'rm-styles';
        s.textContent = css;
        document.head.appendChild(s);
    }


    /* ============================================================
       4. NAVBAR
       ============================================================ */
    function patchNavbar() {
        var brand = document.querySelector('nav.navbar.navbar-inverse a.navbar-brand');
        if (brand) brand.textContent = CFG.navbar.brandEmoji + ' ' + CFG.navbar.brandText;
    }


    /* ============================================================
       5. ANIMATIONS
       ============================================================ */
    var Animations = (function () {
        var wrap = null, hideTimer = null;

        function _build() {
            var a = CFG.animations, frag = document.createDocumentFragment();
            for (var i = 0; i < a.fallingCount; i++) {
                var f = document.createElement('span');
                f.className = 'rm-fall'; f.textContent = a.fallingChar;
                f.style.left = (10 + i * 20) + '%';
                f.style.animationDelay = (i * (a.fallingDurSec / a.fallingCount)) + 's';
                frag.appendChild(f);
            }
            for (var j = 0; j < a.flyingCount; j++) {
                var s = document.createElement('span');
                s.className = 'rm-fly';
                s.textContent = a.flyingChars[j % a.flyingChars.length];
                s.style.top = (10 + j * 13) + '%';
                s.style.animationDelay = (j * (a.flyingDurSec / a.flyingCount)) + 's';
                frag.appendChild(s);
            }
            wrap = document.createElement('div');
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

        // Flash only the messagebuffer border
        function flashChat() {
            var el = document.getElementById('messagebuffer');
            if (!el) return;
            el.classList.remove('rm-flash');
            void el.offsetWidth;
            el.classList.add('rm-flash');
        }

        return { build: _build, trigger: trigger, flashChat: flashChat };
    })();


    /* ============================================================
       6. PROFILE CARD
       ============================================================ */
    function buildProfile() {
        var p = CFG.profile;
        var sec = document.createElement('div'); sec.id = 'rm-profile';
        var img = document.createElement('img'); img.src = p.image; img.alt = p.name;
        var info = document.createElement('div'); info.id = 'rm-profile-info';
        var h = document.createElement('div'); h.id = 'rm-profile-heading';
        h.textContent = p.name + ' \u2014 Contact Info';
        var linksWrap = document.createElement('div'); linksWrap.id = 'rm-profile-links';
        var lf = document.createDocumentFragment();
        p.links.forEach(function (item) {
            var a = document.createElement('a');
            a.href = item.href; a.className = 'rm-link'; a.title = item.label;
            if (item.ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            var icon = document.createElement('span');
            icon.className = 'rm-link-icon'; icon.textContent = item.emoji;
            var lbl = document.createElement('span');
            lbl.className = 'rm-link-label'; lbl.textContent = item.label;
            a.appendChild(icon); a.appendChild(lbl); lf.appendChild(a);
        });
        linksWrap.appendChild(lf); info.appendChild(h); info.appendChild(linksWrap);
        sec.appendChild(img); sec.appendChild(info);
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

        /*
         * Emoji is derived from the message's own span.timestamp text,
         * e.g. "[14:26:48]" → seconds=48 → pool[48 % pool.length].
         * This guarantees every message displaying the same HH:MM:SS
         * always gets the same emoji, regardless of when the
         * MutationObserver fires or batches.
         *
         * Fallback: Math.floor(Date.now()/1000) if no timestamp found.
         */
        function _emojiForNode(node) {
            var ts = node.querySelector('span.timestamp');
            if (ts) {
                var m = ts.textContent.match(/:(\d{2})\]/);
                if (m) return pool[parseInt(m[1], 10) % pool.length];
            }
            return pool[Math.floor(Date.now() / 1000) % pool.length];
        }

        new MutationObserver(function (mutations) {
            for (var m = 0; m < mutations.length; m++) {
                var nodes = mutations[m].addedNodes;
                for (var n = 0; n < nodes.length; n++) {
                    var node = nodes[n];
                    if (node.nodeType === 1 && node.nodeName === 'DIV' && !node.querySelector('.rm-emoji')) {
                        var sp = document.createElement('span');
                        sp.className = 'rm-emoji';
                        sp.textContent = ' ' + _emojiForNode(node);
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
        balance: function () { return 0; },
        award:   function () {}
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
       10b. CURSOR TRAIL
       ============================================================
       Sparkles spawn under the mouse pointer and fade out.
       - Skipped on touch devices (hover:none / pointer:coarse)
         and when the OS asks for reduced motion.
       - Throttled + capped (CFG.cursor.throttleMs / maxParticles).
       - Each sparkle removes itself on animationend, with a timer
         fallback so the live counter can never leak.
    ============================================================ */
    var CursorTrail = (function () {
        var last = 0, live = 0, bound = false;

        function _supported() {
            if (!CFG.cursor.enabled) return false;
            if (window.matchMedia) {
                if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return false;
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
            }
            return true;
        }

        function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

        function _spawn(x, y) {
            var c = CFG.cursor;
            if (live >= c.maxParticles) return;
            var el = document.createElement('span');
            var col = _pick(c.colors);
            var done = false;
            el.className = 'rm-spark';
            el.textContent = _pick(c.chars);
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.color = col;
            el.style.fontSize = (c.minSize + Math.random() * (c.maxSize - c.minSize)) + 'px';
            el.style.textShadow = '0 0 6px ' + col;
            el.style.setProperty('--rm-dx', ((Math.random() - 0.5) * 30) + 'px');
            el.style.setProperty('--rm-dy', (10 + Math.random() * 20) + 'px');
            el.style.setProperty('--rm-life', c.lifeMs + 'ms');
            function cleanup() {
                if (done) return;
                done = true; live--;
                if (el.parentNode) el.parentNode.removeChild(el);
            }
            el.addEventListener('animationend', cleanup);
            setTimeout(cleanup, c.lifeMs + 300);
            live++;
            document.body.appendChild(el);
        }

        function _onMove(e) {
            var now = Date.now();
            if (now - last < CFG.cursor.throttleMs) return;
            last = now;
            _spawn(e.clientX, e.clientY);
        }

        function init() {
            if (bound || !_supported()) return;
            document.addEventListener('mousemove', _onMove, { passive: true });
            bound = true;
        }

        function destroy() {
            document.removeEventListener('mousemove', _onMove);
            bound = false;
        }

        return { init: init, destroy: destroy };
    })();


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
        CursorTrail.init();
        window.Room = {
            cfg: CFG, tokens: RoomTokens, voting: RoomVoting,
            visualizer: RoomVisualizer, cursor: CursorTrail, reloadStyles: injectStyles, patchNavbar: patchNavbar
        };
    }

    (document.readyState === 'complete' || document.readyState === 'interactive')
        ? init()
        : document.addEventListener('DOMContentLoaded', init);

})();
