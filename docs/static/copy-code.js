(function() {
    'use strict';

    function addCopyButtons() {

        var codeBlocks = document.querySelectorAll('div.highlight, pre.literal-block');
        
        codeBlocks.forEach(function(block) {

            if (block.querySelector('.copy-code-btn')) return;
            
            block.style.position = 'relative';
            

            var btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.innerHTML = '📋 Copy';
            btn.title = 'Copy to clipboard';
            
            btn.addEventListener('click', function() {
                // Get the code text
                var code = block.querySelector('pre');
                if (!code) code = block;
                var text = code.innerText || code.textContent;
                

                navigator.clipboard.writeText(text).then(function() {

                    btn.innerHTML = '✓ Copied!';
                    btn.classList.add('copied');
                    
                    setTimeout(function() {
                        btn.innerHTML = '📋 Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                }).catch(function(err) {
                    console.error('Failed to copy:', err);
                    btn.innerHTML = 'Failed!';
                    setTimeout(function() {
                        btn.innerHTML = '📋 Copy';
                    }, 2000);
                });
            });
            
            block.insertBefore(btn, block.firstChild);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addCopyButtons);
    } else {
        addCopyButtons();
    }

    setTimeout(addCopyButtons, 1000);
})();
