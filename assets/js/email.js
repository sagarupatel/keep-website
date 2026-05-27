(function() {
  var u = 'sagar';
  var d = 'buywithkeep.com';
  var els = document.querySelectorAll('[data-email]');
  els.forEach(function(el) {
    var address = u + '@' + d;
    el.href = 'mailto:' + address;
    if (el.hasAttribute('data-email-show')) el.textContent = address;
  });
})();
