module.exports = function(src) {
  src = src.trim();
  // hack ' '
  if (src == '') return '1';
  // hack 'app'
  if (src.toUpperCase() == 'APP') return 'APP';
  return src;
};
