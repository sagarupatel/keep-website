function filterArticles(topic, btn) {
  document.querySelectorAll('.filter-pill').forEach(function(p) { p.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.article-list-item').forEach(function(item) {
    if (topic === 'all' || item.dataset.topic === topic) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}
