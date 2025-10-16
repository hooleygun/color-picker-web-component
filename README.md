# ColorPicker

[English](#colorpicker-en) | [Русский](#colorpicker-ru)

---

## ColorPicker (EN)

A lightweight, customizable vanilla JavaScript color picker component.

### Features

*   **Customizable Palette:** Choose color by dragging on the saturation/value (S×V) area.
*   **Hue Slider:** Adjust the hue (color tone) with a dedicated slider.
*   **Alpha Channel:** Optional transparency slider for RGBA support. Alpha values are rounded to two decimal places (e.g., 0.56).
*   **Flexible Input:** Supports input in various formats: `#hex`, `rgb(r, g, b)`, `rgba(r, g, b, a)`, `hsl(h, s%, l%)`, `hsla(h, s%, l%, a)`.
*   **Automatic CSS Class:** Automatically adds the required `.color-picker` class to the container for styling, regardless of its initial class.
*   **Smart Positioning:** Popup can be positioned relative to the trigger button (`top-left`, `bottom-center`, etc.) or set to `auto` to stay within the viewport.
*   **Customizable Display Format:** Choose how the color is displayed in the text input field (e.g., `hex`, `rgba`, `hsla`). Defaults to showing `hex` unless alpha is less than 1, then shows `rgba`.
*   **Hideable Text Input:** Option to hide the manual text input field.
*   **Touch & Mouse Support:** Works seamlessly on both desktop and mobile devices.
*   **No Dependencies:** Pure vanilla JavaScript, no external libraries required.

### Installation

1.  Download the `color-picker.js` and `color-picker.css` files.
2.  Link the CSS file in the `<head>` of your HTML document:
    ```html
    <link rel="stylesheet" href="path/to/color-picker.css">
    ```
3.  Link the JS file before the closing `</body>` tag of your HTML document:
    ```html
    <script src="path/to/color-picker.js"></script>
    ```

### Usage

1.  Create an HTML element that will serve as the container for the color picker. You can use any element and any selector (e.g., an ID or a class).
    ```html
    <div id="my-color-picker"></div>
    <!-- Or -->
    <span class="picker-container"></span>
    ```

2.  Initialize the `ColorPicker` instance by passing the CSS selector of your container and an optional configuration object.

    ```javascript
    // Example 1: Using an ID selector
    const colorPicker = new ColorPicker('#my-color-picker', {
      initialColor: '#ff5500', // Starting color
      showAlpha: true,         // Show alpha slider
      position: 'auto',        // Auto position the popup
      format: 'rgba',          // Display format in text input
      showTextInput: true      // Show the text input field
    });

    // Example 2: Using a class selector
    const colorPicker2 = new ColorPicker('.picker-container', {
      initialColor: 'rgb(0, 255, 0)',
      showAlpha: false,
      position: 'top-center',  // Position above the trigger, centered
      format: 'hex'            // Display format in text input
    });
    ```

### Options

You can configure the color picker during initialization using the `options` object:

*   `initialColor` (String, default: `'#3388ff'`): The color the picker starts with.
*   `showAlpha` (Boolean, default: `true`): Whether to display the alpha (transparency) slider. When enabled, alpha values are rounded to two decimal places internally and for display.
*   `position` (String, default: `'auto'`): Where to place the popup relative to the trigger. Possible values:
    *   `'auto'`: Automatically chooses a position that fits within the viewport.
    *   `'top-left'`
    *   `'top-center'`
    *   `'top-right'`
    *   `'bottom-left'`
    *   `'bottom-center'` (default when `auto` is not used)
    *   `'bottom-right'`
    *   `'left'`
    *   `'right'`
*   `format` (String, default: `'auto'`): The format used to display the color in the text input. Possible values:
    *   `'auto'`: Shows `hex` if `alpha` is 1, otherwise shows `rgba(r, g, b, a)`. This is the previous behavior described in the "Вариант 1" improvement.
    *   `'hex'`: Always shows the color in hexadecimal format (e.g., `#ff0000`). Alpha information is not displayed.
    *   `'rgb'`: Always shows the color in RGB format (e.g., `rgb(255, 0, 0)`). Alpha information is not displayed.
    *   `'rgba'`: Always shows the color in RGBA format (e.g., `rgba(255, 0, 0, 1)` or `rgba(255, 0, 0, 0.5)`). Alpha is rounded to two decimal places.
    *   `'hsl'`: Always shows the color in HSL format (e.g., `hsl(0, 100%, 50%)`). Alpha information is not displayed.
    *   `'hsla'`: Always shows the color in HSLA format (e.g., `hsla(0, 100%, 50%, 1)` or `hsla(0, 100%, 50%, 0.5)`). Alpha is rounded to two decimal places.
*   `showTextInput` (Boolean, default: `true`): Whether to display the text input field for manual color entry.

### Functionality

*   **Visual Trigger:** A small colored square allows you to open the color selection popup.
*   **Text Input:** Manually enter a color value in the text field. Supports HEX, RGB(A), HSL(A) formats. Invalid inputs are reverted to the current color.
*   **Popup Palette:**
    *   **Saturation/Value Area:** Drag horizontally to change saturation, vertically to change value/brightness.
    *   **Hue Slider:** Drag horizontally to change the main color tone.
    *   **Alpha Slider (Optional):** Drag horizontally to adjust transparency. Alpha values are rounded to two decimal places (e.g., 0.56).
*   **Automatic Styling:** The library automatically adds the `color-picker` class to your container, ensuring the correct styles are applied even if the initial HTML element doesn't have it.

---

## ColorPicker (RU)

Легкий, настраиваемый компонент цветового пикера на чистом JavaScript.

### Возможности

*   **Настраиваемая палитра:** Выбирайте цвет, перетаскивая курсор по области насыщенности/яркости (S×V).
*   **Ползунок оттенка:** Регулируйте оттенок (тон цвета) с помощью отдельного ползунка.
*   **Альфа-канал:** Опциональный ползунок прозрачности для поддержки RGBA. Значения альфа округляются до сотых (например, 0.56).
*   **Гибкий ввод:** Поддерживает ввод в различных форматах: `#hex`, `rgb(r, g, b)`, `rgba(r, g, b, a)`, `hsl(h, s%, l%)`, `hsla(h, s%, l%, a)`.
*   **Автоматический CSS-класс:** Автоматически добавляет необходимый класс `.color-picker` к контейнеру для стилизации, независимо от его исходного класса.
*   **Умное позиционирование:** Всплывающее окно можно позиционировать относительно кнопки-триггера (`top-left`, `bottom-center` и т.д.) или установить в режим `auto`, чтобы оно всегда оставалось в пределах области просмотра.
*   **Настраиваемый формат отображения:** Выберите, как цвет отображается в текстовом поле (например, `hex`, `rgba`, `hsla`). По умолчанию показывает `hex`, если alpha равен 1, иначе `rgba`.
*   **Скрываемое текстовое поле:** Возможность скрыть поле ручного ввода.
*   **Поддержка сенсорного экрана и мыши:** Беспроблемно работает как на настольных, так и на мобильных устройствах.
*   **Без зависимостей:** Чистый JavaScript, не требует внешних библиотек.

### Установка

1.  Скачайте файлы `color-picker.js` и `color-picker.css`.
2.  Подключите CSS-файл в `<head>` вашего HTML-документа:
    ```html
    <link rel="stylesheet" href="path/to/color-picker.css">
    ```
3.  Подключите JS-файл перед закрывающим тегом `</body>` вашего HTML-документа:
    ```html
    <script src="path/to/color-picker.js"></script>
    ```

### Использование

1.  Создайте HTML-элемент, который будет служить контейнером для цветового пикера. Вы можете использовать любой элемент и любой селектор (например, ID или класс).
    ```html
    <div id="my-color-picker"></div>
    <!-- Или -->
    <span class="picker-container"></span>
    ```

2.  Инициализируйте экземпляр `ColorPicker`, передав CSS-селектор вашего контейнера и необязательный объект конфигурации.

    ```javascript
    // Пример 1: Использование селектора ID
    const colorPicker = new ColorPicker('#my-color-picker', {
      initialColor: '#ff5500', // Начальный цвет
      showAlpha: true,         // Показать ползунок альфа-канала
      position: 'auto',        // Автоматически позиционировать всплывающее окно
      format: 'rgba',          // Формат отображения в текстовом поле
      showTextInput: true      // Показать поле текстового ввода
    });

    // Пример 2: Использование селектора класса
    const colorPicker2 = new ColorPicker('.picker-container', {
      initialColor: 'rgb(0, 255, 0)',
      showAlpha: false,
      position: 'top-center',  // Позиционировать над триггером, по центру
      format: 'hex'            // Формат отображения в текстовом поле
    });
    ```

### Параметры

Вы можете настроить цветовой пикер во время инициализации с помощью объекта `options`:

*   `initialColor` (String, по умолчанию: `'#3388ff'`): Цвет, с которого начинает пикер.
*   `showAlpha` (Boolean, по умолчанию: `true`): Показывать ли ползунок альфа-канала (прозрачности). Когда включено, значения альфа округляются до двух знаков после запятой.
*   `position` (String, по умолчанию: `'auto'`): Где размещать всплывающее окно относительно триггера. Возможные значения:
    *   `'auto'`: Автоматически выбирает позицию, которая помещается в область просмотра.
    *   `'top-left'`
    *   `'top-center'`
    *   `'top-right'`
    *   `'bottom-left'`
    *   `'bottom-center'` (по умолчанию, если `auto` не используется)
    *   `'bottom-right'`
    *   `'left'`
    *   `'right'`
*   `format` (String, по умолчанию: `'auto'`): Формат, используемый для отображения цвета в текстовом поле. Возможные значения:
    *   `'auto'`: Показывает `hex`, если `alpha` равен 1, иначе показывает `rgba(r, g, b, a)`. Это поведение, описанное в улучшении "Вариант 1".
    *   `'hex'`: Всегда показывает цвет в шестнадцатеричном формате (например, `#ff0000`). Информация об альфа-канале не отображается.
    *   `'rgb'`: Всегда показывает цвет в формате RGB (например, `rgb(255, 0, 0)`). Информация об альфа-канале не отображается.
    *   `'rgba'`: Всегда показывает цвет в формате RGBA (например, `rgba(255, 0, 0, 1)` или `rgba(255, 0, 0, 0.5)`). Альфа округляется до двух знаков после запятой.
    *   `'hsl'`: Всегда показывает цвет в формате HSL (например, `hsl(0, 100%, 50%)`). Информация об альфа-канале не отображается.
    *   `'hsla'`: Всегда показывает цвет в формате HSLA (например, `hsla(0, 100%, 50%, 1)` или `hsla(0, 100%, 50%, 0.5)`). Альфа округляется до двух знаков после запятой.
*   `showTextInput` (Boolean, по умолчанию: `true`): Показывать ли текстовое поле для ручного ввода цвета.

### Функциональность

*   **Визуальный триггер:** Небольшой цветной квадрат позволяет открыть всплывающее окно выбора цвета.
*   **Текстовое поле:** Вручную введите значение цвета в текстовое поле. Поддерживает форматы HEX, RGB(A), HSL(A). Неверные вводы возвращаются к текущему цвету.
*   **Всплывающая палитра:**
    *   **Область насыщенности/яркости:** Перетаскивайте по горизонтали, чтобы изменить насыщенность, по вертикали — яркость.
    *   **Ползунок оттенка:** Перетаскивайте по горизонтали, чтобы изменить основной тон цвета.
    *   **Ползунок альфа-канала (опционально):** Перетаскивайте по горизонтали, чтобы регулировать прозрачность. Значения альфа округляются до сотых (например, 0.56).
*   **Автоматическая стилизация:** Библиотека автоматически добавляет класс `color-picker` к вашему контейнеру, гарантируя применение правильных стилей, даже если исходный HTML-элемент не имеет его.