function fmt(n) { return '$' + Math.round(n).toLocaleString(); }

function clampRate() {
  var el = document.getElementById('comm-input');
  if (!el) return 3.0;
  var v = parseFloat(el.value);
  if (isNaN(v)) v = 3.0;
  v = Math.round(v * 2) / 2;
  v = Math.min(3.0, Math.max(0, v));
  el.value = v.toFixed(1);
  return v;
}

function calc() {
  var price = parseInt(document.getElementById('price-slider').value);
  var rate = clampRate();
  document.getElementById('price-display').textContent = fmt(price);

  var eligible = document.getElementById('rebate-eligible');
  var ineligible = document.getElementById('rebate-ineligible');
  var mathLine = document.getElementById('math-line');

  if (rate === 0) {
    if (eligible) eligible.style.display = 'none';
    if (ineligible) ineligible.style.display = 'block';
    if (mathLine) mathLine.textContent = '';
    return;
  }

  if (eligible) eligible.style.display = 'block';
  if (ineligible) ineligible.style.display = 'none';

  var commission = price * (rate / 100);
  var keepGets = Math.max(8000, commission / 3);
  var buyerGets = Math.max(0, commission - keepGets);

  document.getElementById('rebate-display').textContent = fmt(buyerGets);
  if (mathLine) mathLine.textContent = 'Builder pays ' + fmt(commission) + ' · keep retains ' + fmt(keepGets) + ' · you receive ' + fmt(buyerGets) + ' at closing';
}

document.addEventListener('DOMContentLoaded', function() {
  var slider = document.getElementById('price-slider');
  var input = document.getElementById('comm-input');
  if (slider) slider.addEventListener('input', calc);
  if (input) {
    input.addEventListener('change', calc);
    input.addEventListener('blur', calc);
  }
  calc();
});
