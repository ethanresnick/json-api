$(function() {
  //just the conditional section widget from https://github.com/ethanresnick/ConditionalSection
  var ConditionalSections = function(){function a(a){var b,c,d=this;this.container=a;b={that:this};c=function(a){return d.handleEvent(a)};this.toggle=a.find("."+this.constants.classToggle);this.section=a.find("."+this.constants.classSection).eq(0);this.isShown=0<this.toggle.find(":checked").length;0===this.toggle.find("input, a").length&&this.toggle.contents().wrap('<a href="" onclick="return false;" />');this.toggle.find("input").length?this.toggle.change(b,c):this.toggle.click(b,c)}a.prototype.handleEvent=function(a){return this.update()};a.prototype.update=function(){this.isShown=!this.isShown;return this.render()};a.prototype.render=function(){this.container.removeClass(this.constants.classHidden+" "+this.constants.classShown).addClass(this.isShown?this.constants.classShown:this.constants.classHidden);return null};a.prototype.constants={classContainer:"conditional-section",classHidden:"condition-not-met",classShown:"condition-met",classSection:"contents",classToggle:"toggle"};return a}();

  $('.conditional-section').each(function() {
    x = new ConditionalSections($(this));
    x.render();
  });
})