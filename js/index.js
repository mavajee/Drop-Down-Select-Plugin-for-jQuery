'use strict';
// =======================================
// DROPDOWN PLUGIN
// =======================================

/** 
* OPTIONS
* @param {jQuery} element
* @param {Object} options - Plugin options.
* @param {boolean} employees.autoscroll - Enable auto scroll to selected item when opening
* @param {boolean} employees.keyInput - Allow search
*/

(function($){
    var ENTER = 13,
        TAB   = 9,
        ESC   = 27,
        UP    = 38,
        DOWN  = 40,
        SPACE = 32;

    var TIME_TO_CLEAR = 1300;

    // HELPER FUNCTIONS
    function scrollToItem(block, item) {
        var pos = item.position();

        pos = block.scrollTop() + pos.top;
        block.scrollTop(pos);
    }

    function cancelEvent(e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        e.cancelBubble = true;
        e.returnValue = false;
        return false;
    }

    // =======================================
    // DROPDOWN SELECT CLASS DEFINITION
    // =======================================

    var DropdownSelect = function (element, options) {
        this.isHidden = true;

        this.element = $(element);
        this.dropMenu = $('[role="dropdown-menu"]', element);
        this.selectedMenuItem = $('.selected', this.dropMenu);
        this.hoverMenuItem = this.selectedMenuItem.length ? this.selectedMenuItem : $('[role="menu-item"]', this.element).first();
        this.dropDownToggleBtn = $('[role="dropdown-toggle"]', element);

        this.options = $.extend({
            autoscroll: true,
            keyEvents: true,
            onSelect: this.onSelect
        }, options);

        // bind events
        this.dropDownToggleBtn.on({
            mousedown: function (e) {
                this.toggle();

                while (e.originalEvent) {
                    e = e.originalEvent;
                }
                e.preventDefault();
                e.returnValue = false;

                if(!this.isHidden) this.dropDownToggleBtn.focus();
            }.bind(this),

            focusin: function (e) {
                this.show();
            }.bind(this)
        });

        $('[role="menu-item"]', element).on({
            mousedown: function(e){
                this.select($(e.currentTarget));
                this.hide();
            }.bind(this),

            mouseenter: function (e) {
               this.move($(e.currentTarget));
            }.bind(this)
        });

        $(document).on('mousedown', function (e) { // событие клика по веб-документу
            if (!this.dropDownToggleBtn.is(e.target) // если клик был не по нашему блоку
                && this.element.has(e.target).length === 0) { // и не по его дочерним элементам
                this.hide();    // скрываем меню
            }
        }.bind(this));
        // end bind events

        this.options.keyEvents && this.enableKeyEvents();
    };

    DropdownSelect.prototype.toggle = function (e){
        this.isHidden ? this.show() : this.hide();
    };

    DropdownSelect.prototype.show = function () {
        this.hoverMenuItem = this.selectedMenuItem.length ? this.selectedMenuItem : $('[role="menu-item"]', this.element).first();
        this.dropMenu.show({duration: 0, done: function () {
            if(this.options.autoscroll)
                this.move(this.hoverMenuItem, true);
        }.bind(this)});

        this.isHidden = false;
    };

    DropdownSelect.prototype.hide = function () {
        this.highlight();
        this.dropMenu.hide();
        this.isHidden = true;
    };

    DropdownSelect.prototype.highlight= function (newItem) {
        this.selectedMenuItem.removeClass('selected');
        this.hoverMenuItem.removeClass('selected');
        if(newItem) newItem.addClass('selected'); // помечаем выбранный объект
    };

    DropdownSelect.prototype.select = function (menuItem, scroll) {
        this.highlight(menuItem);
        this.selectedMenuItem = menuItem;
        // todo
        this.options.onSelect(menuItem.get(0), this.element);
        // todo remove duplicate
        if(scroll){
            scrollToItem(this.dropMenu, menuItem);
        }

        this.hoverMenuItem = this.selectedMenuItem;
    };

    DropdownSelect.prototype.move = function (menuItem, scroll) {
        this.highlight(menuItem);
        this.hoverMenuItem = menuItem;

        if(scroll){
            scrollToItem(this.dropMenu, menuItem);
        }
    };

    DropdownSelect.prototype.onSelect = function (selectedItem, element){
        var value = selectedItem.dataset.value,
            name = selectedItem.dataset.name;

        // $('[role="name"]', element).html(name);
        // $('[role="value"]', element).val(value).change();
        var $nameItem = $('[role="name"]', element),
            $valueItem = $('[role="value"]', element);

        $nameItem.prop("tagName").toLowerCase() != 'input' ? $nameItem.html(name) : $nameItem.val(name).change();
        $valueItem.prop("tagName").toLowerCase() != 'input' ? $valueItem.html(value) : $valueItem.val(value).change();

        $(element).trigger( "dropdown.select" );
    };

    DropdownSelect.prototype.selectByDataName = function (val, dataName) {
        dataName = dataName || 'value';
        dataName = 'li[data-' + dataName + '=' + val + ']';
        var item = this.dropMenu.find(dataName);
        if(item.length) {
            this.select(item);
        }
    };

    DropdownSelect.prototype.moveByDataName = function (name) {
        var dataName = this.options.searchBy || 'name';
        // ищем в начале строки независимо от регистра
        var item = $("li", this.dropMenu).filter(function(i, e) {
            return e.dataset[dataName].toString().toLowerCase().startsWith(name);
        }.bind(this)).first();

        if(item.length) {
            this.move(item, true);
        }
    };

    DropdownSelect.prototype.onKeyDown= function (e) {
        switch(e.keyCode) {
            case UP:
                var newItem = this.hoverMenuItem.prev();
                if(newItem.length) {
                   this.move(newItem, true);
                }
                cancelEvent(e);
                return false;
            case DOWN:
                var newItem = this.hoverMenuItem.next();
                if(newItem.length) {
                    this.move(newItem, true);
                }
                cancelEvent(e);
                return false;
            case TAB:
                this.hide();
                return true;
            case ENTER:
                this.select(this.hoverMenuItem);
                this.hide();
                cancelEvent(e);
                return false;
            case ESC:
                this.hide();
                cancelEvent(e);
                return false;
        }
    };

    DropdownSelect.prototype.onKeyPress = function (e) {
        // Кроссбраузерный метод получения нажатого символа event.type должен быть keypress
        function getChar(event) {
          if (event.which == null) { // IE
            if (event.keyCode < SPACE) return null; // спец. символ
            return String.fromCharCode(event.keyCode);
          }
          if (event.which != 0 && event.charCode != 0) { // все кроме IE
            if (event.which < SPACE) return null; // спец. символ
            return String.fromCharCode(event.which); // остальные
          }
          return null; // спец. символ
        }
        var char = getChar(e);

        if (char) {
            char = char.toLowerCase();
            this.keyInputs += char;

            // сброс введенных символов через опр время после того как был введен последний символ
            if(this.timer){clearTimeout(this.timer);}
            this.timer = setTimeout(function () {
                this.keyInputs = '';
            }.bind(this), TIME_TO_CLEAR);

            this.moveByDataName(this.keyInputs);

            return false;
        }
        else{
            return true;
        }
    };

    DropdownSelect.prototype.enableKeyEvents = function () {
        this.keyInputs = '';

        this.dropDownToggleBtn.on({
            keydown: function (e) {
                this.onKeyDown(e);
            }.bind(this),

            keypress: function(e){
                this.onKeyPress(e);
            }.bind(this)
        })
    };

    // =======================================
    // INIT PLUGIN
    // =======================================

    window.DropdownSelect  = DropdownSelect;
})(jQuery);
