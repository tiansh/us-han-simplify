// ==UserScript==
// @name     Han Simplify
// @name:zh  汉字转换为简体字
// @description 将页面上的汉字转换为简体字，需要手动添加包含的网站以启用
// @namespace https://github.com/tiansh
// @version  0.1
// @resource t2s https://tiansh.github.io/reader/data/han/t2s.json
// @exclude *
// @grant GM_getResourceURL
// @grant GM.getResourceUrl
// @run-at document-start
// @license MIT
// ==/UserScript==

/* eslint-env browser, greasemonkey */

; (async function () {
  /** @type {'t2s'|'s2t'} */
  const RULE = 't2s';

  const fetchTable = async function (url) {
    return (await fetch(url)).json();
  };
  const loadTable = async function () {
    try {
      return fetchTable(GM_getResourceURL(RULE));
    } catch {
      return fetchTable(await GM.getResourceUrl(RULE));
    }
  };

  /** @type {{ [ch: string]: [string, number] }[]} */
  const table = await loadTable();
  /** @param {string} text */
  const translate = function (text) {
    let output = '';
    let state = 0;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    for (let char of text) {
      while (true) {
        const current = table[state];
        const hasMatch = hasOwnProperty.call(current, char);
        if (!hasMatch && state === 0) {
          output += char;
          break;
        }
        if (hasMatch) {
          const [adding, next] = current[char];
          if (adding) output += adding;
          state = next;
          break;
        }
        const [adding, next] = current[''];
        if (adding) output += adding;
        state = next;
      }
    }
    while (state !== 0) {
      const current = table[state];
      const [adding, next] = current[''];
      if (adding) output += adding;
      state = next;
    }
    return output;
  };

  const correctLangTags = function () {
    [...document.querySelectorAll('[lang]:not([hanconv-lang])')].forEach(element => {
      const lang = element.getAttribute('lang');
      element.setAttribute('hanconv-lang', lang);
      if (RULE === 't2s' && /^zh\b(?:(?!.*-Hans)-(?:TW|HK|MO)|.*-Hant|$)/i.test(lang)) {
        element.setAttribute('lang', 'zh-Hans');
      }
      if (RULE === 's2t' && /^zh\b(?:(?!.*-Hant)-(?:CN|SG|MY)|.*-Hans|$)/i.test(lang)) {
        element.setAttribute('lang', 'zh-Hant');
      }
      if (!/^(?:ja|ko|vi)\b/i.test(lang)) {
        element.setAttribute('hanconv-apply', 'apply');
      }
    });
  };

  /** @type {WeakMap<Text|Attr, string>} */
  const translated = new WeakMap();
  /** @param {Element} element */
  const needTranslateElement = function (element) {
    if (element.matches('script, style')) return false;
    if (element.closest('svg, math, .notranslate, [translate="no"], code:not([translate="yes"]), var:not([translate="yes"])')) return false;
    const lang = element.closest('[lang]');
    return lang == null || lang.hasAttribute('hanconv-apply');
  };
  /** @param {Text|Attr} node */
  const needTranslate = function (node) {
    if (translated.has(node) && translated.get(node) === node.nodeValue) return false;
    if (/^\s*$/.test(node.nodeValue)) return false;
    const element = node instanceof Text ? node.parentElement : node.ownerElement;
    if (!element) return true;
    return needTranslateElement(element);
  };
  /** @param {Text|Attr} node */
  const translateNode = function (node) {
    if (!needTranslate(node)) return;
    const result = translate(node.nodeValue);
    translated.set(node, result);
    node.nodeValue = result;
  };
  const translateContainer = function (container) {
    if (container instanceof Text || container instanceof Attr) {
      translateNode(container);
    } else if (container instanceof Element) {
      const nodes = document.evaluate([
        // Translate text
        '//text()',
        // Translate attributes
        '(//applet|//area|//img|//input)/@alt',
        '(//a|//area)/@download',
        '//@title',
        '//@aria-label', '//@aria-description',
      ].join('|'), container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let index = 0; index < nodes.snapshotLength; index++) {
        translateNode(nodes.snapshotItem(index));
      }
    }
  };

  let timeout = null;
  const updateInterval = 200;
  const translateTargets = new Set();
  const observer = new MutationObserver(function onMutate(records) {
    correctLangTags();
    records.forEach(record => {
      if (record.type === 'childList') {
        [...record.addedNodes].forEach(node => translateTargets.add(node));
      } else {
        translateTargets.add(record.target);
      }
    });
    if (!timeout) {
      const targets = [...translateTargets].filter((node, _, arr) => !arr.some(other => other !== node && other.contains(node)));
      translateTargets.clear();
      targets.forEach(translateContainer);
      timeout = setTimeout(() => { timeout = null; onMutate([]); }, updateInterval);
    }
  });
  observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true });

}());
