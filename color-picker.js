/**
 * ColorPicker — простой кастомный пикер цвета
 * 
 * Поддерживает:
 * - текстовое поле
 * - скрытый <input type="color">
 * - popup с палитрой (S×V), ползунком Hue и Alpha
 */
var ColorPicker = (function () {
  'use strict';

  class ColorPicker {
    constructor(selector, options = {}) {
      this.container = document.querySelector(selector);
      if (!this.container) {
        console.error('ColorPicker: контейнер не найден по селектору', selector);
        return;
      }

      this.options = {
        initialColor: options.initialColor || '#3388ff',
        showAlpha: options.showAlpha !== undefined ? options.showAlpha : true,
        // Новое: позиционирование
        position: options.position || 'auto', // 'auto', 'top-left', 'bottom-center' и т.д.
        // Новое: формат отображения в текстовом поле
        format: options.format || 'auto', // 'auto', 'hex', 'rgb', 'rgba', 'hsl', 'hsla'
      };

      this.color = this.parseColor(this.options.initialColor) || this.hsvToRgb(200 / 360, 1, 1, 1);

      // DOM-элементы
      this.textInput = null;
      this.nativeColorInput = null;
      this.trigger = null;
      this.popup = null;
      this.saturationEl = null;
      this.cursorEl = null;
      this.hueSlider = null;
      this.alphaSlider = null;
      this.hueCursor = null;      // курсор для hue
      this.alphaCursor = null;    // курсор для alpha
      this.isPopupOpen = false;

      this.init();
    }

    init() {
      if (!this.container.classList.contains('color-picker')) {
        this.container.classList.add('color-picker');
      }
      this.createDOM();
      this.bindEvents();
      this.updateUI();
    }

    createDOM() {
      this.container.innerHTML = '';

      this.textInput = document.createElement('input');
      this.textInput.type = 'text';
      this.textInput.className = 'color-picker__text-input';
      this.textInput.placeholder = 'HEX, RGB, HSL...';

      this.nativeColorInput = document.createElement('input');
      this.nativeColorInput.type = 'color';
      this.nativeColorInput.className = 'color-picker__native-input';
      this.nativeColorInput.style.position = 'absolute';
      this.nativeColorInput.style.opacity = '0';
      this.nativeColorInput.style.pointerEvents = 'none';

      this.trigger = document.createElement('div');
      this.trigger.className = 'color-picker__trigger';

      // Создаём popup с курсорами
      this.popup = document.createElement('div');
      this.popup.className = 'color-picker__popup';
      this.popup.innerHTML = `
        <div class="color-picker__saturation">
          <div class="color-picker__cursor"></div>
        </div>
        <div class="color-picker__hue-slider">
          <div class="color-picker__hue-cursor"></div>
        </div>
        ${this.options.showAlpha ? `
        <div class="color-picker__alpha-slider">
          <div class="color-picker__alpha-bg"></div>
          <div class="color-picker__alpha-cursor"></div>
        </div>` : ''}
      `;
      this.popup.style.display = 'none';

      // Сохраняем ссылки
      this.saturationEl = this.popup.querySelector('.color-picker__saturation');
      this.cursorEl = this.popup.querySelector('.color-picker__cursor');
      this.hueSlider = this.popup.querySelector('.color-picker__hue-slider');
      this.hueCursor = this.popup.querySelector('.color-picker__hue-cursor');

      if (this.options.showAlpha) {
        this.alphaSlider = this.popup.querySelector('.color-picker__alpha-slider');
        this.alphaCursor = this.popup.querySelector('.color-picker__alpha-cursor');
      }

      this.container.appendChild(this.textInput);
      this.container.appendChild(this.nativeColorInput);
      this.container.appendChild(this.trigger);
      this.container.appendChild(this.popup);
    }

    bindEvents() {
      this.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePopup();
      });

      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target) && this.isPopupOpen) {
          this.closePopup();
        }
      });

      this.textInput.addEventListener('change', (e) => {
        const parsed = this.parseColor(e.target.value);
        if (parsed) {
          this.setColor(parsed);
        } else {
          // При неверном вводе отображаем текущий цвет в выбранном формате
          this.updateUI();
        }
      });

      // === ПАЛИТРА (S×V) ===
      this.bindSaturationEvents();

      // === HUE SLIDER ===
      this.bindHueEvents();

      // === ALPHA SLIDER ===
      if (this.options.showAlpha) {
        this.bindAlphaEvents();
      }

      // Обновляем позицию при скролле/ресайзе (если popup открыт)
      const onResizeOrScroll = () => {
        if (this.isPopupOpen) {
          this.positionPopup();
        }
      };
      window.addEventListener('resize', onResizeOrScroll);
      window.addEventListener('scroll', onResizeOrScroll, true); // useCapture для надёжности
      // Сохраняем ссылку, чтобы можно было удалить позже (опционально)
      this._resizeHandler = onResizeOrScroll;
    }

    bindSaturationEvents() {
      const onMove = (clientX, clientY) => {
        const rect = this.saturationEl.getBoundingClientRect();
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        x = Math.max(0, Math.min(x, rect.width));
        y = Math.max(0, Math.min(y, rect.height));

        const s = x / rect.width;
        const v = 1 - (y / rect.height);

        const newColor = this.hsvToRgb(this.color.h, s, v, this.color.a);
        this.setColor(newColor);
      };

      const setupDrag = (moveFn, endFn) => {
        const onMouseMove = (e) => moveFn(e.clientX, e.clientY);
        const onTouchMove = (e) => {
          e.preventDefault();
          const t = e.touches[0];
          moveFn(t.clientX, t.clientY);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        const cleanup = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', cleanup);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', cleanup);
        };
        document.addEventListener('mouseup', cleanup);
        document.addEventListener('touchend', cleanup);
      };

      this.saturationEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onMove(e.clientX, e.clientY);
        setupDrag(onMove, null);
      });

      this.saturationEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
        setupDrag(onMove, null);
      });
    }

    bindHueEvents() {
      const onMove = (clientX) => {
        const rect = this.hueSlider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const h = x / rect.width; // 0..1

        const newColor = this.hsvToRgb(h, this.color.s, this.color.v, this.color.a);
        this.setColor(newColor);
      };

      const setupDrag = (moveFn) => {
        const onMouseMove = (e) => moveFn(e.clientX);
        const onTouchMove = (e) => {
          e.preventDefault();
          moveFn(e.touches[0].clientX);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        const cleanup = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', cleanup);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', cleanup);
        };
        document.addEventListener('mouseup', cleanup);
        document.addEventListener('touchend', cleanup);
      };

      this.hueSlider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onMove(e.clientX);
        setupDrag(onMove);
      });

      this.hueSlider.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onMove(e.touches[0].clientX);
        setupDrag(onMove);
      });
    }

    bindAlphaEvents() {
      const onMove = (clientX) => {
        const rect = this.alphaSlider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const a = x / rect.width; // 0..1

        const newColor = { ...this.color, a };
        // Обновим hex (без alpha) и rgba
        newColor.hex = this.rgbToHex(newColor.r, newColor.g, newColor.b);
        this.setColor(newColor);
      };

      const setupDrag = (moveFn) => {
        const onMouseMove = (e) => moveFn(e.clientX);
        const onTouchMove = (e) => {
          e.preventDefault();
          moveFn(e.touches[0].clientX);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        const cleanup = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', cleanup);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', cleanup);
        };
        document.addEventListener('mouseup', cleanup);
        document.addEventListener('touchend', cleanup);
      };

      this.alphaSlider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onMove(e.clientX);
        setupDrag(onMove);
      });

      this.alphaSlider.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onMove(e.touches[0].clientX);
        setupDrag(onMove);
      });
    }

    togglePopup() {
      if (this.isPopupOpen) {
        this.closePopup();
      } else {
        this.openPopup();
      }
    }

    openPopup() {
      this.popup.style.display = 'block';
      this.isPopupOpen = true;
      setTimeout(() => {
        this.updateUI();
        this.positionPopup();
      }, 0);
    }

    closePopup() {
      this.popup.style.display = 'none';
      this.isPopupOpen = false;
    }

    setColor(colorObj) {
      this.color = colorObj;
      this.updateUI();
    }

    /**
     * Форматирует цвет в зависимости от опции this.options.format
     * @param {Object} color - Объект цвета { r, g, b, a, h, s, v, hex }
     * @returns {string} - Строковое представление цвета
     */
    formatColorForDisplay(color) {
      const { r, g, b, a, h, s, l } = color; // l (lightness) вычисляется в parseColor и hsvToRgb

      // Если showAlpha отключен, принудительно считаем alpha = 1 для вывода
      const effectiveAlpha = this.options.showAlpha ? a : 1;

      switch (this.options.format) {
        case 'hex':
          return color.hex;
        case 'rgb':
          return `rgb(${r}, ${g}, ${b})`;
        case 'rgba':
          return `rgba(${r}, ${g}, ${b}, ${effectiveAlpha})`;
        case 'hsl':
          return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
        case 'hsla':
          return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${effectiveAlpha})`;
        case 'auto':
        default:
          // Логика 'auto': если alpha != 1 и showAlpha включён, показываем rgba/hsla
          if (this.options.showAlpha && effectiveAlpha < 1) {
            // Используем rgba, если alpha < 1, независимо от внутреннего формата
            return `rgba(${r}, ${g}, ${b}, ${effectiveAlpha})`;
          } else {
             // Если alpha = 1 или showAlpha = false, используем hex
             return color.hex;
          }
      }
    }


    updateUI() {
      const { hex, r, g, b, a, h, s, v, l } = this.color; // Добавим l, если используется в formatColorForDisplay

      // Используем новый метод для определения значения текстового поля
      this.textInput.value = this.formatColorForDisplay(this.color);

      this.nativeColorInput.value = this.rgbToHex(r, g, b);
      this.trigger.style.backgroundColor = this.rgbaToCss(r, g, b, a);

      // Обновляем палитру под текущий hue
      if (this.saturationEl) {
        this.saturationEl.style.background = `
          linear-gradient(to right, white, rgba(255,255,255,0)),
          linear-gradient(to top, black, rgba(0,0,0,0)),
          hsl(${h * 360}, 100%, 50%)
        `;
      }

      // Позиционируем курсоры
      if (this.cursorEl && this.saturationEl) {
        const rect = this.saturationEl.getBoundingClientRect();
        // Добавим проверку на нулевые размеры
        if (rect.width > 0 && rect.height > 0) {
          const x = s * rect.width;
          const y = (1 - v) * rect.height;
          this.cursorEl.style.left = `${x}px`;
          this.cursorEl.style.top = `${y}px`;
        }
      }

      if (this.hueCursor && this.hueSlider) {
        const rect = this.hueSlider.getBoundingClientRect();
        if (rect.width > 0) {
          const x = h * rect.width;
          this.hueCursor.style.left = `${x}px`;
        }
      }

      if (this.alphaCursor && this.alphaSlider) {
        const rect = this.alphaSlider.getBoundingClientRect();
        if (rect.width > 0) {
          const x = a * rect.width;
          this.alphaCursor.style.left = `${x}px`;

          // Обновляем фон alpha-слайдера под текущий RGB
          this.alphaSlider.querySelector('.color-picker__alpha-bg').style.background = `
            linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)),
            repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0 0 / 16px 16px
          `;
        }
      }
    }

    /**
     * Позиционирует popup относительно триггера
     */
    positionPopup() {
      if (!this.popup || !this.trigger) return;
      const triggerRect = this.trigger.getBoundingClientRect();
      const popupRect = this.popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8; // отступ от края

      // Список всех возможных позиций (для auto-режима)
      const positions = [
        'bottom-left', 'bottom-center', 'bottom-right',
        'top-left', 'top-center', 'top-right',
        'right', 'left'
      ];

      // Если указана конкретная позиция — используем её
      let selectedPosition = this.options.position;

      // Если auto — выбираем первую подходящую позицию
      if (this.options.position === 'auto') {
        for (const pos of positions) {
          const { x, y, fits } = this.calculatePosition(pos, triggerRect, popupRect, viewportWidth, viewportHeight, margin);
          if (fits) {
            selectedPosition = pos;
            this.applyPosition(x, y);
            return;
          }
        }
        // Если ни одна не подошла — используем первую (fallback)
        selectedPosition = positions[0];
      }

      // Применяем выбранную позицию
      const { x, y } = this.calculatePosition(
        selectedPosition, triggerRect, popupRect, viewportWidth, viewportHeight, margin
      ).result || this.calculatePosition(selectedPosition, triggerRect, popupRect, viewportWidth, viewportHeight, margin);
      this.applyPosition(x, y);
    }

    /**
     * Рассчитывает координаты для заданной позиции
     */
    calculatePosition(position, triggerRect, popupRect, vw, vh, margin) {
      let x = 0, y = 0;

      switch (position) {
        case 'top-left':
          x = triggerRect.left;
          y = triggerRect.top - popupRect.height - margin;
          break;
        case 'top-center':
          x = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2;
          y = triggerRect.top - popupRect.height - margin;
          break;
        case 'top-right':
          x = triggerRect.right - popupRect.width;
          y = triggerRect.top - popupRect.height - margin;
          break;
        case 'bottom-left':
          x = triggerRect.left;
          y = triggerRect.bottom + margin;
          break;
        case 'bottom-center':
          x = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2;
          y = triggerRect.bottom + margin;
          break;
        case 'bottom-right':
          x = triggerRect.right - popupRect.width;
          y = triggerRect.bottom + margin;
          break;
        case 'right':
          x = triggerRect.right + margin;
          y = triggerRect.top + triggerRect.height / 2 - popupRect.height / 2;
          break;
        case 'left':
          x = triggerRect.left - popupRect.width - margin;
          y = triggerRect.top + triggerRect.height / 2 - popupRect.height / 2;
          break;
        default:
          x = triggerRect.left;
          y = triggerRect.bottom + margin;
      }

      // Проверяем, помещается ли popup в viewport
      const fits = (
        x >= 0 &&
        y >= 0 &&
        x + popupRect.width <= vw &&
        y + popupRect.height <= vh
      );

      return { x, y, fits };
    }

    /**
     * Применяет координаты к popup
     */
    applyPosition(x, y) {
      // Используем fixed позиционирование для надёжности
      this.popup.style.position = 'fixed';
      this.popup.style.left = `${x}px`;
      this.popup.style.top = `${y}px`;
      this.popup.style.right = 'auto';
      this.popup.style.bottom = 'auto';
    }

    // =============== ЦВЕТОВАЯ МАТЕМАТИКА ===============

    hsvToRgb(h, s, v, a = 1) {
      let r, g, b;

      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);

      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
      }

      r = Math.round(r * 255);
      g = Math.round(g * 255);
      b = Math.round(b * 255);

      // Вычисляем l (lightness) для HSL
      const minRgb = Math.min(r, g, b) / 255; // Переименовано
      const maxRgb = Math.max(r, g, b) / 255; // Переименовано
      const l = (minRgb + maxRgb) / 2;

      const hex = this.rgbToHex(r, g, b);
      return { r, g, b, a, h, s, v, l, hex };
    }

    /**
     * Парсит строку цвета в различных форматах:
     * - #rgb, #rrggbb
     * - rgb(r, g, b)
     * - rgba(r, g, b, a)
     * - hsl(h, s%, l%)
     * - hsla(h, s%, l%, a)
     * Возвращает объект { r, g, b, a, h, s, v, l, hex } или null
     */
    parseColor(str) {
      str = str.trim().toLowerCase();

      // === HEX ===
      if (str.startsWith('#')) {
        let hex = str.substring(1);
        let r, g, b;

        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else {
          return null;
        }

        const { h, s, v } = this.rgbToHsv(r, g, b);
        // Вычисляем l (lightness) для HSL
        const min = Math.min(r, g, b) / 255;
        const max = Math.max(r, g, b) / 255;
        const l = (min + max) / 2;

        return { r, g, b, a: 1, h, s, v, l, hex: `#${hex.padStart(6, '0')}` };
      }

      // === RGB / RGBA ===
      const rgbMatch = str.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/);
      if (rgbMatch) {
        let [_, rStr, gStr, bStr, aStr] = rgbMatch;
        let r = parseInt(rStr, 10);
        let g = parseInt(gStr, 10);
        let b = parseInt(bStr, 10);
        let a = aStr !== undefined ? parseFloat(aStr) : 1;

        // Валидация
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
          return null;
        }

        const { h, s, v } = this.rgbToHsv(r, g, b);
        // Вычисляем l (lightness) для HSL
        const min = Math.min(r, g, b) / 255;
        const max = Math.max(r, g, b) / 255;
        const l = (min + max) / 2;

        const hex = this.rgbToHex(r, g, b);
        return { r, g, b, a, h, s, v, l, hex };
      }

      // === HSL / HSLA ===
      const hslMatch = str.match(/^hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*([\d.]+)\s*)?\)$/);
      if (hslMatch) {
        let [_, hStr, sStr, lStr, aStr] = hslMatch;
        let h = parseInt(hStr, 10) / 360; // нормализуем в 0..1
        let s = parseInt(sStr, 10) / 100;
        let l = parseInt(lStr, 10) / 100;
        let a = aStr !== undefined ? parseFloat(aStr) : 1;

        // Валидация
        if (h < 0 || h > 1 || s < 0 || s > 1 || l < 0 || l > 1 || a < 0 || a > 1) {
          return null;
        }

        // Конвертируем HSL → RGB
        const { r, g, b } = this.hslToRgb(h, s, l);
        // Затем RGB → HSV для внутреннего состояния
        const { h: h2, s: s2, v: v2 } = this.rgbToHsv(r, g, b);
        const hex = this.rgbToHex(r, g, b);
        return { r, g, b, a, h: h2, s: s2, v: v2, l, hex };
      }

      return null;
    }

    rgbToHsv(r, g, b) {
      r /= 255; g /= 255; b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;

      let h, s, v = max;

      if (d === 0) {
        h = 0;
        s = 0;
      } else {
        s = d / max;
        const dr = (((max - r) / 6) + (d / 2)) / d;
        const dg = (((max - g) / 6) + (d / 2)) / d;
        const db = (((max - b) / 6) + (d / 2)) / d;

        if (r === max) h = db - dg;
        else if (g === max) h = (1 / 3) + dr - db;
        else if (b === max) h = (2 / 3) + dg - dr;

        h = (h + 1) % 1;
      }

      // Вычисляем l (lightness) для HSL
      const minL = Math.min(r, g, b) / 255; // Переименовано
      const maxL = Math.max(r, g, b) / 255; // Переименовано
      const l = (minL + maxL) / 2;

      return { h, s, v, l };
    }

    /**
     * Конвертирует HSL → RGB
     * h, s, l — в диапазоне 0..1
     */
    hslToRgb(h, s, l) {
      let r, g, b;

      if (s === 0) {
        r = g = b = l; // achromatic
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    }

    rgbToHex(r, g, b) {
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }

    rgbaToCss(r, g, b, a) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }

  return ColorPicker;
})();