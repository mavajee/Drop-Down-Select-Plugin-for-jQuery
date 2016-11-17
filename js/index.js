'use strict';
// =======================================
// DROPDOWN SELECT CLASS DEFENITION
// =======================================
(function($){
    var DropdownSelect = function (element, options) {
        this.element = $(element);
        this.dropMenu = $('[role="dropdown-menu"]', element);
        this.options = $.extend({onSelect: this.select}, options);


        $('[role="dropdown-toggle"]', element).on('click', this.toggle.bind(this));
        $('[role="menu-item"]', element).on('click', function(e){
          this.toggle();
          this.options.onSelect(e.target, this.element);
        }.bind(this));

        $(document).click(function (e){ // событие клика по веб-документу
          if (!this.element.is(e.target) // если клик был не по нашему блоку
              && this.element.has(e.target).length === 0) { // и не по его дочерним элементам
              this.dropMenu.hide();    // скрываем меню
          }
        }.bind(this));
    };

    DropdownSelect.prototype.toggle = function (e){
      this.dropMenu.toggle()
    };

    DropdownSelect.prototype.select = function (selectedItem, element){
        var value = $(selectedItem).data("value");
        $('[role="name"]', element).html(value);
        $('[role="value"]', element).val(value);
    };

// =======================================
// CREATE AND INIT JQUERY PLUGIN
// =======================================

    function Plugin(options) {
      return this.each(function () {
        new DropdownSelect(this, options);
      })
    }

    $.fn.dropdownSelect = Plugin;
    $.fn.Constructor = DropdownSelect;

})(jQuery);

// =======================================
// INIT COMPONENTS
// =======================================

$(function() {
// в onSelect передается функция которая вызывается при нажатии на элемент выпадающего списка
    $('#drop1').dropdownSelect(); // use default onselect callback

    $('#drop2').dropdownSelect({ //use users onselect callback
      onSelect: function (selectedItem, element) {
        var value = $(selectedItem).data("value");
        $('[role="name"]', element).html(value);
        $('[role="value"]', element).val(value);
      }
    });

});
