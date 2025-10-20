/**
 * ColorPicker Web Component - A simple, customizable color picker component.
 * Uses IIFE to avoid polluting the global scope.
 */
var ColorPicker = (function () {
  'use strict';

  class ColorPicker {
    constructor(selector, options = {}) {
      // Attempt to find the container element in the DOM
      this.container = document.querySelector(selector);
      if (!this.container) {
        console.error('ColorPicker: container element not found for selector', selector);
        return;
      }

      // Store user-provided options with default fallbacks
      this.options = {
        initialColor: options.initialColor || '#3388ff',
        showAlpha: options.showAlpha !== undefined ? options.showAlpha : true,
        position: options.position || 'auto', // 'auto', 'top-left', etc.
        format: options.format || 'auto', // 'auto', 'hex', 'rgb', 'rgba', 'hsl', 'hsla'
        showTextInput: options.showTextInput !== undefined ? options.showTextInput : true, // Option to hide text input
      };

      // Parse the initial color string into an internal color object (HSV, RGB, HSL, Hex, Alpha)
      this.color = this.parseColor(this.options.initialColor) || this.hsvToRgb(200 / 360, 1, 1, 1);

      // DOM element references to be created later
      this.textInput = null;
      this.nativeColorInput = null; // Hidden native input for form compatibility
      this.trigger = null; // Visual color trigger button
      this.popup = null; // The color picker popup
      this.saturationEl = null; // Saturation/value area element
      this.cursorEl = null; // Cursor inside the saturation area
      this.hueSlider = null; // Hue slider element
      this.alphaSlider = null; // Alpha slider element
      this.hueCursor = null; // Cursor for the hue slider
      this.alphaCursor = null; // Cursor for the alpha slider
      this.isPopupOpen = false; // Flag to track popup visibility
      this._resizeHandler = null; // Reference to the resize/scroll event handler

      this.init();
    }

    init() {
      // Ensure the container has the required CSS class for styling
      if (!this.container.classList.contains('color-picker')) {
        this.container.classList.add('color-picker');
      }
      this.createDOM();
      this.bindEvents();
      this.updateUI();
    }

    createDOM() {
      // Clear the container
      this.container.innerHTML = '';

      // Create the text input for manual color entry
      this.textInput = document.createElement('input');
      this.textInput.type = 'text';
      this.textInput.className = 'text-input';
      this.textInput.placeholder = 'HEX, RGB, HSL...';
      // Hide the text input if the option is set to false
      if (!this.options.showTextInput) {
        this.textInput.style.display = 'none';
      }

      // Create the hidden native color input (for form compatibility)
      this.nativeColorInput = document.createElement('input');
      this.nativeColorInput.type = 'color';
      this.nativeColorInput.className = 'native-input';

      // Create the visual trigger button
      this.trigger = document.createElement('div');
      this.trigger.className = 'swatch';

      // Create the popup element (initially hidden)
      this.popup = document.createElement('div');
      this.popup.className = 'popover';
      // Build the popup content with sliders
      this.popup.innerHTML = `
        <div class="saturation">
          <div class="cursor"></div>
        </div>
        <div class="hue">
          <div class="cursor"></div>
        </div>
        ${this.options.showAlpha ? `
        <div class="alpha">
          <div class="bg"></div>
          <div class="cursor"></div>
        </div>` : ''}
      `;
      this.popup.style.display = 'none'; // Initially hidden

      // Store references to important child elements for later use
      this.saturationEl = this.popup.querySelector('.saturation');
      this.cursorEl = this.saturationEl.querySelector('.cursor');
      this.hueSlider = this.popup.querySelector('.hue');
      this.hueCursor = this.hueSlider.querySelector('.cursor');

      if (this.options.showAlpha) {
        this.alphaSlider = this.popup.querySelector('.alpha');
        this.alphaCursor = this.alphaSlider.querySelector('.cursor');
      }

      // Append elements to the container
      this.container.appendChild(this.textInput);
      this.container.appendChild(this.nativeColorInput);
      this.container.appendChild(this.trigger);
      this.container.appendChild(this.popup);
    }

    bindEvents() {
      // Open/close popup on trigger click
      this.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePopup();
      });

      // Close popup if clicked outside
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target) && this.isPopupOpen) {
          this.closePopup();
        }
      });

      // Handle manual color input changes
      this.textInput.addEventListener('change', (e) => {
        const parsed = this.parseColor(e.target.value);
        if (parsed) {
          this.setColor(parsed);
        } else {
          // Revert to current color if input is invalid
          this.updateUI(); // Use updateUI to reflect the current format
        }
      });

      // Bind events for interactive areas: saturation, hue, alpha
      this.bindSaturationEvents();
      this.bindHueEvents();
      if (this.options.showAlpha) {
        this.bindAlphaEvents();
      }

      // Bind handlers for window resize/scroll to reposition popup if needed
      this._resizeHandler = () => {
        if (this.isPopupOpen) {
          this.positionPopup();
        }
      };
      window.addEventListener('resize', this._resizeHandler);
      window.addEventListener('scroll', this._resizeHandler, true); // useCapture for robustness
    }

    bindSaturationEvents() {
      const onMove = (clientX, clientY) => {
        const rect = this.saturationEl.getBoundingClientRect();
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        x = Math.max(0, Math.min(x, rect.width));
        y = Math.max(0, Math.min(y, rect.height));

        // Calculate saturation (s) and value (v) based on coordinates
        const s = x / rect.width;
        const v = 1 - (y / rect.height); // Invert Y axis

        const newColor = this.hsvToRgb(this.color.h, s, v, this.color.a);
        this.setColor(newColor);
      };

      const setupDrag = (moveFn) => {
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
        setupDrag(onMove);
      });

      this.saturationEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
        setupDrag(onMove);
      });
    }

    bindHueEvents() {
      const onMove = (clientX) => {
        const rect = this.hueSlider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const h = x / rect.width; // Hue value (0 to 1)

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
        // Round alpha to two decimal places (0.00 to 1.00)
        const a = Math.round((x / rect.width) * 100) / 100;

        const newColor = { ...this.color, a };
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
      // Use setTimeout to ensure DOM is rendered before updating UI/position
      setTimeout(() => {
        this.updateUI(); // Update UI elements (cursors, backgrounds) now that popup is visible
        this.positionPopup(); // Position the popup on screen
      }, 0);
    }

    closePopup() {
      this.popup.style.display = 'none';
      this.isPopupOpen = false;
    }

    setColor(colorObj) {
      this.color = colorObj; // Update internal color state
      this.updateUI(); // Reflect the new color in the UI elements
    }

    /**
     * Formats the current color object based on the 'format' option.
     * @param {Object} color - The color object to format.
     * @returns {string} - The formatted color string.
     */
    formatColorForDisplay(color) {
      const { r, g, b, a, h, s, l } = color;

      // If alpha is disabled, treat alpha as 1 for display purposes
      // Otherwise, use the current alpha value, rounded to 2 decimal places for display
      const effectiveAlpha = this.options.showAlpha ? parseFloat(a.toFixed(2)) : 1;

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
          // Auto logic: show rgba if alpha is not 1 and showAlpha is true
          if (this.options.showAlpha && effectiveAlpha < 1) {
            return `rgba(${r}, ${g}, ${b}, ${effectiveAlpha})`;
          } else {
             // Otherwise, show hex
             return color.hex;
          }
      }
    }

    updateUI() {
      const { hex, r, g, b, a, h, s, v, l } = this.color;

      // Update the text input based on the selected format
      this.textInput.value = this.formatColorForDisplay(this.color);

      // Update the hidden native input (always RGB hex)
      this.nativeColorInput.value = this.rgbToHex(r, g, b);

      // Update the trigger button's background color
      this.trigger.style.backgroundColor = this.rgbaToCss(r, g, b, a);

      // Update the saturation area's background gradient based on current hue
      if (this.saturationEl) {
        this.saturationEl.style.background = `
          linear-gradient(to right, white, rgba(255,255,255,0)),
          linear-gradient(to top, black, rgba(0,0,0,0)),
          hsl(${h * 360}, 100%, 50%)
        `;
      }

      // Position the saturation cursor based on s and v
      if (this.cursorEl && this.saturationEl) {
        const rect = this.saturationEl.getBoundingClientRect();
        // Only position if the element has a size (avoids NaN)
        if (rect.width > 0 && rect.height > 0) {
          const x = s * rect.width;
          const y = (1 - v) * rect.height; // Invert Y again for positioning
          this.cursorEl.style.left = `${x}px`;
          this.cursorEl.style.top = `${y}px`;
        }
      }

      // Position the hue cursor based on h
      if (this.hueCursor && this.hueSlider) {
        const rect = this.hueSlider.getBoundingClientRect();
        if (rect.width > 0) {
          const x = h * rect.width;
          this.hueCursor.style.left = `${x}px`;
        }
      }

      // Position the alpha cursor based on a and update its background
      if (this.alphaCursor && this.alphaSlider) {
        const rect = this.alphaSlider.getBoundingClientRect();
        if (rect.width > 0) {
          // Calculate x based on rounded alpha for consistency
          const roundedA = parseFloat(a.toFixed(2));
          const x = roundedA * rect.width;
          this.alphaCursor.style.left = `${x}px`;

          // Update the alpha slider's background gradient based on current RGB
          this.alphaSlider.querySelector('.bg').style.background = `
            linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, ${roundedA})),
            repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0 0 / 16px 16px
          `;
        }
      }
    }

    /**
     * Positions the popup relative to the trigger button, ensuring it stays within the viewport.
     * Uses the `position` option to determine the preferred placement.
     */
    positionPopup() {
      if (!this.popup || !this.trigger) return; // Exit if elements are missing

      const triggerRect = this.trigger.getBoundingClientRect();
      const popupRect = this.popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8; // Small margin from the trigger

      // List of positions to try in 'auto' mode
      const positions = [
        'bottom-left', 'bottom-center', 'bottom-right',
        'top-left', 'top-center', 'top-right',
        'right', 'left'
      ];

      let selectedPosition = this.options.position;

      // If 'auto', find the first position that fits within the viewport
      if (this.options.position === 'auto') {
        for (const pos of positions) {
          const { x, y, fits } = this.calculatePosition(pos, triggerRect, popupRect, viewportWidth, viewportHeight, margin);
          if (fits) {
            selectedPosition = pos;
            this.applyPosition(x, y);
            return; // Position found, exit
          }
        }
        // Fallback if no position fits perfectly
        selectedPosition = positions[0];
      }

      // Calculate position for the chosen or fallback placement
      const { x, y } = this.calculatePosition(selectedPosition, triggerRect, popupRect, viewportWidth, viewportHeight, margin);
      this.applyPosition(x, y); // Apply the calculated coordinates
    }

    /**
     * Calculates the absolute coordinates (x, y) for a given position relative to the trigger.
     * @param {string} position - The desired position (e.g., 'bottom-center').
     * @param {DOMRect} triggerRect - Bounding rect of the trigger.
     * @param {DOMRect} popupRect - Bounding rect of the popup.
     * @param {number} vw - Viewport width.
     * @param {number} vh - Viewport height.
     * @param {number} margin - Margin between trigger and popup.
     * @returns {Object} - Object containing x, y coordinates and a 'fits' boolean.
     */
    calculatePosition(position, triggerRect, popupRect, vw, vh, margin) {
      let x = 0, y = 0;

      // Calculate coordinates based on the requested position
      switch (position) {
        case 'top-left':
          x = triggerRect.right - popupRect.width; // Align right edge of trigger with right edge of popup
          y = triggerRect.top - popupRect.height - margin;
          break;
        case 'top-center':
          x = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2; // Center horizontally
          y = triggerRect.top - popupRect.height - margin;
          break;
        case 'top-right':
          x = triggerRect.left; // Align left edge of trigger with left edge of popup
          y = triggerRect.top - popupRect.height - margin;
          break;
        case 'bottom-left':
          x = triggerRect.right - popupRect.width; // Align right edge of trigger with right edge of popup
          y = triggerRect.bottom + margin;
          break;
        case 'bottom-center':
          x = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2; // Center horizontally
          y = triggerRect.bottom + margin;
          break;
        case 'bottom-right':
          x = triggerRect.left; // Align left edge of trigger with left edge of popup
          y = triggerRect.bottom + margin;
          break;
        case 'right':
          x = triggerRect.right + margin;
          y = triggerRect.top + triggerRect.height / 2 - popupRect.height / 2; // Center vertically
          break;
        case 'left':
          x = triggerRect.left - popupRect.width - margin;
          y = triggerRect.top + triggerRect.height / 2 - popupRect.height / 2; // Center vertically
          break;
        default:
          // Default to bottom-left if position is unknown (align left edges)
          x = triggerRect.left;
          y = triggerRect.bottom + margin;
      }

      // Check if the calculated position fits within the viewport
      const fits = (
        x >= 0 && y >= 0 &&
        x + popupRect.width <= vw &&
        y + popupRect.height <= vh
      );

      return { x, y, fits };
    }

    /**
     * Applies the calculated x, y coordinates to the popup element using fixed positioning.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     */
    applyPosition(x, y) {
      // Use 'fixed' positioning for reliable placement relative to the viewport
      this.popup.style.position = 'fixed';
      this.popup.style.left = `${x}px`;
      this.popup.style.top = `${y}px`;
      // Reset other position properties to avoid conflicts
      this.popup.style.right = 'auto';
      this.popup.style.bottom = 'auto';
    }

    // =============== COLOR CONVERSION UTILITIES ===============

    /**
     * Converts HSV (Hue, Saturation, Value) to RGB (Red, Green, Blue).
     * @param {number} h - Hue (0 to 1).
     * @param {number} s - Saturation (0 to 1).
     * @param {number} v - Value (0 to 1).
     * @param {number} a - Alpha (0 to 1), defaults to 1.
     * @returns {Object} - Object containing r, g, b, a, h, s, v, l, hex.
     */
    hsvToRgb(h, s, v, a = 1) {
      let r, g, b;

      // Algorithm to convert HSV to RGB
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

      // Convert 0-1 values to 0-255 integers
      r = Math.round(r * 255);
      g = Math.round(g * 255);
      b = Math.round(b * 255);

      // Calculate HSL lightness (l) for potential display formatting
      const minRgb = Math.min(r, g, b) / 255; // Renamed to avoid conflict
      const maxRgb = Math.max(r, g, b) / 255; // Renamed to avoid conflict
      const l = (minRgb + maxRgb) / 2;

      // Convert RGB to hex string
      const hex = this.rgbToHex(r, g, b);

      // Return the color object
      return { r, g, b, a, h, s, v, l, hex };
    }

    /**
     * Parses a color string (hex, rgb, rgba, hsl, hsla) into an internal color object.
     * @param {string} str - The color string to parse.
     * @returns {Object|null} - The color object or null if parsing fails.
     */
    parseColor(str) {
      str = str.trim().toLowerCase();

      // --- Parse Hexadecimal Color ---
      if (str.startsWith('#')) {
        let hex = str.substring(1);
        let r, g, b;

        if (hex.length === 3) {
          // Expand #rgb to #rrggbb
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else {
          return null; // Invalid hex length
        }

        // Convert RGB to HSV for internal storage
        const { h, s, v } = this.rgbToHsv(r, g, b);
        // Calculate HSL lightness (l)
        const min = Math.min(r, g, b) / 255;
        const max = Math.max(r, g, b) / 255;
        const l = (min + max) / 2;
        return { r, g, b, a: 1, h, s, v, l, hex: `#${hex.padStart(6, '0')}` };
      }

      // --- Parse RGB / RGBA ---
      const rgbMatch = str.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/);
      if (rgbMatch) {
        let [_, rStr, gStr, bStr, aStr] = rgbMatch;
        let r = parseInt(rStr, 10);
        let g = parseInt(gStr, 10);
        let b = parseInt(bStr, 10);
        // Parse alpha and round it to 2 decimal places immediately after parsing
        let a = aStr !== undefined ? parseFloat(parseFloat(aStr).toFixed(2)) : 1; // Default alpha to 1

        // Validate RGB values
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
          return null;
        }

        const { h, s, v } = this.rgbToHsv(r, g, b);
        // Calculate HSL lightness (l)
        const min = Math.min(r, g, b) / 255;
        const max = Math.max(r, g, b) / 255;
        const l = (min + max) / 2;
        const hex = this.rgbToHex(r, g, b);
        return { r, g, b, a, h, s, v, l, hex };
      }

      // --- Parse HSL / HSLA ---
      const hslMatch = str.match(/^hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*([\d.]+)\s*)?\)$/);
      if (hslMatch) {
        let [_, hStr, sStr, lStr, aStr] = hslMatch;
        let h = parseInt(hStr, 10) / 360; // Normalize hue to 0-1
        let s = parseInt(sStr, 10) / 100; // Normalize saturation to 0-1
        let l = parseInt(lStr, 10) / 100; // Normalize lightness to 0-1
        // Parse alpha and round it to 2 decimal places immediately after parsing
        let a = aStr !== undefined ? parseFloat(parseFloat(aStr).toFixed(2)) : 1; // Default alpha to 1

        // Validate HSL values
        if (h < 0 || h > 1 || s < 0 || s > 1 || l < 0 || l > 1 || a < 0 || a > 1) {
          return null;
        }

        // Convert HSL to RGB first
        const { r, g, b } = this.hslToRgb(h, s, l);
        // Then convert the resulting RGB to HSV for internal storage
        const { h: h2, s: s2, v: v2 } = this.rgbToHsv(r, g, b);
        const hex = this.rgbToHex(r, g, b);
        return { r, g, b, a, h: h2, s: s2, v: v2, l, hex };
      }

      return null; // Parsing failed for all formats
    }

    /**
     * Converts RGB to HSV.
     * @param {number} r - Red (0-255).
     * @param {number} g - Green (0-255).
     * @param {number} b - Blue (0-255).
     * @returns {Object} - Object containing h, s, v, l (all 0-1).
     */
    rgbToHsv(r, g, b) {
      // Normalize RGB to 0-1
      r /= 255; g /= 255; b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;

      let h, s, v = max;
      let l; // HSL lightness

      if (d === 0) {
        h = 0; // achromatic
        s = 0;
      } else {
        s = d / max;
        const dr = (((max - r) / 6) + (d / 2)) / d;
        const dg = (((max - g) / 6) + (d / 2)) / d;
        const db = (((max - b) / 6) + (d / 2)) / d;

        if (r === max) h = db - dg;
        else if (g === max) h = (1 / 3) + dr - db;
        else if (b === max) h = (2 / 3) + dg - dr;

        h = (h + 1) % 1; // Ensure hue is between 0 and 1
      }

      // Calculate HSL lightness (l) as well
      const minL = Math.min(r, g, b) / 255; // Renamed to avoid conflict
      const maxL = Math.max(r, g, b) / 255; // Renamed to avoid conflict
      l = (minL + maxL) / 2;

      return { h, s, v, l };
    }

    /**
     * Converts HSL to RGB.
     * @param {number} h - Hue (0-1).
     * @param {number} s - Saturation (0-1).
     * @param {number} l - Lightness (0-1).
     * @returns {Object} - Object containing r, g, b (0-255).
     */
    hslToRgb(h, s, l) {
      let r, g, b;

      if (s === 0) {
        r = g = b = l; // achromatic
      } else {
        // Helper function for hue to RGB conversion
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

    /**
     * Converts RGB (0-255) to Hex string.
     * @param {number} r - Red.
     * @param {number} g - Green.
     * @param {number} b - Blue.
     * @returns {string} - Hex string (e.g., "#ff0000").
     */
    rgbToHex(r, g, b) {
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }

    /**
     * Converts RGB and Alpha to CSS rgba() string.
     * @param {number} r - Red.
     * @param {number} g - Green.
     * @param {number} b - Blue.
     * @param {number} a - Alpha.
     * @returns {string} - CSS rgba string.
     */
    rgbaToCss(r, g, b, a) {
      // Round alpha for display in CSS string
      const roundedA = parseFloat(a.toFixed(2));
      return `rgba(${r}, ${g}, ${b}, ${roundedA})`;
    }
  }

  // Return the ColorPicker class as the result of the IIFE
  return ColorPicker;
})();