const copyBtns = document.querySelectorAll('.copy-to-clipboard');

copyBtns.forEach(btn => {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = 'Copy';

  btn.addEventListener('mouseover', (event) => {
    event.currentTarget.appendChild(tooltip);
  })

  btn.addEventListener('mouseleave', (event) => {
    event.currentTarget.querySelector('.tooltip').textContent = 'Copy';
    event.currentTarget.querySelector('.tooltip').remove();
  })

  btn.addEventListener('click', (event) => {
    const text = event.currentTarget.parentNode.childNodes[1].innerHTML;
    let patternsToRemove = ['<div class="orange">', '<div class="dark-orange">', '<div class="light-orange">', '<div class="yellow">', '<div class="green">', '<div class="grey">', '<div class="purple">', '</div>', '<br>', '<div class="grey italic">', ' '];

    let cleanedText = text;
    for (const pattern of patternsToRemove) {
      cleanedText = cleanedText.replaceAll(pattern, "");
    }
    cleanedText = cleanedText.replaceAll('&nbsp;', " ");
    navigator.clipboard.writeText(cleanedText);
    console.log('You copied: ', cleanedText)
    event.currentTarget.querySelector('.tooltip').textContent = 'Copied';
    
  })
});