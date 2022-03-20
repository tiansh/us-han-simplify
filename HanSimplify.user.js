// ==UserScript==
// @name Han Simplify
// @name:zh 汉字转换为简体字
// @description 将页面上的汉字转换为简体字，需要手动添加包含的网站以启用
// @namespace https://github.com/tiansh
// @version 1.5
// @resource t2s https://tiansh.github.io/reader/data/han/t2s.json
// @include *
// @exclude *
// @grant GM_getResourceURL
// @grant GM.getResourceUrl
// @run-at document-start
// @license MIT
// @downloadURL https://tiansh.github.io/us-han-simplify/HanSimplify.user.js
// @supportURL https://github.com/tiansh/us-han-simplify/issues
// ==/UserScript==

/** @type {'t2s'|'s2t'} */
const RULE = 't2s';

/* global RULE */
/**
 * @name RULE
 * @type {'t2s'|'s2t'}
 */
/* eslint-env browser, greasemonkey */

; (async function () {

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
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  /** @param {string} text */
  const translate = function (text) {
    let output = '';
    let state = 0;
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
    if (element.closest('svg, math, .notranslate, [translate="no"], code:not([translate="yes"]), var:not([translate="yes"]), [contenteditable="true"]')) return false;
    const lang = element.closest('[lang]');
    return lang == null || lang.hasAttribute('hanconv-apply');
  };
  /** @param {Text|Attr} node */
  const needTranslateNode = function (node) {
    if (translated.has(node) && translated.get(node) === node.nodeValue) return false;
    if (/^\s*$/.test(node.nodeValue)) return false;
    return true;
  };
  /** @param {Text|Attr} node */
  const translateNode = function (node) {
    if (!node || !needTranslateNode(node)) return;
    const result = translate(node.nodeValue);
    translated.set(node, result);
    node.nodeValue = result;
  };
  const translateTree = function translateTree(node) {
    if (node instanceof Text) {
      translateNode(node);
    } else if (node instanceof Element) {
      const tagName = node.tagName;
      if (node.attributes.lang && !node.attributes['hanconv-apply']) return;
      if (node.classList.contains('notranslate')) return;
      const contenteditable = node.getAttribute('contenteditable');
      if (contenteditable === 'true') return;
      const translate = node.getAttribute('translate');
      if (translate === 'no') return;
      if (['CODE', 'VAR'].includes(tagName) && translate !== 'yes') return;

      const attrs = node.attributes;
      if (['APPLET', 'AREA', 'IMG', 'INPUT'].includes(tagName)) translateNode(attrs.alt);
      if (['INPUT', 'TEXTAREA'].includes(tagName)) translateNode(attrs.placeholder);
      if (['A', 'AREA'].includes(tagName)) translateNode(attrs.download);
      translateNode(attrs.title);
      translateNode(attrs['aria-label']);
      translateNode(attrs['aria-description']);

      if (['SVG', 'MATH', 'SCRIPT', 'STYLE', 'TEXTAREA'].includes(tagName)) return;
      [...node.childNodes].forEach(translateTree);
    } else if (node instanceof Document) {
      [...node.childNodes].forEach(translateTree);
    }
  };
  /** @param {Element} container */
  const translateContainer = function (container) {
    if (container instanceof Text) {
      if (needTranslateElement(container.parentElement)) translateNode(container);
    } else if (container instanceof Attr) {
      if (needTranslateElement(container.ownerElement)) translateNode(container);
    } else if (container instanceof Element) {
      if (!needTranslateElement(container)) {
        [...container.querySelectorAll('[hanconv-apply]')].forEach(translateContainer);
        return;
      }
      translateTree(container);
    } else if (container instanceof Document) {
      translateTree(container);
    }
  };

  const observer = new MutationObserver(function onMutate(records) {
    correctLangTags();
    const translateTargets = new Set();
    records.forEach(record => {
      if (record.type === 'childList') {
        [...record.addedNodes].forEach(node => translateTargets.add(node));
      } else {
        translateTargets.add(record.target);
      }
    });
    [...translateTargets].forEach(translateContainer);
  });
  observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true });

  if (document.readyState === 'complete') {
    translateContainer(document);
  } else document.addEventListener('DOMContentLoaded', () => {
    translateContainer(document);
  }, { once: true });

}());
