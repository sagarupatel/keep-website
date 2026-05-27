function fmt(n) { return '$' + Math.round(n).toLocaleString(); }

function clampRate() {
  var input = document.getElementById('comm-input');
  var v = parseFloat(input.value);
  if (isNaN(v)) v = 3.0;
  v = Math.round(v * 2) / 2;
  v = Math.min(3.0, Math.max(0, v));
  input.value = v.toFixed(1);
  return v;
}

function calc() {
  var price = parseInt(document.getElementById('price-slider').value);
  var rate = clampRate();
  document.getElementById('price-display').textContent = fmt(price);

  if (rate === 0) {
    document.getElementById('rebate-eligible').style.display = 'none';
    document.getElementById('rebate-ineligible').style.display = 'block';
    document.getElementById('math-line').textContent = '';
    return;
  }

  document.getElementById('rebate-eligible').style.display = 'block';
  document.getElementById('rebate-ineligible').style.display = 'none';

  var commission = price * (rate / 100);
  var keepGets = Math.max(8000, commission / 3);
  var buyerGets = Math.max(0, commission - keepGets);

  document.getElementById('rebate-display').textContent = fmt(buyerGets);
  document.getElementById('math-line').textContent =
    'Builder pays ' + fmt(commission) +
    ' · keep retains ' + fmt(keepGets) +
    ' · you receive ' + fmt(buyerGets) + ' at closing';
}

document.getElementById('price-slider').addEventListener('input', calc);
document.getElementById('comm-input').addEventListener('change', calc);
document.getElementById('comm-input').addEventListener('blur', calc);
calc();
